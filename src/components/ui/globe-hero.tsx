"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

const Globe: React.FC<{
  rotationSpeed: number;
  radius: number;
}> = ({ rotationSpeed, radius }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3;
      groupRef.current.rotation.z += rotationSpeed * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
    </group>
  );
};

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
  ({ rotationSpeed = 0.005, globeRadius = 1, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative w-full h-full overflow-hidden bg-transparent", className)}
        {...props}
      >
        {/* sphere canvas — sits above star warp bg */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={75} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Globe rotationSpeed={rotationSpeed} radius={globeRadius} />
          </Canvas>
        </div>
        {/* children (overlays + arc text + buttons) sit above canvas */}
        <div className="absolute inset-0" style={{ zIndex: 10 }}>
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {children}
          </div>
        </div>
        {/* brand name sits on top of sphere */}
      </div>
    );
  }
);

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
