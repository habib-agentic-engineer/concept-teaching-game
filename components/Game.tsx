"use client";

import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Environment } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { GameProvider, useGame } from "./GameContext";
import { Player } from "./Player";
import { Town } from "./Town";
import { Customer } from "./Customer";
import { UI } from "./UI";
import { Skybox } from "./Skybox";
import { Physics } from "@react-three/rapier";
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing";

function Scene() {
  const { interactWithCustomer, interactWithLocation, physicsDebug } = useGame();

  const interactables = useMemo(() => [
    { position: new THREE.Vector3(0, 0, 2), onInteract: interactWithCustomer }, // Customer at counter
    { position: new THREE.Vector3(-8, 0, 4.5), onInteract: () => interactWithLocation("memory") }, // Memory Pantry Front
    { position: new THREE.Vector3(8, 0, 4.5), onInteract: () => interactWithLocation("search") }, // Search Market Front
    { position: new THREE.Vector3(0, 0, -7.0), onInteract: () => interactWithLocation("research") }, // Deep Research Lab Front
  ], [interactWithCustomer, interactWithLocation]);

  return (
    <>
      <Skybox />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
      </directionalLight>
      <Environment preset="city" />

      <Physics gravity={[0, -9.81, 0]} debug={physicsDebug}>
        <Town />
        <Customer position={[0, 0, 2.5]} />
        <Player interactables={interactables} />
      </Physics>

      <EffectComposer enableNormalPass>
        <SSAO 
          intensity={1.0} 
          radius={0.15} 
          luminanceInfluence={0.5}
          bias={0.03}
        />
        <Bloom 
          intensity={0.6} 
          luminanceThreshold={0.5} 
          luminanceSmoothing={0.9} 
          height={300} 
        />
      </EffectComposer>
    </>
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
          <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
            <Scene />
          </Canvas>
          <UI />
        </div>
      </KeyboardControls>
    </GameProvider>
  );
}
