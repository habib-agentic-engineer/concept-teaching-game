"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { playerPositionGlobal } from "./Player";

interface WoodMaterialProps {
  grainScale?: number;
  colorVariation?: number;
  wearAmount?: number;
  knotStrength?: number;
  baseColorLight?: string;
  baseColorDark?: string;
}

export function WoodMaterial({
  grainScale = 4.5,
  colorVariation = 0.8,
  wearAmount = 0.5,
  knotStrength = 0.6,
  baseColorLight = "#854d0e", // Warm light brown/ochre
  baseColorDark = "#451a03",  // Rich dark brown
}: WoodMaterialProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const uniformsRef = useRef<any>(null);

  // Parse color strings to THREE.Color
  const colorLight = useMemo(() => new THREE.Color(baseColorLight), [baseColorLight]);
  const colorDark = useMemo(() => new THREE.Color(baseColorDark), [baseColorDark]);

  // Update uniforms dynamically in render loop
  useFrame((state) => {
    if (uniformsRef.current) {
      uniformsRef.current.uTime.value = state.clock.getElapsedTime();
      uniformsRef.current.uPlayerPosition.value.copy(playerPositionGlobal);
      uniformsRef.current.uGrainScale.value = grainScale;
      uniformsRef.current.uColorVariation.value = colorVariation;
      uniformsRef.current.uWearAmount.value = wearAmount;
      uniformsRef.current.uKnotStrength.value = knotStrength;
      uniformsRef.current.uColorLight.value.copy(colorLight);
      uniformsRef.current.uColorDark.value.copy(colorDark);
    }
  });

  const onBeforeCompile = (shader: THREE.Shader) => {
    // Define uniforms
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uGrainScale = { value: grainScale };
    shader.uniforms.uColorVariation = { value: colorVariation };
    shader.uniforms.uWearAmount = { value: wearAmount };
    shader.uniforms.uKnotStrength = { value: knotStrength };
    shader.uniforms.uColorLight = { value: colorLight };
    shader.uniforms.uColorDark = { value: colorDark };
    shader.uniforms.uPlayerPosition = { value: playerPositionGlobal.clone() };

    uniformsRef.current = shader.uniforms;

    // 1. Inject Varyings inside Vertex Shader
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      varying vec3 vLocalPosition;
      varying vec3 vWorldPositionCustom;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vLocalPosition = position;
      vWorldPositionCustom = (modelMatrix * vec4(position, 1.0)).xyz;
      `
    );

    // 2. Inject Uniforms, Varyings, and Helper Math inside Fragment Shader
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uTime;
      uniform float uGrainScale;
      uniform float uColorVariation;
      uniform float uWearAmount;
      uniform float uKnotStrength;
      uniform vec3 uColorLight;
      uniform vec3 uColorDark;
      uniform vec3 uPlayerPosition;

      varying vec3 vLocalPosition;
      varying vec3 vWorldPositionCustom;

      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        float n = p.x + p.y*157.0 + 113.0*p.z;
        return mix(mix(mix(hash(n+0.0), hash(n+1.0), f.x),
                       mix(hash(n+157.0), hash(n+158.0), f.x), f.y),
                   mix(mix(hash(n+113.0), hash(n+114.0), f.x),
                       mix(hash(n+270.0), hash(n+271.0), f.x), f.y), f.z);
      }

      float fbm(vec3 p) {
        float v = 0.0; float a = 0.5; vec3 shift = vec3(100.0);
        for (int i = 0; i < 3; ++i) {
          v += a * noise(p); p = p * 2.0 + shift; a *= 0.5;
        }
        return v;
      }

      float getWoodHeight(vec3 p) {
        vec3 localPos = p * uGrainScale;
        float radialDist = length(localPos.yz + localPos.x * 0.1);
        float wavyRings = radialDist * 10.0 + fbm(localPos * 1.5) * 6.0;
        return sin(wavyRings) * 0.5 + 0.5;
      }
      `
    );

    // 3. Procedural Map Injection (overwrites diffuseColor.rgb)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      // Parallax Occlusion Mapping (POM) simulation using Height Field Height Map
      vec3 V = normalize(cameraPosition - vWorldPositionCustom);
      vec3 localV = V;
      
      vec3 samplePos = vLocalPosition;
      float heightScale = 0.025;
      for (int i = 0; i < 4; i++) {
        float h = getWoodHeight(samplePos);
        samplePos -= localV * (h * heightScale * 0.25);
      }
      
      vec3 distortedPos = samplePos * uGrainScale;
      
      // Node Distortion for Knots
      vec3 knotCenter1 = vec3(0.5, 0.0, 0.2);
      float d1 = length(distortedPos.xz - knotCenter1.xz);
      if (d1 < 1.0) {
        float strength = (1.0 - d1 / 1.0) * uKnotStrength;
        float angle = strength * 5.0;
        float c = cos(angle); float s = sin(angle);
        vec2 offset = distortedPos.xz - knotCenter1.xz;
        distortedPos.x = knotCenter1.x + (offset.x * c - offset.y * s);
        distortedPos.z = knotCenter1.z + (offset.x * s + offset.y * c);
      }

      // Layered FBM Wood Grain: primary rings + fine fibers + micro scratches
      float radialDist = length(distortedPos.yz + distortedPos.x * 0.1);
      float wavyRings = radialDist * 10.0 + fbm(distortedPos * 1.5) * 6.0;
      float rings = sin(wavyRings);
      rings = smoothstep(-0.4, 0.4, rings);

      float fineFiber = noise(distortedPos * vec3(1.5, 30.0, 15.0));
      float scratches = noise(distortedPos * 80.0) * 0.15;

      float patternVal = mix(fineFiber * 0.3, rings * 0.6 + 0.4, 0.7) - scratches;

      // Dynamic wear based on player proximity
      float distToPlayer = distance(vWorldPositionCustom, uPlayerPosition);
      float proximityWear = smoothstep(4.0, 0.5, distToPlayer);
      float currentWear = clamp(uWearAmount + proximityWear * 0.4, 0.0, 1.0);

      float wearNoise = noise(distortedPos * 0.4);
      float wearMask = smoothstep(0.7 - currentWear * 0.5, 0.9 - currentWear * 0.3, wearNoise);

      // Color calculation
      vec3 woodColor = mix(uColorDark, uColorLight, patternVal);
      vec3 finalBaseColor = mix(uColorDark * 0.8, woodColor, uColorVariation);
      vec3 wornWoodColor = mix(finalBaseColor, uColorLight * 1.25, wearMask * 0.4);

      diffuseColor.rgb = wornWoodColor;
      `
    );

    // 4. Roughness map update (Worn wood becomes more matte/rough)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
      float wearNoiseVal = noise(vLocalPosition * uGrainScale * 0.4);
      float proximityWearVal = smoothstep(4.0, 0.5, distance(vWorldPositionCustom, uPlayerPosition));
      float currentWearVal = clamp(uWearAmount + proximityWearVal * 0.4, 0.0, 1.0);
      float wearMaskVal = smoothstep(0.7 - currentWearVal * 0.5, 0.9 - currentWearVal * 0.3, wearNoiseVal);
      float roughnessScratches = noise(vLocalPosition * uGrainScale * 80.0) * 0.12;
      
      roughnessFactor = clamp(0.45 + wearMaskVal * 0.5 + roughnessScratches, 0.0, 1.0);
      `
    );
  };

  return (
    <meshStandardMaterial
      ref={materialRef}
      roughness={0.5}
      metalness={0.05}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => "procedural_wood"}
    />
  );
}
