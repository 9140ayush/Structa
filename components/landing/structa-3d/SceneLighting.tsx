"use client";

/**
 * components/landing/structa-3d/SceneLighting.tsx
 *
 * Cinematic lighting for the Structa 3D exploder scene.
 * Soft key light, blue rim, violet fill, controlled ambient.
 * No IBL / Environment to keep GPU load minimal.
 */

import React from "react";

export function SceneLighting() {
  return (
    <>
      {/* Ambient — dark, just enough to see geometry */}
      <ambientLight intensity={0.28} color="#C8D0E0" />

      {/* Key light — blue-white from upper-left-front */}
      <directionalLight
        position={[12, 18, 14]}
        intensity={1.4}
        color="#D8E8FF"
        castShadow={false}
      />

      {/* Blue rim — left side */}
      <pointLight position={[-18, 4, -8]} intensity={30} color="#4A7CFF" distance={60} decay={2} />

      {/* Violet fill — right side */}
      <pointLight position={[16, 2, -6]} intensity={22} color="#7B5CE0" distance={55} decay={2} />

      {/* Green accent glow near AI core */}
      <pointLight position={[0, 10, 0]} intensity={18} color="#3DDC97" distance={40} decay={2} />

      {/* Bottom bounce from repository layer */}
      <pointLight position={[0, -10, 0]} intensity={8} color="#1A2A40" distance={30} decay={2} />
    </>
  );
}
