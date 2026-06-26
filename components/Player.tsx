/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useGame } from "./GameContext";
import AudioManager from "./AudioManager";
import { RigidBody, RapierRigidBody, CapsuleCollider } from "@react-three/rapier";

export const playerPositionGlobal = new THREE.Vector3(0, 0, 0);

const SPEED = 5;
const INTERACT_DISTANCE = 3;

interface Interactable {
  position: THREE.Vector3;
  onInteract: () => void;
}

// Procedural fabric shader builder for player uniform, hat, and apron
const getPlayerFabricShader = (
  colorStr: string,
  uniformsRef: React.MutableRefObject<any>,
  noiseFreq = 12.0,
  noiseAmp = 0.012
) => {
  const fabricColor = new THREE.Color(colorStr);
  return (shader: THREE.Shader) => {
    shader.uniforms.uTime = { value: 0 };
    uniformsRef.current = shader.uniforms;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uTime;
      varying vec3 vWorldNormalCustom;
      varying vec3 vWorldPositionCustom;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      // Add fine sine folds along position and time
      float folds = sin(position.y * ${noiseFreq.toFixed(1)} + uTime * 2.5) * ${noiseAmp.toFixed(4)} * (1.0 - abs(position.y));
      folds += cos(position.x * 10.0 + position.z * 10.0) * (${(noiseAmp * 0.5).toFixed(4)});
      transformed += normal * folds;
      vWorldNormalCustom = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPositionCustom = (modelMatrix * vec4(position, 1.0)).xyz;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      varying vec3 vWorldNormalCustom;
      varying vec3 vWorldPositionCustom;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      vec3 V = normalize(cameraPosition - vWorldPositionCustom);
      float rim = 1.0 - max(dot(normalize(vWorldNormalCustom), V), 0.0);
      rim = pow(rim, 3.0);
      // Soft high-tech cyan/white glow around edges
      totalEmissiveRadiance += vec3(0.2, 0.7, 1.0) * rim * 0.3;
      `
    );
  };
};

export function Player({ interactables }: { interactables: Interactable[] }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<THREE.Group>(null);
  const handRef = useRef<THREE.Object3D>(null);
  const itemRef = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();
  const { hideDialog, inventory, activeApronColor } = useGame();
  
  const velocity = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const isMovingRef = useRef(false);
  const cameraTargetRef = useRef<THREE.Vector3 | null>(null);

  // References to limbs for procedural movement
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const hatRef = useRef<THREE.Group>(null);
  const towelRef = useRef<THREE.Mesh>(null);

  // Uniform material references
  const uniformUniformsRef = useRef<any>(null);
  const hatUniformsRef = useRef<any>(null);
  const apronUniformsRef = useRef<any>(null);

  // Stop footsteps on unmount
  useEffect(() => {
    return () => {
      AudioManager.setFootstepsActive(false);
    };
  }, []);

  // Handle item pickup trigger to initialize offset & random rotation
  const prevInventory = useRef(inventory);
  useEffect(() => {
    if (prevInventory.current === "none" && inventory !== "none") {
      if (itemRef.current) {
        // On pickup: set position to hand offset + small random rotation for natural feel
        itemRef.current.position.set(0.5, 0.2, -0.2); // pick up offset
        itemRef.current.rotation.set(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8
        );
      }
    }
    prevInventory.current = inventory;
  }, [inventory]);

  // Handle interaction with SPACE
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        if (!rigidBodyRef.current) return;
        const translation = rigidBodyRef.current.translation();
        const playerPos = new THREE.Vector3(translation.x, translation.y, translation.z);
        
        let interacted = false;
        for (const inter of interactables) {
          if (playerPos.distanceTo(inter.position) < INTERACT_DISTANCE) {
            inter.onInteract();
            interacted = true;
            break;
          }
        }
        
        if (!interacted) {
          hideDialog(); // Dismiss dialog if pressing space nowhere
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [interactables, hideDialog]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;
    const keys = getKeys();

    velocity.set(0, 0, 0);

    if (keys.forward) velocity.z -= 1;
    if (keys.backward) velocity.z += 1;
    if (keys.left) velocity.x -= 1;
    if (keys.right) velocity.x += 1;

    const isMoving = velocity.length() > 0;
    if (isMoving !== isMovingRef.current) {
      isMovingRef.current = isMoving;
      AudioManager.setFootstepsActive(isMoving);
    }

    if (isMoving) {
      velocity.normalize().multiplyScalar(SPEED);
    }

    // Preserve vertical velocity for gravity response
    const currentLinVel = rigidBodyRef.current.linvel();
    rigidBodyRef.current.setLinvel({
      x: velocity.x,
      y: currentLinVel.y,
      z: velocity.z
    }, true);

    // Look at direction
    const translation = rigidBodyRef.current.translation();
    const playerPos = new THREE.Vector3(translation.x, translation.y, translation.z);
    playerPositionGlobal.copy(playerPos);

    if (isMoving && visualRef.current) {
      direction.copy(velocity).add(playerPos);
      direction.y = playerPos.y; // look horizontally
      visualRef.current.lookAt(direction);
    }

    const time = state.clock.getElapsedTime();

    // Update custom shader uniforms
    if (uniformUniformsRef.current) uniformUniformsRef.current.uTime.value = time;
    if (hatUniformsRef.current) hatUniformsRef.current.uTime.value = time;
    if (apronUniformsRef.current) apronUniformsRef.current.uTime.value = time;

    // --- Walking Animations ---
    const swingFreq = 14.0;
    const maxSwingAngle = isMoving ? 0.65 : 0.0;
    
    // Leg & arm swinging based on movement velocity
    const legSwingL = Math.sin(time * swingFreq) * maxSwingAngle;
    const legSwingR = -Math.sin(time * swingFreq) * maxSwingAngle;

    // Bounce height during walking
    const walkBounce = isMoving ? Math.abs(Math.sin(time * swingFreq * 2)) * 0.05 : 0;

    let armSwingL = legSwingR * 0.9;
    let armSwingR = legSwingL * 0.9;
    let targetArmZ_L = -0.05;
    let targetArmZ_R = 0.05;

    if (inventory !== "none") {
      // Carrying: lift arms up/forward to look like holding an item
      armSwingL = -0.7 + Math.sin(time * 2.5) * 0.04;
      armSwingR = -0.7 - Math.cos(time * 2.5) * 0.04;
      targetArmZ_L = -0.22;
      targetArmZ_R = 0.22;
    }

    // Smoothly lerp leg and arm rotations for maximum organic feeling
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, legSwingL, 0.2);
      // Bend knees slightly during swing
      const leftKnee = leftLegRef.current.children[1] as THREE.Mesh;
      if (leftKnee) {
        const targetKneeRot = isMoving ? Math.max(0, -Math.sin(time * swingFreq + Math.PI/2)) * 0.4 : 0;
        leftKnee.rotation.x = THREE.MathUtils.lerp(leftKnee.rotation.x, targetKneeRot, 0.2);
      }
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, legSwingR, 0.2);
      // Bend knees slightly during swing
      const rightKnee = rightLegRef.current.children[1] as THREE.Mesh;
      if (rightKnee) {
        const targetKneeRot = isMoving ? Math.max(0, Math.sin(time * swingFreq + Math.PI/2)) * 0.4 : 0;
        rightKnee.rotation.x = THREE.MathUtils.lerp(rightKnee.rotation.x, targetKneeRot, 0.2);
      }
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, armSwingL, 0.2);
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, targetArmZ_L, 0.2);
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, armSwingR, 0.2);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetArmZ_R, 0.2);
    }

    // Towel sway physics
    if (towelRef.current) {
      const targetTowelRotX = isMoving ? 0.15 + Math.sin(time * swingFreq * 2) * 0.12 : 0;
      towelRef.current.rotation.x = THREE.MathUtils.lerp(towelRef.current.rotation.x, targetTowelRotX, 0.12);
    }

    // --- Head Bob and Camera-Relative Head Turn ---
    if (headRef.current && visualRef.current) {
      // 1. Simple head bob (slow idle, faster walk)
      const bobFreq = isMoving ? 14.0 : 2.2;
      const bobAmp = isMoving ? 0.04 : 0.012;
      const headBobY = Math.sin(time * bobFreq) * bobAmp - walkBounce;
      headRef.current.position.y = 1.05 + headBobY;

      // Subtle hat drag sway on movement
      if (hatRef.current) {
        const targetHatRotX = isMoving ? Math.sin(time * swingFreq) * 0.06 + 0.02 : 0;
        hatRef.current.rotation.x = THREE.MathUtils.lerp(hatRef.current.rotation.x, targetHatRotX, 0.12);
      }

      // 2. Camera-relative head turn (look slightly back/up at the camera view direction)
      const headWorldPos = new THREE.Vector3();
      headRef.current.getWorldPosition(headWorldPos);
      const toCamera = state.camera.position.clone().sub(headWorldPos).normalize();

      // Horizontal yaw angle relative to player body direction
      const targetHeadYaw = Math.atan2(toCamera.x, toCamera.z) - visualRef.current.rotation.y;
      const targetHeadPitch = -Math.asin(toCamera.y);

      // Clamp head turn to natural limits so chef doesn't break neck
      const yawLimit = Math.PI / 4.5; // ~40 degrees
      const pitchLimit = Math.PI / 7; // ~25 degrees
      const clampedYaw = Math.max(-yawLimit, Math.min(yawLimit, targetHeadYaw));
      const clampedPitch = Math.max(-pitchLimit, Math.min(pitchLimit, targetHeadPitch));

      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, clampedYaw, 0.12);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, clampedPitch, 0.12);
    }

    // --- Carrying System Animating ---
    if (itemRef.current && handRef.current) {
      const handPos = handRef.current.position;
      
      // Bob/Sway: subtle item bob/sway based on player velocity (sin wave)
      const bobFreq = isMoving ? 12 : 2.5;
      const bobAmpY = isMoving ? 0.05 : 0.012;
      const bobAmpX = isMoving ? 0.04 : 0.0;
      
      const bobY = Math.sin(time * bobFreq) * bobAmpY;
      const bobX = Math.cos(time * (bobFreq / 2)) * bobAmpX;
      
      // Target position incorporates hand base position + bobbing/swaying
      const targetPos = new THREE.Vector3(
        handPos.x + bobX,
        handPos.y + bobY,
        handPos.z
      );

      // Lerp position to target with damping for weight feel
      itemRef.current.position.lerp(targetPos, 0.15);

      // Rotate back towards straight alignment with dampening slant when moving
      const targetRotation = new THREE.Euler(
        isMoving ? -0.15 + Math.sin(time * 6) * 0.05 : 0,
        0,
        isMoving ? Math.sin(time * 6) * 0.1 : 0
      );
      
      itemRef.current.rotation.x = THREE.MathUtils.lerp(itemRef.current.rotation.x, targetRotation.x, 0.12);
      itemRef.current.rotation.y = THREE.MathUtils.lerp(itemRef.current.rotation.y, targetRotation.y, 0.12);
      itemRef.current.rotation.z = THREE.MathUtils.lerp(itemRef.current.rotation.z, targetRotation.z, 0.12);
    }

    // Follow camera with smoothed movement, bobbing, and breathing
    // Gentle sine bob to camera position based on walk cycle (frequency tied to speed)
    const walkBobFreq = 11.0;
    const walkBobAmp = 0.07;
    const walkBobY = isMoving ? Math.sin(time * walkBobFreq) * walkBobAmp : 0;
    const walkBobX = isMoving ? Math.cos(time * (walkBobFreq / 2)) * (walkBobAmp * 0.4) : 0;

    // Very subtle breathing (slow long sine on Y)
    const breathFreq = 1.6;
    const breathAmp = 0.03;
    const breathY = Math.sin(time * breathFreq) * breathAmp;

    // Damp all movement for smooth feel
    const cameraPosition = playerPos.clone();
    cameraPosition.z += 8;
    cameraPosition.y += 6 + walkBobY + breathY;
    cameraPosition.x += walkBobX;
    
    state.camera.position.lerp(cameraPosition, 0.06);

    const cameraTarget = playerPos.clone();
    cameraTarget.y += 1.8 + (walkBobY * 0.3); // Let some of the bob translate into lookAt target
    
    if (!cameraTargetRef.current) {
      cameraTargetRef.current = cameraTarget.clone();
    } else {
      cameraTargetRef.current.lerp(cameraTarget, 0.06);
    }
    
    state.camera.lookAt(cameraTargetRef.current);
  });

  return (
    <RigidBody 
      ref={rigidBodyRef} 
      position={[0, 0.1, 5]} 
      type="dynamic" 
      enabledRotations={[false, false, false]}
      colliders={false}
      name="player"
    >
      <group ref={visualRef}>
        
        {/* ==================== TORSO / BODY ==================== */}
        {/* Main Double-Breasted Chef's Jacket (Capsule) */}
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.24, 0.45, 16, 16]} />
          <meshStandardMaterial 
            key="chef-torso"
            color="#f8fafc" // Off-white jacket
            roughness={0.4} 
            onBeforeCompile={getPlayerFabricShader("#f8fafc", uniformUniformsRef, 12.0, 0.01)}
          />
        </mesh>

        {/* High-Tech Collar Wrap */}
        <mesh position={[0, 0.88, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.15, 0.035, 8, 16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
        </mesh>

        {/* Shoulder Epaulets / Protective Culinary Guards */}
        <mesh position={[-0.26, 0.83, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.1, 0.04, 0.18]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0.26, 0.83, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.1, 0.04, 0.18]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.5} />
        </mesh>

        {/* Double-Breasted Shiny Brass Buttons */}
        {[-0.07, 0.07].map((xOffset) => (
          <group key={`row-${xOffset}`}>
            {[0.52, 0.62, 0.72].map((yHeight) => (
              <mesh key={`btn-${yHeight}`} position={[xOffset, yHeight, -0.215]} castShadow>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.15} metalness={0.9} />
              </mesh>
            ))}
          </group>
        ))}


        {/* ==================== HEAD & CYBER-VISOR ==================== */}
        {/* Highly-detailed Sci-Fi Helmet Head Group */}
        <group ref={headRef} position={[0, 1.05, 0]}>
          
          {/* Main Helmet Spherical Shell */}
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.6} /> {/* Dark tech shell */}
          </mesh>

          {/* Golden Panel Frame around Visor */}
          <mesh position={[0, 0.01, -0.04]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.15, 0.015, 8, 24]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Sleek Polished Dark Glass Visor */}
          <mesh position={[0, 0.01, -0.105]} scale={[1.1, 0.8, 0.7]} castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.95} />
          </mesh>

          {/* Pulsing Cyan Holographic Laser Visor Band */}
          <mesh position={[0, 0.02, -0.178]} scale={[1.0, 0.25, 0.4]}>
            <boxGeometry args={[0.22, 0.12, 0.06]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>

          {/* Tactical Ear Comms Pods (Sides) */}
          <mesh position={[0.175, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[-0.175, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
          </mesh>
          
          {/* Cyan Comm Status LEDs */}
          <mesh position={[0.19, 0, -0.015]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>
          <mesh position={[-0.19, 0, -0.015]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>

          {/* ==================== THE CHEF HAT ==================== */}
          {/* Stylized puffy chef's hat with brand emblem */}
          <group ref={hatRef} position={[0, 0.14, 0]}>
            
            {/* Rigid base cylinder */}
            <mesh castShadow position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
              <meshStandardMaterial 
                key="chef-hat-band"
                color="#f8fafc" 
                roughness={0.5} 
              />
            </mesh>

            {/* Solid Silver Brand Crest on Hat Band */}
            <mesh position={[0, 0.04, -0.125]} rotation={[0.0, 0, 0]} castShadow>
              <boxGeometry args={[0.04, 0.03, 0.01]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Organic puffy main crown (3 overlapping spheres for artistic volume) */}
            <mesh castShadow position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial 
                key="chef-hat-top-1"
                color="#ffffff" 
                roughness={0.45} 
                onBeforeCompile={getPlayerFabricShader("#ffffff", hatUniformsRef, 14.0, 0.016)}
              />
            </mesh>
            <mesh castShadow position={[-0.04, 0.19, -0.02]} scale={[0.8, 0.8, 0.8]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.45} />
            </mesh>
            <mesh castShadow position={[0.04, 0.19, 0.02]} scale={[0.8, 0.8, 0.8]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.45} />
            </mesh>
          </group>

        </group>


        {/* ==================== APRON & TEA TOWEL ==================== */}
        {/* Front Apron Bib Layer */}
        <mesh position={[0, 0.52, -0.155]} rotation={[0.06, 0, 0]} castShadow>
          <boxGeometry args={[0.26, 0.36, 0.02]} />
          <meshStandardMaterial 
            key={`chef-apron-${activeApronColor}`}
            color={activeApronColor} 
            roughness={0.6} 
            onBeforeCompile={getPlayerFabricShader(activeApronColor, apronUniformsRef, 10.0, 0.012)}
          />
        </mesh>

        {/* Apron Halter Strap (looping over neck) */}
        <mesh position={[0, 0.74, -0.135]} rotation={[Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.015, 0.14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Apron Center Pouch */}
        <mesh position={[0, 0.44, -0.168]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.01]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Dynamic Folded Tea Towel hanging out of the apron side strap */}
        <group position={[0.18, 0.41, -0.05]} rotation={[0, 0.4, 0]}>
          <mesh ref={towelRef} castShadow position={[0, -0.11, 0]}>
            <boxGeometry args={[0.07, 0.22, 0.01]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
          {/* Hanging ring clasp */}
          <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.025, 0.005, 4, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>


        {/* ==================== HEAVY UTILITY BELT ==================== */}
        <group position={[0, 0.42, 0]}>
          {/* Main Leather Strap */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.25, 0.028, 8, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>

          {/* Solid Steel Waist Buckle */}
          <mesh position={[0, 0, -0.275]} castShadow>
            <boxGeometry args={[0.07, 0.05, 0.02]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
          
          {/* Back Utility Ammo/Tech Pouches */}
          <mesh position={[-0.14, 0.01, 0.21]} rotation={[0, Math.PI / 5, 0]} castShadow>
            <boxGeometry args={[0.07, 0.08, 0.04]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          <mesh position={[0.14, 0.01, 0.21]} rotation={[0, -Math.PI / 5, 0]} castShadow>
            <boxGeometry args={[0.07, 0.08, 0.04]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>

          {/* HANGING KITCHEN TOOLS */}
          {/* 1. Cyber Thermal Spatula (with orange glowing active blade!) */}
          <group position={[0.24, -0.04, 0.08]} rotation={[0, -Math.PI/4, 0.15]}>
            {/* Spatula Steel Tang */}
            <mesh castShadow>
              <cylinderGeometry args={[0.009, 0.009, 0.15, 6]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.9} />
            </mesh>
            {/* Grip handle wrap */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 6]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            {/* Thermal Laser Blade */}
            <mesh position={[0, -0.11, 0]} castShadow>
              <boxGeometry args={[0.045, 0.07, 0.008]} />
              <meshStandardMaterial color="#f97316" roughness={0.1} emissive="#f97316" emissiveIntensity={1.5} />
            </mesh>
          </group>

          {/* 2. Sleek digital temp-probe sensor container */}
          <group position={[-0.24, -0.04, 0.08]} rotation={[0, Math.PI/4, -0.15]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.13, 8]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
            </mesh>
            {/* Polished chrome tip */}
            <mesh position={[0, -0.075, 0]} castShadow>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Status led indicator */}
            <mesh position={[0, 0.04, 0.014]}>
              <sphereGeometry args={[0.008, 6, 6]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>
        </group>


        {/* ==================== CYBERNETIC LIMBS & GLIDES ==================== */}
        
        {/* --- LEFT ARM GROUP --- */}
        <group ref={leftArmRef} position={[-0.32, 0.8, 0]}>
          {/* Shoulder Pivot cap */}
          <mesh castShadow>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Upper Arm Segment */}
          <mesh position={[0, -0.11, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.048, 0.16, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Elbow Joint Shield */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          {/* Lower Sleeve Forearm */}
          <mesh position={[0, -0.28, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.044, 0.15, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
          </mesh>
          {/* Tech Kitchen Glove Hand */}
          <mesh position={[0, -0.38, 0]} castShadow>
            <sphereGeometry args={[0.052, 10, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>

          {/* PROJECTED HOLOGRAPHIC CULINARY WRIST HUD (LEFT WRIST) */}
          <group position={[-0.05, -0.31, -0.06]} rotation={[0.4, -0.3, 0]}>
            {/* HUD Glass Screen Panel */}
            <mesh scale={[1.2, 0.8, 0.1]}>
              <boxGeometry args={[0.15, 0.15, 0.02]} />
              <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} depthWrite={false} />
            </mesh>
            {/* Screen Neon Edge */}
            <mesh>
              <torusGeometry args={[0.08, 0.003, 4, 16]} />
              <meshBasicMaterial color="#22d3ee" />
            </mesh>
          </group>
        </group>

        {/* --- RIGHT ARM GROUP --- */}
        <group ref={rightArmRef} position={[0.32, 0.8, 0]}>
          {/* Shoulder Pivot cap */}
          <mesh castShadow>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Upper Arm Segment */}
          <mesh position={[0, -0.11, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.048, 0.16, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Elbow Joint Shield */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          {/* Lower Sleeve Forearm */}
          <mesh position={[0, -0.28, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.044, 0.15, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
          </mesh>
          {/* Tech Kitchen Glove Hand */}
          <mesh position={[0, -0.38, 0]} castShadow>
            <sphereGeometry args={[0.052, 10, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        </group>


        {/* --- LEFT LEG & HEAVY BOOT GROUP --- */}
        <group ref={leftLegRef} position={[-0.14, 0.38, 0]}>
          {/* Upper thigh casing */}
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.058, 0.15, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          {/* Knee joint connector */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <sphereGeometry args={[0.052, 8, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.4} />
          </mesh>
          {/* Lower shin guard */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.058, 0.052, 0.16, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
          
          {/* Multi-layered Heavy Cybernetic Chef Boot */}
          <group position={[0, -0.33, -0.02]}>
            {/* Boot main upper */}
            <mesh castShadow>
              <boxGeometry args={[0.09, 0.06, 0.12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
            {/* Thick Sole Plate */}
            <mesh position={[0, -0.04, 0.01]} castShadow>
              <boxGeometry args={[0.1, 0.025, 0.15]} />
              <meshStandardMaterial color="#090d16" roughness={0.8} />
            </mesh>
            {/* Hardened Steel Toe Plate */}
            <mesh position={[0, -0.01, -0.06]} castShadow>
              <sphereGeometry args={[0.048, 8, 8]} scale={[1, 0.8, 1]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* --- RIGHT LEG & HEAVY BOOT GROUP --- */}
        <group ref={rightLegRef} position={[0.14, 0.38, 0]}>
          {/* Upper thigh casing */}
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.058, 0.15, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          {/* Knee joint connector */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <sphereGeometry args={[0.052, 8, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.4} />
          </mesh>
          {/* Lower shin guard */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.058, 0.052, 0.16, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
          
          {/* Multi-layered Heavy Cybernetic Chef Boot */}
          <group position={[0, -0.33, -0.02]}>
            {/* Boot main upper */}
            <mesh castShadow>
              <boxGeometry args={[0.09, 0.06, 0.12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
            {/* Thick Sole Plate */}
            <mesh position={[0, -0.04, 0.01]} castShadow>
              <boxGeometry args={[0.1, 0.025, 0.15]} />
              <meshStandardMaterial color="#090d16" roughness={0.8} />
            </mesh>
            {/* Hardened Steel Toe Plate */}
            <mesh position={[0, -0.01, -0.06]} castShadow>
              <sphereGeometry args={[0.048, 8, 8]} scale={[1, 0.8, 1]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>


        {/* ==================== CARRYING TARGETS & SYSTEMS ==================== */}
        {/* Invisible Hand Object3D attached forward to the body */}
        <object3D ref={handRef} position={[0, 0.65, -0.5]} />

        {/* Carried Item Container with physics sways */}
        <group ref={itemRef} visible={inventory !== "none"}>
          {inventory === "memory" && (
            <mesh castShadow>
              <octahedronGeometry args={[0.25]} />
              <meshStandardMaterial color="#facc15" roughness={0.1} metalness={0.8} emissive="#facc15" emissiveIntensity={0.3} />
            </mesh>
          )}
          {inventory === "search" && (
            <mesh castShadow>
              <torusGeometry args={[0.18, 0.06, 8, 24]} />
              <meshStandardMaterial color="#10b981" roughness={0.1} metalness={0.8} emissive="#10b981" emissiveIntensity={0.3} />
            </mesh>
          )}
          {inventory === "research" && (
            <mesh castShadow>
              <coneGeometry args={[0.18, 0.4, 8]} />
              <meshStandardMaterial color="#c084fc" roughness={0.1} metalness={0.8} emissive="#c084fc" emissiveIntensity={0.3} />
            </mesh>
          )}

          {/* Hybrid Combinations */}
          {inventory === "memory_search" && (
            <group>
              <mesh position={[-0.15, 0, 0]} castShadow>
                <octahedronGeometry args={[0.18]} />
                <meshStandardMaterial color="#facc15" roughness={0.1} metalness={0.8} emissive="#facc15" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[0.15, 0, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                <torusGeometry args={[0.14, 0.04, 8, 24]} />
                <meshStandardMaterial color="#10b981" roughness={0.1} metalness={0.8} emissive="#10b981" emissiveIntensity={0.3} />
              </mesh>
            </group>
          )}
          {inventory === "memory_research" && (
            <group>
              <mesh position={[-0.15, 0, 0]} castShadow>
                <octahedronGeometry args={[0.18]} />
                <meshStandardMaterial color="#facc15" roughness={0.1} metalness={0.8} emissive="#facc15" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[0.15, -0.05, 0]} castShadow>
                <coneGeometry args={[0.14, 0.3, 8]} />
                <meshStandardMaterial color="#c084fc" roughness={0.1} metalness={0.8} emissive="#c084fc" emissiveIntensity={0.3} />
              </mesh>
            </group>
          )}
          {inventory === "search_research" && (
            <group>
              <mesh position={[-0.15, 0, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                <torusGeometry args={[0.14, 0.04, 8, 24]} />
                <meshStandardMaterial color="#10b981" roughness={0.1} metalness={0.8} emissive="#10b981" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[0.15, -0.05, 0]} castShadow>
                <coneGeometry args={[0.14, 0.3, 8]} />
                <meshStandardMaterial color="#c084fc" roughness={0.1} metalness={0.8} emissive="#c084fc" emissiveIntensity={0.3} />
              </mesh>
            </group>
          )}
          {inventory === "all_combined" && (
            <group>
              <mesh position={[-0.15, -0.1, 0]} castShadow>
                <octahedronGeometry args={[0.14]} />
                <meshStandardMaterial color="#facc15" roughness={0.1} metalness={0.8} emissive="#facc15" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[0.15, -0.1, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                <torusGeometry args={[0.12, 0.03, 8, 24]} />
                <meshStandardMaterial color="#10b981" roughness={0.1} metalness={0.8} emissive="#10b981" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[0, 0.15, 0]} castShadow>
                <coneGeometry args={[0.12, 0.25, 8]} />
                <meshStandardMaterial color="#c084fc" roughness={0.1} metalness={0.8} emissive="#c084fc" emissiveIntensity={0.3} />
              </mesh>
              {/* Connective micro glowing wires/bonds */}
              <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.7} />
              </mesh>
              <mesh position={[-0.07, 0.02, 0]} rotation={[0, 0, -Math.PI / 3]}>
                <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.7} />
              </mesh>
              <mesh position={[0.07, 0.02, 0]} rotation={[0, 0, Math.PI / 3]}>
                <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.7} />
              </mesh>
            </group>
          )}
        </group>

      </group>

      {/* Accurate Rapier Physics Collider encapsulating the beautiful chef's body */}
      <CapsuleCollider args={[0.4, 0.4]} position={[0, 0.8, 0]} />
    </RigidBody>
  );
}
