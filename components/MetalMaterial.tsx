"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface MetalMaterialProps {
  scratchScale?: number;
  scratchDirection?: number; // 0.0 for horizontal, 1.0 for vertical
  roughness?: number;
  fingerprintStrength?: number;
  metalColor?: string;
}

export function MetalMaterial({
  scratchScale = 6.0,
  scratchDirection = 0.0, // horizontal
  roughness = 0.25,
  fingerprintStrength = 0.4,
  metalColor = "#e2e8f0", // light slate/silver
}: MetalMaterialProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const uniformsRef = useRef<any>(null);

  const baseColor = useMemo(() => new THREE.Color(metalColor), [metalColor]);

  // Update uniforms dynamically in loop
  useFrame((state) => {
    if (uniformsRef.current) {
      uniformsRef.current.uTime.value = state.clock.getElapsedTime();
      uniformsRef.current.uScratchScale.value = scratchScale;
      uniformsRef.current.uScratchDirection.value = scratchDirection;
      uniformsRef.current.uFingerprintStrength.value = fingerprintStrength;
      uniformsRef.current.uBaseColor.value.copy(baseColor);
    }
  });

  const onBeforeCompile = (shader: THREE.Shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uScratchScale = { value: scratchScale };
    shader.uniforms.uScratchDirection = { value: scratchDirection };
    shader.uniforms.uFingerprintStrength = { value: fingerprintStrength };
    shader.uniforms.uBaseColor = { value: baseColor };

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
      uniform float uScratchScale;
      uniform float uScratchDirection;
      uniform float uFingerprintStrength;
      uniform vec3 uBaseColor;

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
      `
    );

    // 3. Diffuse Color Modification (Seams, scratches, smudges)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      // Subtle panel seams via math
      float seamX = smoothstep(0.015, 0.0, abs(fract(vLocalPosition.x / 1.5 + 0.5) - 0.5) * 1.5);
      float seamZ = smoothstep(0.015, 0.0, abs(fract(vLocalPosition.z / 1.5 + 0.5) - 0.5) * 1.5);
      float seams = max(seamX, seamZ);

      // Micro scratches
      vec3 stretchFactor = mix(vec3(50.0, 1.0, 1.0), vec3(1.0, 50.0, 1.0), uScratchDirection);
      float scratches = noise(vLocalPosition * uScratchScale * stretchFactor) * 0.12;

      // Fingerprint smudges
      float fingerprints = noise(vLocalPosition * 3.0) * uFingerprintStrength;

      // Base metal styling
      vec3 finalBase = mix(uBaseColor, uBaseColor * 0.15, seams);
      finalBase = mix(finalBase, finalBase * 0.7, fingerprints);
      finalBase += vec3(scratches * 0.15);

      diffuseColor.rgb = finalBase;
      `
    );

    // 4. Roughness Update (Indented seams and fingerprint smudges increase roughness)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
      float fingerprintsRough = noise(vLocalPosition * 3.0) * uFingerprintStrength;
      float seamX_R = smoothstep(0.015, 0.0, abs(fract(vLocalPosition.x / 1.5 + 0.5) - 0.5) * 1.5);
      float seamZ_R = smoothstep(0.015, 0.0, abs(fract(vLocalPosition.z / 1.5 + 0.5) - 0.5) * 1.5);
      float seams_R = max(seamX_R, seamZ_R);
      
      roughnessFactor = clamp(roughnessFactor + fingerprintsRough * 0.4 + seams_R * 0.5, 0.0, 1.0);
      `
    );

    // 5. Emission map for "glowing data" accents (procedural cyber-accent grids)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      // Glowing tech lines and pulses (active retrievals)
      float glowGrid = step(0.85, sin(vLocalPosition.x * 25.0) * cos(vLocalPosition.y * 25.0));
      float glowPulse = sin(vLocalPosition.y * 5.0 - uTime * 4.0) * 0.5 + 0.5;
      float emissionMask = glowGrid * glowPulse;
      
      // Violet glowing accents on retrieval panels
      totalEmissiveRadiance += vec3(0.6, 0.4, 1.0) * emissionMask * 2.5;
      `
    );

    // 6. Normal Perturbation (Weld lines along seams + animated micro-reflections)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
      // Weld lines normal perturbation
      float weldLines = sin(vLocalPosition.x * 20.0) * sin(vLocalPosition.z * 20.0) * 0.5 + 0.5;
      float seamX_N = smoothstep(0.015, 0.0, abs(fract(vLocalPosition.x / 1.5 + 0.5) - 0.5) * 1.5);
      float seamZ_N = smoothstep(0.015, 0.0, abs(fract(vLocalPosition.z / 1.5 + 0.5) - 0.5) * 1.5);
      float seam_N = max(seamX_N, seamZ_N);
      vec3 weldNormalPerturb = vec3(sin(vLocalPosition.x * 50.0), 0.0, cos(vLocalPosition.z * 50.0)) * seam_N * weldLines * 0.15;
      
      // Animated micro-reflections (very cheap time-based noise for reflective shimmer)
      vec3 reflectionRipple = vec3(
        noise(vLocalPosition * 8.0 + vec3(uTime * 1.2, 0.0, 0.0)) - 0.5,
        0.0,
        noise(vLocalPosition * 8.0 + vec3(0.0, 0.0, uTime * 1.2)) - 0.5
      ) * 0.025;
      
      normal = normalize(normal + weldNormalPerturb + reflectionRipple);
      `
    );
  };

  return (
    <meshStandardMaterial
      ref={materialRef}
      metalness={0.9}
      roughness={roughness}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => "procedural_metal"}
    />
  );
}
