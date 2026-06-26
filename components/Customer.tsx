"use client";

import React, { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGame, QUESTS } from "./GameContext";
import { Text, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import { Typewriter } from "./Typewriter";

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  scale: number;
}

// Reusable skin/head material shader with cyber cyan rim lighting
const getSkinShader = (colorStr: string) => {
  const skinColor = new THREE.Color(colorStr);
  return (shader: THREE.Shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      varying vec3 vWorldNormalCustom;
      varying vec3 vWorldPositionCustom;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
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
      rim = pow(rim, 3.5);
      totalEmissiveRadiance += vec3(0.2, 0.7, 1.0) * rim * 0.45; // skin rim glow
      `
    );
  };
};

// Outer clothing folds or jacket layer shader builder with folds and rim lighting
const getClothingShader = (colorStr: string, uniformsRef: React.MutableRefObject<any>) => {
  const coatColor = new THREE.Color(colorStr);
  return (shader: THREE.Shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uClothingColor = { value: coatColor };
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
      // Offset folds using a simple sine wave and coordinate noise
      float folds = sin(position.y * 14.0 + uTime * 2.0) * 0.015 * (1.0 - abs(position.y));
      folds += cos(position.x * 12.0 + position.z * 12.0) * 0.008;
      transformed += normal * folds;
      
      vWorldNormalCustom = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPositionCustom = (modelMatrix * vec4(position, 1.0)).xyz;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uTime;
      varying vec3 vWorldNormalCustom;
      varying vec3 vWorldPositionCustom;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      vec3 V = normalize(cameraPosition - vWorldPositionCustom);
      float rim = 1.0 - max(dot(normalize(vWorldNormalCustom), V), 0.0);
      rim = pow(rim, 3.5);
      totalEmissiveRadiance += vec3(0.2, 0.7, 1.0) * rim * 0.55; // clothing cyan rim glow
      `
    );
  };
};

// Hair/beard strands wind sway shader
const getHairShader = (colorStr: string, listRef: React.MutableRefObject<any[]>) => {
  const hairColor = new THREE.Color(colorStr);
  return (shader: THREE.Shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uHairColor = { value: hairColor };
    listRef.current.push(shader.uniforms);

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uTime;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      // Sway hair strands in wind using sin(time + local position)
      float wind = sin(uTime * 4.0 + position.y * 15.0 + position.x * 8.0) * 0.045 * (position.y + 0.15);
      transformed.x += wind;
      transformed.z += wind * 0.5;
      `
    );
  };
};

// Cheap rim lighting helper for custom materials onBeforeCompile
const addRimLight = (colorStr: string, intensity = 0.5, power = 3.0) => {
  const rimColor = new THREE.Color(colorStr);
  return (shader: THREE.Shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      varying vec3 vWorldNormalCustom;
      varying vec3 vWorldPositionCustom;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
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
      rim = pow(rim, ${power.toFixed(1)});
      totalEmissiveRadiance += vec3(${rimColor.r.toFixed(3)}, ${rimColor.g.toFixed(3)}, ${rimColor.b.toFixed(3)}) * rim * ${intensity.toFixed(3)};
      `
    );
  };
};

const EmotionParticles = ({ questState }: { questState: string }) => {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const spawnTimer = useRef(0);

  useFrame((state, delta) => {
    spawnTimer.current += delta;
    if (spawnTimer.current > 1.4) {
      spawnTimer.current = 0;

      let text = "?";
      let color = "#3b82f6";
      if (questState === "completed" || questState === "answered") {
        text = "♥";
        color = "#ec4899";
      } else if (questState === "active") {
        text = "?";
        color = "#f97316";
      } else {
        text = "★";
        color = "#eab308";
      }

      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * delta,
            y: p.y + p.vy * delta,
            z: p.z + p.vz * delta,
            life: p.life - delta,
          }))
          .filter((p) => p.life > 0);

        if (next.length < 8) {
          next.push({
            id: Math.random(),
            x: (Math.random() - 0.5) * 0.3,
            y: 1.6 + Math.random() * 0.1,
            z: (Math.random() - 0.5) * 0.3,
            vx: (Math.random() - 0.5) * 0.2,
            vy: 0.2 + Math.random() * 0.2,
            vz: (Math.random() - 0.5) * 0.2,
            life: 2.0,
            maxLife: 2.0,
            scale: 0.15 + Math.random() * 0.15,
            color,
            text,
          });
        }
        return next;
      });
    } else {
      setParticles((prev) => 
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx * delta,
          y: p.y + p.vy * delta,
          z: p.z + p.vz * delta,
          life: p.life - delta,
        })).filter((p) => p.life > 0)
      );
    }
  });

  return (
    <>
      {questState === "completed" && (
        <Text position={[0, 1.85, 0]} fontSize={0.3} color="#eab308" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZg.ttf">
          !
        </Text>
      )}
      {particles.map((p) => {
        const ratio = p.life / p.maxLife;
        return (
          <group key={p.id} position={[p.x, p.y, p.z]} scale={p.scale * ratio}>
            <Text
              fontSize={1.0}
              color={p.color}
              anchorX="center"
              anchorY="middle"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZg.ttf"
            >
              {p.text}
            </Text>
          </group>
        );
      })}
    </>
  );
};

export function Customer({ position }: { position: [number, number, number] }) {
  const { day, questState, dialog, interactWithCustomer } = useGame();

  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  
  // Track proximity to avoid spamming
  const wasCloseRef = useRef(false);

  const isCompleted = day >= QUESTS.length;
  const currentQuest = !isCompleted ? QUESTS[day] : null;
  const charId = currentQuest ? currentQuest.customer : "none"; // "timmy" | "sarah" | "grandpa"

  const isThisCustomerSpeaking = useMemo(() => {
    if (isCompleted || !dialog) return false;
    return dialog.toLowerCase().startsWith(charId.toLowerCase() + ":");
  }, [dialog, charId, isCompleted]);

  const cleanDialogueText = useMemo(() => {
    if (isCompleted || !dialog) return "";
    const colonIndex = dialog.indexOf(":");
    if (colonIndex !== -1) {
      let text = dialog.substring(colonIndex + 1).trim();
      if (text.startsWith('"') && text.endsWith('"')) {
        text = text.substring(1, text.length - 1);
      }
      return text;
    }
    return dialog;
  }, [dialog, isCompleted]);

  // Distinct uniform styling per character
  const charStyle = useMemo(() => {
    if (isCompleted) {
      return {
        clothingColor: "#a855f7",
        skinColor: "#fecaca",
        hairColor: "#1e293b",
        hasBeard: false,
        hasCap: false,
      };
    }
    switch (charId) {
      case "timmy":
        return {
          clothingColor: "#f97316", // Bright energetic orange
          skinColor: "#fecaca",     // Peach pink skin
          hairColor: "#facc15",     // Yellow spiky hair/cap
          hasBeard: false,
          hasCap: true,
        };
      case "sarah":
        return {
          clothingColor: "#4f46e5", // Professional indigo
          skinColor: "#fbcfe8",     // Soft rose skin
          hairColor: "#451a03",     // Dark brown bob hair
          hasBeard: false,
          hasCap: false,
        };
      case "grandpa":
        return {
          clothingColor: "#047857", // Warm forest green
          skinColor: "#ffedd5",     // Warm tan skin
          hairColor: "#e2e8f0",     // Silvery grey hair
          hasBeard: true,
          hasCap: false,
        };
      case "elara":
        return {
          clothingColor: "#ec4899", // Sleek tech-magenta lab scientist coat
          skinColor: "#fecaca",     // Soft peach skin
          hairColor: "#7c3aed",     // Deep purple workspace bun hair
          hasBeard: false,
          hasCap: false,
        };
      case "nova":
        return {
          clothingColor: "#06b6d4", // Admiral cyan high-tech space suit
          skinColor: "#fed7aa",     // Warm space tan skin
          hairColor: "#1e293b",     // Deep space black hair
          hasBeard: false,
          hasCap: true,
        };
      default:
        return {
          clothingColor: "#a855f7",
          skinColor: "#fecaca",
          hairColor: "#1e293b",
          hasBeard: false,
          hasCap: false,
        };
    }
  }, [charId, isCompleted]);

  // Procedural face shader material to blend between 3-4 mouth/eye shapes
  const faceMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uExpression: { value: 0 }, // 0: neutral, 1: talking, 2: happy, 3: surprised
        uTalkingIntensity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uExpression;
        uniform float uTalkingIntensity;
        varying vec2 vUv;

        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0);
          return length(pa - ba*h) - r;
        }

        void main() {
          vec2 uv = vUv;
          
          // Style: expressive flat vectors directly on head surface
          vec3 eyeColor = vec3(0.08, 0.08, 0.22);
          vec3 mouthColorNeutral = vec3(0.08, 0.08, 0.22);
          vec3 mouthColorOpen = vec3(0.75, 0.1, 0.15); // rosy interior
          
          vec2 leftEyeCenter = vec2(0.32, 0.62);
          vec2 rightEyeCenter = vec2(0.68, 0.62);
          vec2 mouthCenter = vec2(0.5, 0.35);

          // 1. EYES SDF (Neutral, Talking, Happy, Surprised)
          float eyeNeut_L = length((uv - leftEyeCenter) / vec2(0.75, 1.25)) - 0.012;
          float eyeNeut_R = length((uv - rightEyeCenter) / vec2(0.75, 1.25)) - 0.012;
          float eyeNeutral = min(eyeNeut_L, eyeNeut_R);

          float eyeTalk_L = length((uv - leftEyeCenter) / vec2(0.85, 1.1)) - 0.022;
          float eyeTalk_R = length((uv - rightEyeCenter) / vec2(0.85, 1.1)) - 0.022;
          float eyeTalking = min(eyeTalk_L, eyeTalk_R);

          // Happy bending upwards
          vec2 p_le_happy = uv - leftEyeCenter;
          p_le_happy.y += p_le_happy.x * p_le_happy.x * 5.5;
          float eyeHappy_L = sdCapsule(p_le_happy, vec2(-0.028, -0.005), vec2(0.028, -0.005), 0.0065);

          vec2 p_re_happy = uv - rightEyeCenter;
          p_re_happy.y += p_re_happy.x * p_re_happy.x * 5.5;
          float eyeHappy_R = sdCapsule(p_re_happy, vec2(-0.028, -0.005), vec2(0.028, -0.005), 0.0065);
          float eyeHappy = min(eyeHappy_L, eyeHappy_R);

          // Surprised wide circular eyes
          float eyeSurp_L = length(uv - leftEyeCenter) - 0.034;
          float eyeSurp_R = length(uv - rightEyeCenter) - 0.034;
          float eyeSurprised = min(eyeSurp_L, eyeSurp_R);

          float eyeSDF = 999.0;
          if (uExpression < 1.0) {
            eyeSDF = mix(eyeNeutral, eyeTalking, uExpression);
          } else if (uExpression < 2.0) {
            eyeSDF = mix(eyeTalking, eyeHappy, uExpression - 1.0);
          } else {
            eyeSDF = mix(eyeHappy, eyeSurprised, clamp(uExpression - 2.0, 0.0, 1.0));
          }

          // 2. MOUTH SDF (Neutral, Talking, Happy, Surprised)
          float mouthNeutral = sdCapsule(uv - mouthCenter, vec2(-0.05, 0.0), vec2(0.05, 0.0), 0.008);

          vec2 p_m_talk = uv - mouthCenter;
          p_m_talk.y /= (1.0 + uTalkingIntensity * 2.8);
          float mouthTalking = length(p_m_talk) - 0.025;

          // Happy bending smile
          vec2 p_m_happy = uv - mouthCenter;
          p_m_happy.y += p_m_happy.x * p_m_happy.x * 6.0 - 0.005;
          float mouthHappy = sdCapsule(p_m_happy, vec2(-0.055, 0.0), vec2(0.055, 0.0), 0.009);

          // Surprised small wide-open circle
          float mouthSurprised = length(uv - mouthCenter) - 0.028;

          float mouthSDF = 999.0;
          if (uExpression < 1.0) {
            mouthSDF = mix(mouthNeutral, mouthTalking, uExpression);
          } else if (uExpression < 2.0) {
            mouthSDF = mix(mouthTalking, mouthHappy, uExpression - 1.0);
          } else {
            mouthSDF = mix(mouthHappy, mouthSurprised, clamp(uExpression - 2.0, 0.0, 1.0));
          }

          float eyeAlpha = smoothstep(0.008, 0.0, eyeSDF);
          float mouthAlpha = smoothstep(0.008, 0.0, mouthSDF);

          vec3 finalMouthColor = mix(mouthColorNeutral, mouthColorOpen, clamp(uTalkingIntensity * 1.5, 0.0, 1.0));
          float surprisedWeight = smoothstep(0.0, 1.0, uExpression - 2.0);
          finalMouthColor = mix(finalMouthColor, mouthColorOpen, surprisedWeight * 0.7);

          vec4 finalColor = vec4(0.0);
          if (eyeAlpha > 0.0) {
            finalColor = vec4(eyeColor, eyeAlpha);
          }
          if (mouthAlpha > 0.0) {
            finalColor = mix(finalColor, vec4(finalMouthColor, mouthAlpha), mouthAlpha);
          }

          gl_FragColor = finalColor;
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  // Clothing & hair uniforms refs
  const clothingUniformsRef = useRef<any>(null);
  const hairUniformsListRef = useRef<any[]>([]);

  // Smooth face expression state refs
  const currentExpressionRef = useRef<number>(0);
  const talkingIntensityRef = useRef<number>(0);

  // Clear references list each render to prevent leaks
  hairUniformsListRef.current = [];

  // Smooth look-at player logic + idle animations + particle updates
  useFrame((state, delta) => {
    if (isCompleted || !groupRef.current) return;

    const t = state.clock.getElapsedTime();

    // 1. Gentle idle bobbing (sine wave on Y)
    const bob = Math.sin(t * 2.2) * 0.05;
    groupRef.current.position.y = position[1] + bob;

    // 2. Gentle arm sway / expressive dialogue gestures
    if (leftArmRef.current) {
      if (isThisCustomerSpeaking) {
        // Expressive talking gesture with sine wave
        leftArmRef.current.rotation.x = -0.3 + Math.sin(t * 8.0) * 0.25;
        leftArmRef.current.rotation.z = -0.3 + Math.cos(t * 6.5) * 0.15;
      } else {
        // Calm idle sway
        leftArmRef.current.rotation.x = Math.sin(t * 2.0) * 0.12;
        leftArmRef.current.rotation.z = -0.05 + Math.cos(t * 1.5) * 0.03;
      }
    }
    if (rightArmRef.current) {
      if (isThisCustomerSpeaking) {
        // Expressive talking gesture with sine wave
        rightArmRef.current.rotation.x = -0.35 - Math.sin(t * 7.5) * 0.25;
        rightArmRef.current.rotation.z = 0.3 + Math.cos(t * 5.5) * 0.15;
      } else {
        // Calm idle sway
        rightArmRef.current.rotation.x = -Math.sin(t * 2.0) * 0.12;
        rightArmRef.current.rotation.z = 0.05 - Math.cos(t * 1.5) * 0.03;
      }
    }

    // 3. Find and turn to face the player with damping look-at
    const player = state.scene.getObjectByName("player");
    if (player) {
      const playerPos = player.position;
      const customerPos = groupRef.current.position;

      // Distance for proximity trigger
      const distance = customerPos.distanceTo(playerPos);

      // Proximity Dialogue Trigger
      if (distance < 2.4) {
        if (!wasCloseRef.current) {
          interactWithCustomer();
          wasCloseRef.current = true;
        }
      } else {
        wasCloseRef.current = false;
      }

      // Smooth horizontal rotation (Yaw) of body to face player
      const targetRotationY = Math.atan2(playerPos.x - customerPos.x, playerPos.z - customerPos.z) + Math.PI;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.08);

      // Smooth look-at tracking for head with clamping
      if (headRef.current) {
        const headWorldPos = new THREE.Vector3();
        headRef.current.getWorldPosition(headWorldPos);
        const toPlayer = playerPos.clone().sub(headWorldPos).normalize();

        // Calculate relative Pitch and Yaw
        const targetHeadYaw = Math.atan2(toPlayer.x, toPlayer.z) + Math.PI - groupRef.current.rotation.y;
        const targetHeadPitch = Math.asin(toPlayer.y);

        // Clamp head rotation to realistic human range (-50 to +50 degrees)
        const clampRange = Math.PI / 3.6;
        const clampedYaw = Math.max(-clampRange, Math.min(clampRange, targetHeadYaw));
        const clampedPitch = Math.max(-clampRange / 2, Math.min(clampRange / 2, targetHeadPitch));

        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, clampedYaw, 0.08);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, clampedPitch, 0.08);
      }
    }

    // 4. Update face shader expression and talking lip-flap
    const targetExpression = questState === "completed" || questState === "answered" ? 2.0 : isThisCustomerSpeaking ? 1.0 : questState === "active" ? 3.0 : 0.0;
    currentExpressionRef.current = THREE.MathUtils.lerp(currentExpressionRef.current, targetExpression, 0.12);
    
    if (isThisCustomerSpeaking) {
      talkingIntensityRef.current = THREE.MathUtils.lerp(talkingIntensityRef.current, Math.abs(Math.sin(t * 16.0)), 0.2);
    } else {
      talkingIntensityRef.current = THREE.MathUtils.lerp(talkingIntensityRef.current, 0.0, 0.2);
    }

    if (faceMaterial) {
      faceMaterial.uniforms.uTime.value = t;
      faceMaterial.uniforms.uExpression.value = currentExpressionRef.current;
      faceMaterial.uniforms.uTalkingIntensity.value = talkingIntensityRef.current;
    }

    // 5. Update clothing and hair uniforms
    if (clothingUniformsRef.current) {
      clothingUniformsRef.current.uTime.value = t;
    }
    hairUniformsListRef.current.forEach((uni) => {
      if (uni) uni.uTime.value = t;
    });
  });

  if (isCompleted) return null;

  // Derive custom shaders
  const clothingShader = getClothingShader(charStyle.clothingColor, clothingUniformsRef);
  const skinShader = getSkinShader(charStyle.skinColor);

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Body/Torso Group with Breathing animation scaling */}
      <group position={[0, 0.6, 0]}>
        {/* Inner Shirt (Cylinder) */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.22, 0.5, 2, 6]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
        </mesh>
        {/* Outer Clothes Jacket Layer (capsule with procedurally displaced vertex folds & rim lighting) */}
        <mesh position={[0, -0.01, 0]} scale={[1.04, 0.98, 1.04]} receiveShadow>
          <capsuleGeometry args={[0.22, 0.5, 3, 8]} />
          <meshStandardMaterial 
            key={`coat-${charId}`}
            color={charStyle.clothingColor} 
            roughness={0.4} 
            onBeforeCompile={clothingShader}
          />
        </mesh>
        {/* Neck Collar Accent Cylinder */}
        <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.02, 4, 8]} />
          <meshStandardMaterial color={charStyle.clothingColor} roughness={0.5} />
        </mesh>
      </group>

      {/* 2. Left Arm */}
      <mesh ref={leftArmRef} position={[-0.3, 0.75, 0]}>
        <capsuleGeometry args={[0.06, 0.3, 2, 4]} />
        <meshStandardMaterial color={charStyle.clothingColor} roughness={0.45} onBeforeCompile={addRimLight("#22d3ee", 0.4, 3.5)} />
      </mesh>

      {/* 3. Right Arm */}
      <mesh ref={rightArmRef} position={[0.3, 0.75, 0]}>
        <capsuleGeometry args={[0.06, 0.3, 2, 4]} />
        <meshStandardMaterial color={charStyle.clothingColor} roughness={0.45} onBeforeCompile={addRimLight("#22d3ee", 0.4, 3.5)} />
      </mesh>

      {/* 4. Legs */}
      <mesh position={[-0.1, 0.15, 0]}>
        <capsuleGeometry args={[0.07, 0.3, 2, 4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.15, 0]}>
        <capsuleGeometry args={[0.07, 0.3, 2, 4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* 5. Head Group (Look-at behavior) */}
      <group ref={headRef} position={[0, 1.15, 0]}>
        {/* Head Sphere with custom cyber cyan rim lighting shader */}
        <mesh>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial 
            key={`skin-${charId}`}
            color={charStyle.skinColor} 
            roughness={0.55} 
            onBeforeCompile={skinShader}
          />
        </mesh>

        {/* Dynamic Procedural Face Plane containing Eye and Mouth Blendshapes */}
        <mesh position={[0, 0.01, -0.218]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.12, 0.12]} />
          <primitive object={faceMaterial} attach="material" />
        </mesh>

        {/* CHARACTER SPECIFIC HAIR & BEARDS */}
        {/* Timmy's Cap */}
        {charStyle.hasCap && (
          <group position={[0, 0.15, 0.02]}>
            {/* Cap Dome */}
            <mesh>
              <sphereGeometry args={[0.23, 32, 32]} />
              <meshStandardMaterial color={charStyle.hairColor} roughness={0.5} onBeforeCompile={addRimLight("#22d3ee", 0.4, 3.0)} />
            </mesh>
            {/* Cap Brim */}
            <mesh position={[0, -0.02, -0.12]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.28, 0.02, 0.16]} />
              <meshStandardMaterial color={charStyle.hairColor} roughness={0.5} />
            </mesh>
          </group>
        )}

        {/* Sarah's Bob Haircut + Wind Animated Hair Strands */}
        {charId === "sarah" && (
          <group position={[0, 0.04, 0.02]}>
            {/* Top Hair */}
            <mesh position={[0, 0.08, -0.02]}>
              <sphereGeometry args={[0.235, 32, 32]} />
              <meshStandardMaterial color={charStyle.hairColor} roughness={0.8} onBeforeCompile={addRimLight("#22d3ee", 0.4, 3.0)} />
            </mesh>
            
            {/* Custom wind-swaying plane hair-strips wrapping her head */}
            {[-0.18, -0.12, 0.12, 0.18].map((offset, idx) => (
              <mesh 
                key={idx}
                position={[offset, -0.08, -0.04]} 
                rotation={[0, 0, offset * -0.6]}
               
              >
                <planeGeometry args={[0.04, 0.16]} />
                <meshStandardMaterial 
                  key={`hair-strand-${idx}`}
                  color={charStyle.hairColor} 
                  roughness={0.8} 
                  side={THREE.DoubleSide}
                  onBeforeCompile={getHairShader(charStyle.hairColor, hairUniformsListRef)}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Grandpa's Beard, Moustache & Hair + Swaying Beard Strands */}
        {charStyle.hasBeard && (
          <group>
            {/* Side/Back Hair Ring */}
            <mesh position={[0, 0.04, 0.04]}>
              <sphereGeometry args={[0.23, 32, 32]} />
              <meshStandardMaterial color={charStyle.hairColor} roughness={0.9} onBeforeCompile={addRimLight("#22d3ee", 0.45, 3.0)} />
            </mesh>
            
            {/* Bushy Beard base (under chin) */}
            <mesh position={[0, -0.15, -0.1]}>
              <sphereGeometry args={[0.12, 4, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            <mesh position={[-0.06, -0.12, -0.12]}>
              <sphereGeometry args={[0.08, 4, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            <mesh position={[0.06, -0.12, -0.12]}>
              <sphereGeometry args={[0.08, 4, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            
            {/* Moustache */}
            <mesh position={[0, -0.05, -0.19]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.03, 0.12, 2, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>

            {/* Custom wind-swaying thin cylinders for dangling beard strands */}
            {[-0.08, -0.04, 0.0, 0.04, 0.08].map((offset, idx) => (
              <mesh
                key={idx}
                position={[offset, -0.19, -0.13]}
                rotation={[0.1, 0, offset * -0.4]}
               
              >
                <cylinderGeometry args={[0.015, 0.005, 0.15, 4]} />
                <meshStandardMaterial
                  key={`beard-strand-${idx}`}
                  color="#ffffff"
                  roughness={0.9}
                  onBeforeCompile={getHairShader("#ffffff", hairUniformsListRef)}
                />
              </mesh>
            ))}
          </group>
        )}
      </group>

      <EmotionParticles questState={questState} />

      {/* 7. Modern 3D HTML Typewriter Speech Bubble */}
      <Html position={[0, 2.3, 0]} center distanceFactor={8} pointerEvents="none">
        <AnimatePresence mode="wait">
          {isThisCustomerSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
              className="w-72 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-slate-100 p-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(6,182,212,0.3)] relative flex flex-col gap-1.5 pointer-events-auto"
            >
              {/* Pointing down tail */}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-cyan-500/40 rotate-45" />

              {/* Character Header tag */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400 font-mono">
                  {charId}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>

              {/* Dialogue text */}
              <p className="text-xs font-medium leading-relaxed text-slate-200 font-sans">
                <Typewriter key={dialog} text={cleanDialogueText} speed={18} />
              </p>

              {/* Space click keycap hint */}
              <div className="flex justify-between items-center mt-1 border-t border-slate-800/60 pt-1.5 text-[9px] text-slate-400 font-mono">
                <span>RETR_KITCHEN_OS</span>
                <span className="animate-pulse flex items-center gap-1 text-cyan-400 font-sans">
                  <span>SPACE TO CONTINUE</span>
                  <span>⤾</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Html>
    </group>
  );
}
