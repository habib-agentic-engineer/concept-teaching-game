"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGame, QUESTS } from "./GameContext";
import { Text } from "@react-three/drei";
import { WoodMaterial } from "./WoodMaterial";
import { MetalMaterial } from "./MetalMaterial";
import { FloorMaterial } from "./FloorMaterial";
import { RigidBody, CuboidCollider } from "@react-three/rapier";

export function Town() {
  const {
    woodGrainScale,
    woodColorVariation,
    woodWearAmount,
    woodKnotStrength,
    metalScratchScale,
    metalScratchDirection,
    metalRoughness,
    metalFingerprintStrength,
    activeStationDecoration,
  } = useGame();

  return (
    <group>
      {/* Ground (Floor) with Static Collider */}
      <RigidBody type="fixed" colliders={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <FloorMaterial tileScale={1.2} groutWidth={0.03} />
        </mesh>
        <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.1, 0]} />
      </RigidBody>

      {/* World Boundary Walls to prevent out of bounds */}
      <RigidBody type="fixed" colliders={false}>
        {/* North Wall */}
        <CuboidCollider args={[20, 5, 1]} position={[0, 2.5, -20]} />
        {/* South Wall */}
        <CuboidCollider args={[20, 5, 1]} position={[0, 2.5, 20]} />
        {/* West Wall */}
        <CuboidCollider args={[1, 5, 20]} position={[-20, 2.5, 0]} />
        {/* East Wall */}
        <CuboidCollider args={[1, 5, 20]} position={[20, 2.5, 0]} />
      </RigidBody>

      {/* The Kitchen Building */}
      <RigidBody type="fixed" position={[0, 1.5, -2]} colliders={false}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[8, 3, 6]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
        <CuboidCollider args={[4, 1.5, 3]} />
      </RigidBody>
      
      <Text position={[0, 3.5, -2]} fontSize={0.8} color="#92400e" anchorX="center" anchorY="middle">
        The Retrieval Kitchen
      </Text>

      {/* Behind Counter Metal Kitchen Appliances */}
      {/* Retrieval Refrigerator */}
      <RigidBody type="fixed" position={[-1.5, 0, -1.5]} colliders={false}>
        <group>
          <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 2.0, 0.8]} />
            <MetalMaterial 
              scratchScale={metalScratchScale}
              scratchDirection={metalScratchDirection}
              roughness={metalRoughness}
              fingerprintStrength={metalFingerprintStrength}
              metalColor="#cbd5e1"
            />
          </mesh>
          {/* Soft handle */}
          <mesh position={[0.42, 1.0, 0.1]} castShadow>
            <boxGeometry args={[0.04, 0.6, 0.04]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
        <CuboidCollider args={[0.4, 1.0, 0.4]} position={[0, 1.0, 0]} />
      </RigidBody>

      {/* Retrieval Range & Oven */}
      <RigidBody type="fixed" position={[1.5, 0, -1.5]} colliders={false}>
        <group>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 1.0, 0.8]} />
            <MetalMaterial 
              scratchScale={metalScratchScale}
              scratchDirection={metalScratchDirection}
              roughness={metalRoughness}
              fingerprintStrength={metalFingerprintStrength}
              metalColor="#94a3b8"
            />
          </mesh>
          {/* Cooktop grates */}
          <mesh position={[0, 1.01, 0]} receiveShadow>
            <boxGeometry args={[1.1, 0.02, 0.7]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </group>
        <CuboidCollider args={[0.6, 0.5, 0.4]} position={[0, 0.5, 0]} />
      </RigidBody>

      {/* Counter */}
      <RigidBody type="fixed" position={[0, 0.5, 1.5]} colliders={false}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[4, 1, 1]} />
          <WoodMaterial 
            grainScale={woodGrainScale}
            colorVariation={woodColorVariation}
            wearAmount={woodWearAmount}
            knotStrength={woodKnotStrength}
            baseColorLight="#854d0e"
            baseColorDark="#451a03"
          />
        </mesh>
        <CuboidCollider args={[2, 0.5, 0.5]} />
      </RigidBody>

      {/* Memory Pantry (Left side standalone entity) */}
      <RigidBody type="fixed" position={[-8, 0, 2]} colliders={false}>
        <group>
          <mesh position={[0, 1.5, 0]} receiveShadow castShadow>
            <boxGeometry args={[3, 3, 3]} />
            <meshStandardMaterial color="#60a5fa" />
          </mesh>
          <mesh position={[0, 3.5, 0]} receiveShadow castShadow>
             <boxGeometry args={[3.5, 0.5, 3.5]} />
             <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <Text position={[0, 4.5, 0]} fontSize={0.6} color="#1e3a8a">
            Memory Pantry
          </Text>
          <ProceduralDecor type={activeStationDecoration} />
        </group>
        <CuboidCollider args={[1.5, 1.5, 1.5]} position={[0, 1.5, 0]} />
      </RigidBody>

      {/* Search Market (Right side standalone entity) */}
      <RigidBody type="fixed" position={[8, 0, 2]} colliders={false}>
        <group>
          <mesh position={[0, 1.5, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[2, 2, 3, 8]} />
            <meshStandardMaterial color="#34d399" />
          </mesh>
          <mesh position={[0, 3.5, 0]} receiveShadow castShadow>
            <coneGeometry args={[2.5, 1.5, 8]} />
            <meshStandardMaterial color="#059669" />
          </mesh>
          <Text position={[0, 4.8, 0]} fontSize={0.6} color="#064e3b">
            Search Market
          </Text>
          <ProceduralDecor type={activeStationDecoration} />
        </group>
        <CuboidCollider args={[2, 1.5, 2]} position={[0, 1.5, 0]} />
      </RigidBody>

      {/* Deep Research Lab (Back center standalone entity) */}
      <RigidBody type="fixed" position={[0, 0, -10]} colliders={false}>
        <group>
          <mesh position={[0, 2.5, 0]} receiveShadow castShadow>
            <boxGeometry args={[6, 5, 4]} />
            <meshStandardMaterial color="#c084fc" />
          </mesh>
          <mesh position={[0, 6, 0]} receiveShadow castShadow>
            <sphereGeometry args={[2.5, 16, 16]} />
            <MetalMaterial 
              scratchScale={metalScratchScale * 0.8}
              scratchDirection={1.0 - metalScratchDirection}
              roughness={metalRoughness}
              fingerprintStrength={metalFingerprintStrength}
              metalColor="#a855f7"
            />
          </mesh>
          <Text position={[0, 9, 0]} fontSize={0.8} color="#4c1d95">
            Deep Research Lab
          </Text>
          <ProceduralDecor type={activeStationDecoration} />
        </group>
        <CuboidCollider args={[3, 2.5, 2]} position={[0, 2.5, 0]} />
      </RigidBody>
      
      {/* Some random trees/props */}
      <RigidBody type="fixed" position={[10, 0, -8]} colliders={false}>
        <group>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2]} />
            <WoodMaterial 
              grainScale={woodGrainScale * 1.5}
              colorVariation={woodColorVariation}
              wearAmount={woodWearAmount * 0.7}
              knotStrength={woodKnotStrength * 0.5}
              baseColorLight="#5c2d11"
              baseColorDark="#2d1508"
            />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <sphereGeometry args={[1.5]} />
            <meshStandardMaterial color="#166534" />
          </mesh>
        </group>
        <CuboidCollider args={[0.3, 1.0, 0.3]} position={[0, 1.0, 0]} />
      </RigidBody>
      
      <RigidBody type="fixed" position={[-8, 0, -10]} colliders={false}>
        <group>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2]} />
            <WoodMaterial 
              grainScale={woodGrainScale * 1.5}
              colorVariation={woodColorVariation}
              wearAmount={woodWearAmount * 0.7}
              knotStrength={woodKnotStrength * 0.5}
              baseColorLight="#5c2d11"
              baseColorDark="#2d1508"
            />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <sphereGeometry args={[1.5]} />
            <meshStandardMaterial color="#166534" />
          </mesh>
        </group>
        <CuboidCollider args={[0.3, 1.0, 0.3]} position={[0, 1.0, 0]} />
      </RigidBody>

      {/* Floating interactive/pickable data items */}
      <FloatingPickup 
        position={[-8, 1.2, 4.5]} 
        type="memory" 
        color="#1e3a8a" 
        activeColor="#facc15" 
        label="Memory Ingredient (Fact)" 
      />
      
      <FloatingPickup 
        position={[8, 1.2, 4.5]} 
        type="search" 
        color="#064e3b" 
        activeColor="#10b981" 
        label="Search Ingredient (Fresh Data)" 
      />
      
      <FloatingPickup 
        position={[0, 1.2, -7.0]} 
        type="research" 
        color="#4c1d95" 
        activeColor="#c084fc" 
        label="Research Report (Deep Synthesis)" 
      />

      {/* Instanced background townspeople NPCs */}
      <BackgroundNPCs />

    </group>
  );
}

function BackgroundNPCs() {
  const count = 5;
  const bodiesRef = useRef<THREE.InstancedMesh>(null);
  const headsRef = useRef<THREE.InstancedMesh>(null);
  const capsRef = useRef<THREE.InstancedMesh>(null);
  
  const npcData = useMemo(() => [
    { x: -5, z: -5, color: "#10b981", skinColor: "#ffedd5", speed: 0.5, radius: 2.0, phase: 0, hasCap: false },
    { x: 6, z: -6, color: "#ef4444", skinColor: "#fbcfe8", speed: 0.3, radius: 1.5, phase: 1.5, hasCap: true, capColor: "#3b82f6" },
    { x: -7, z: 8, color: "#3b82f6", skinColor: "#fecaca", speed: 0.4, radius: 3.0, phase: 3.0, hasCap: false },
    { x: 5, z: 7, color: "#f59e0b", skinColor: "#ffedd5", speed: 0.6, radius: 1.0, phase: 4.5, hasCap: true, capColor: "#a855f7" },
    { x: -3, z: -14, color: "#ec4899", skinColor: "#fbcfe8", speed: 0.0, radius: 0.0, phase: 0.0, hasCap: false },
  ], []);

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!bodiesRef.current || !headsRef.current || !capsRef.current) return;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const npc = npcData[i];
      let x = npc.x;
      let z = npc.z;
      
      if (npc.radius > 0) {
        x += Math.sin(t * npc.speed + npc.phase) * npc.radius;
      }
      
      const bodyY = 0.6 + Math.sin(t * 2.2 + i) * 0.03;
      const breathScale = 1.0 + Math.sin(t * 1.8 + i) * 0.015;
      
      // 1. Update body instanced mesh
      tempObject.position.set(x, bodyY, z);
      const angle = npc.radius > 0 ? (t * npc.speed + npc.phase + Math.PI / 2) : (t * 0.1 + i);
      tempObject.rotation.set(0, angle, 0);
      tempObject.scale.set(breathScale, breathScale, breathScale);
      tempObject.updateMatrix();
      bodiesRef.current.setMatrixAt(i, tempObject.matrix);
      tempColor.set(npc.color);
      bodiesRef.current.setColorAt(i, tempColor);
      
      // 2. Update head instanced mesh
      const headY = bodyY + 0.55;
      tempObject.position.set(x, headY, z);
      tempObject.rotation.set(0, angle, 0);
      tempObject.scale.set(1, 1, 1);
      tempObject.updateMatrix();
      headsRef.current.setMatrixAt(i, tempObject.matrix);
      tempColor.set(npc.skinColor);
      headsRef.current.setColorAt(i, tempColor);

      // 3. Update caps/hats instanced mesh (for NPCs that have caps)
      if (npc.hasCap) {
        tempObject.position.set(x, headY + 0.15, z + 0.02);
        tempObject.rotation.set(0, angle, 0);
        tempObject.scale.set(1.02, 1.02, 1.02);
        tempObject.updateMatrix();
        capsRef.current.setMatrixAt(i, tempObject.matrix);
        tempColor.set(npc.capColor || "#1e293b");
        capsRef.current.setColorAt(i, tempColor);
      } else {
        // Place out of sight / zero scale if they don't have a cap
        tempObject.position.set(0, -999, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        capsRef.current.setMatrixAt(i, tempObject.matrix);
      }
    }
    
    bodiesRef.current.instanceMatrix.needsUpdate = true;
    if (bodiesRef.current.instanceColor) bodiesRef.current.instanceColor.needsUpdate = true;
    
    headsRef.current.instanceMatrix.needsUpdate = true;
    if (headsRef.current.instanceColor) headsRef.current.instanceColor.needsUpdate = true;

    capsRef.current.instanceMatrix.needsUpdate = true;
    if (capsRef.current.instanceColor) capsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodiesRef} args={[null as any, null as any, count]} castShadow receiveShadow>
        <capsuleGeometry args={[0.22, 0.5, 2, 6]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={headsRef} args={[null as any, null as any, count]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={capsRef} args={[null as any, null as any, count]} castShadow receiveShadow>
        <sphereGeometry args={[0.21, 6, 6]} />
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
    </group>
  );
}

function FloatingPickup({ 
  position, 
  type, 
  color, 
  activeColor, 
  label 
}: { 
  position: [number, number, number]; 
  type: "memory" | "search" | "research"; 
  color: string; 
  activeColor: string; 
  label: string; 
}) {
  const { questState, inventory, day } = useGame();
  const currentQuest = QUESTS[day];
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  // Is this specific item needed for the active quest and not yet picked up?
  const isNeeded = questState === "active" && currentQuest?.expectedItem === type && inventory === "none";
  const isPickedUp = inventory === type;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Rotation and float animation
      meshRef.current.rotation.y = t * 1.5;
      meshRef.current.rotation.x = t * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(t * 3) * 0.15;
    }
    if (glowRef.current) {
      // Pulsing light intensity
      glowRef.current.intensity = isNeeded ? 1.5 + Math.sin(t * 5) * 0.5 : 0.2;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Visual representation of the item */}
      <mesh ref={meshRef} position={[0, position[1], 0]} castShadow>
        {type === "memory" ? (
          <octahedronGeometry args={[0.35]} />
        ) : type === "search" ? (
          <torusGeometry args={[0.25, 0.08, 8, 24]} />
        ) : (
          <coneGeometry args={[0.25, 0.6, 8]} />
        )}
        <meshStandardMaterial 
          color={isNeeded ? activeColor : color} 
          emissive={isNeeded ? activeColor : "#000000"}
          emissiveIntensity={isNeeded ? 0.8 : 0}
          transparent
          opacity={isNeeded ? 1.0 : isPickedUp ? 0.15 : 0.4}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Floating Ring/Halo around active items */}
      {isNeeded && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color={activeColor} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Glow point light */}
      <pointLight 
        ref={glowRef} 
        position={[0, position[1], 0]} 
        color={activeColor} 
        distance={4} 
        intensity={isNeeded ? 1.5 : 0.2} 
      />

      {/* Dynamic Text UI above item */}
      <group position={[0, position[1] + 0.8, 0]}>
        {isNeeded ? (
          <>
            <Text 
              fontSize={0.25} 
              color={activeColor} 
              anchorX="center" 
              anchorY="middle"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZg.ttf"
            >
              {label}
            </Text>
            <Text 
              fontSize={0.16} 
              color="#ffffff" 
              position={[0, -0.22, 0]} 
              anchorX="center" 
              anchorY="middle"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZg.ttf"
            >
              PRESS SPACE TO PICK UP
            </Text>
          </>
        ) : isPickedUp ? (
          <Text 
            fontSize={0.2} 
            color="#94a3b8" 
            anchorX="center" 
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZg.ttf"
          >
            Collected!
          </Text>
        ) : (
          <Text 
            fontSize={0.18} 
            color="#64748b" 
            anchorX="center" 
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZg.ttf"
          >
            {type.toUpperCase()}
          </Text>
        )}
      </group>
    </group>
  );
}

function ProceduralDecor({ type }: { type: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (type === "particles") {
      groupRef.current.rotation.y = t * 1.5;
    } else if (type === "vines") {
      const scale = 1.0 + Math.sin(t * 1.5) * 0.03;
      groupRef.current.scale.set(scale, scale, scale);
    } else if (type === "gold") {
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;
    }
  });

  if (!type || type === "none") return null;

  return (
    <group ref={groupRef}>
      {type === "vines" && (
        <group>
          {/* Glowing neon green spirals wrapping around */}
          {[0.6, 1.4, 2.2].map((h, i) => (
            <mesh key={i} position={[0, h, 0]} rotation={[0.15, i * 0.5, 0.1]}>
              <torusGeometry args={[1.7, 0.05, 8, 32]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.7} />
            </mesh>
          ))}
          {/* Sprouting glowing berries */}
          <mesh position={[1.5, 1.8, 0]}>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-1.5, 1.0, 0]}>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {type === "particles" && (
        <group position={[0, 4.0, 0]}>
          {/* Quantum floating orbital data spices */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2;
            const radius = 1.6;
            const h = Math.sin(i * 2) * 0.3;
            return (
              <mesh key={i} position={[Math.cos(angle) * radius, h, Math.sin(angle) * radius]}>
                <sphereGeometry args={[0.12]} />
                <meshStandardMaterial color="#60a5fa" roughness={0.1} emissive="#3b82f6" emissiveIntensity={1.2} />
              </mesh>
            );
          })}
        </group>
      )}

      {type === "gold" && (
        <group position={[0, 1.2, 1.55]}>
          {/* Golden Culinary Crest plaque */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.8, 0.03]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.45, 0.45, 0.02]} />
            <meshStandardMaterial color="#d97706" metalness={0.99} roughness={0.05} />
          </mesh>
        </group>
      )}
    </group>
  );
}
