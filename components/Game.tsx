"use client";

import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Environment, AdaptiveDpr } from "@react-three/drei";
import { useMemo, Suspense } from "react";
import * as THREE from "three";
import { GameProvider, useGame } from "./GameContext";
import { Player } from "./Player";
import { Town } from "./Town";
import { Customer } from "./Customer";
import { UI } from "./UI";
import { LoadingScreen } from "./LoadingScreen";
import { Skybox } from "./Skybox";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Scene() {
  const { interactWithCustomer, interactWithLocation, physicsDebug } = useGame();

  const interactables = useMemo(() => [
    { position: new THREE.Vector3(0, 0, 2), onInteract: interactWithCustomer }, // Customer at counter
    { position: new THREE.Vector3(-8, 0, 4.5), onInteract: () => interactWithLocation("memory") }, // Memory Pantry Front
    { position: new THREE.Vector3(8, 0, 4.5), onInteract: () => interactWithLocation("search") }, // Search Market Front
    { position: new THREE.Vector3(0, 0, -7.0), onInteract: () => interactWithLocation("research") }, // Deep Research Lab Front
  ], [interactWithCustomer, interactWithLocation]);

  return (
    <Suspense fallback={null}>
      <Skybox />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[512, 512]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      >
      </directionalLight>
      <Environment preset="city" />

      <Physics gravity={[0, -9.81, 0]} debug={physicsDebug}>
        <Town />
        <Customer position={[0, 0, 2.5]} />
        <Player interactables={interactables} />
      </Physics>

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          intensity={0.6} 
          luminanceThreshold={0.5} 
          luminanceSmoothing={0.9} 
          height={300} 
        />
      </EffectComposer>
      <AdaptiveDpr pixelated />
    </Suspense>
  );
}

export function Game() {
  return (
    <GameProvider>
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "KeyW"] },
          { name: "backward", keys: ["ArrowDown", "KeyS"] },
          { name: "left", keys: ["ArrowLeft", "KeyA"] },
          { name: "right", keys: ["ArrowRight", "KeyD"] },
        ]}
      >
        <div className="w-full h-screen bg-black overflow-hidden relative font-sans">
          <LoadingScreen />
          <Canvas 
            shadows 
            camera={{ position: [0, 5, 10], fov: 50 }}
            dpr={[1, 1.5]}
            gl={{ powerPreference: "high-performance", antialias: false }}
          >
            <Scene />
          </Canvas>
          <UI />
        </div>
      </KeyboardControls>
    </GameProvider>
  );
}
