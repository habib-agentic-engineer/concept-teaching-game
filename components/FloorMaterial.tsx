"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface FloorMaterialProps {
  tileScale?: number; // Size of each tile
  groutWidth?: number; // Relative width of grout
  terracottaColor?: string; // Hex color for tiles
  groutColor?: string; // Hex color for grout
}

export function FloorMaterial({
  tileScale = 1.0,
  groutWidth = 0.04,
  terracottaColor = "#c2410c", // Rich warm earthy terracotta
  groutColor = "#475569",      // Cool slate-grey grout
}: FloorMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uTerracottaColor = useMemo(() => new THREE.Color(terracottaColor), [terracottaColor]);
  const uGroutColor = useMemo(() => new THREE.Color(groutColor), [groutColor]);

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uTileScale: { value: tileScale },
      uGroutWidth: { value: groutWidth },
      uTerracottaColor: { value: uTerracottaColor },
      uGroutColor: { value: uGroutColor },
      uLightPosition: { value: new THREE.Vector3(10, 20, 10) },
      uLightColor: { value: new THREE.Color("#ffffff") },
      uAmbientColor: { value: new THREE.Color("#555555") },
    };
  }, [tileScale, groutWidth, uTerracottaColor, uGroutColor]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uTileScale;
    uniform float uGroutWidth;
    uniform vec3 uTerracottaColor;
    uniform vec3 uGroutColor;
    uniform vec3 uLightPosition;
    uniform vec3 uLightColor;
    uniform vec3 uAmbientColor;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // Fast GLSL 3D Noise
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

    // Fractal Brownian Motion (2 Octaves for subtle dirt)
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 2; ++i) {
        v += a * noise(vec3(p, 0.0));
        p = p * 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // 1. Grid math for tiles
      // Scale world position for tiles
      vec2 st = vWorldPosition.xz / uTileScale;
      
      // Fract to find coordinate inside the cell [0, 1]
      vec2 grid = fract(st);
      vec2 tileId = floor(st);

      // Determine distance to edge for grout lines
      vec2 distToEdge = min(grid, 1.0 - grid);
      float minEdgeDist = min(distToEdge.x, distToEdge.y);

      // Smooth step to generate crisp grout lines with slight antialiasing
      float isGrout = 1.0 - smoothstep(uGroutWidth - 0.005, uGroutWidth + 0.005, minEdgeDist);

      // 2. Terracotta base color & variation per tile
      // Use tile ID to seed individual tile color variation
      float tileNoiseVal = noise(vec3(tileId * 13.7, 0.0));
      vec3 baseTileColor = mix(uTerracottaColor * 0.85, uTerracottaColor * 1.15, tileNoiseVal);

      // Add high frequency surface color noise (baked clay texture)
      float surfaceTexture = noise(vWorldPosition * 25.0);
      baseTileColor = mix(baseTileColor, baseTileColor * 0.9, surfaceTexture * 0.3);

      // 3. Dirt & high-traffic wear accumulation
      // Define a high traffic path: the main alley around the center (X near 0.0, Z between -3.0 and 6.0)
      float pathFactor = smoothstep(2.5, 0.0, abs(vWorldPosition.x)); // High traffic central walkway
      float counterFactor = smoothstep(1.5, 0.0, length(vWorldPosition - vec3(0.0, 0.0, 1.5))); // Right in front of counter
      
      // Combine traffic areas
      float trafficDensity = max(pathFactor * 0.6, counterFactor * 0.85);

      // Add corners accumulation (dirty edges near building at Z = -2.0)
      float wallShadow = smoothstep(3.5, 1.5, abs(vWorldPosition.z + 2.0)) * smoothstep(5.0, 3.5, abs(vWorldPosition.x));
      float cornerDirt = max(wallShadow * 0.4, smoothstep(2.0, 0.0, minEdgeDist) * 0.15); // more dirt in grout/edges

      // Noise for dirt pattern
      float dirtNoise = fbm(vWorldPosition.xz * 1.5);
      float finalDirt = clamp((trafficDensity * 0.5 + cornerDirt) * (dirtNoise * 1.2 + 0.3), 0.0, 1.0);

      // Blend dirt color (dark brown/grey grease) onto the tile
      vec3 dirtColor = vec3(0.18, 0.15, 0.12);
      vec3 finalTileColor = mix(baseTileColor, dirtColor, finalDirt * 0.7);

      // 4. Height variation & normal perturbation for Grout indentation
      // Compute normal derivative of height to bend the normal slightly near the edges
      float heightGradient = smoothstep(0.0, uGroutWidth * 2.0, minEdgeDist);
      vec2 edgeNormal2D = vec2(0.0);
      if (distToEdge.x < distToEdge.y) {
        edgeNormal2D.x = grid.x < 0.5 ? 1.0 : -1.0;
      } else {
        edgeNormal2D.y = grid.y < 0.5 ? 1.0 : -1.0;
      }
      // Normal perturbation: slope down into the grout
      vec3 edgeNormal = vec3(edgeNormal2D.x * (1.0 - heightGradient), 0.0, edgeNormal2D.y * (1.0 - heightGradient)) * 0.25;
      vec3 perturbedNormal = normalize(vNormal + edgeNormal);

      // Combine Tile & Grout colors
      vec3 finalGroutColor = mix(uGroutColor, dirtColor, finalDirt * 0.4); // grout is also dirty
      vec3 finalSurfaceColor = mix(finalTileColor, finalGroutColor, isGrout);

      // 5. Light calculations
      vec3 N = perturbedNormal;
      vec3 L = normalize(uLightPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);
      vec3 H = normalize(L + V);

      // Diffuse & Specular (tiles have soft clay sheen, grout is completely rough)
      float diffuse = max(dot(N, L), 0.0);
      
      float roughness = mix(0.7, 0.98, isGrout); // grout is rougher
      float shininess = (1.0 - roughness) * 15.0;
      float specular = pow(max(dot(N, H), 0.0), shininess) * (1.0 - roughness);

      vec3 ambient = uAmbientColor * finalSurfaceColor;
      vec3 diffuseComponent = diffuse * uLightColor * finalSurfaceColor;
      vec3 specularComponent = specular * uLightColor * 0.05; // subtle clay glaze specular

      vec3 finalColor = ambient + diffuseComponent + specularComponent;

      // Gamma correction
      finalColor = pow(finalColor, vec3(1.0 / 2.2));

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      lights={false}
    />
  );
}
