import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { createAdaptiveRenderer } from "@/graphics/adaptiveRenderer";

const pointPositions = new Float32Array(
  Array.from({ length: 78 }, (_, index) => {
    const point = Math.floor(index / 3);
    const axis = index % 3;
    const angle = point * 2.399963;
    const radius = 1.25 + (point % 7) * 0.12;
    if (axis === 0) return Math.cos(angle) * radius;
    if (axis === 1) return ((point % 11) - 5) * 0.18;
    return Math.sin(angle) * radius;
  }),
);

function ProjectNodes() {
  "use no memo";
  const points = useRef<THREE.Points>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.035;
      points.current.rotation.x = Math.sin(Date.now() * 0.00008) * 0.08;
    }
    if (ring.current) ring.current.rotation.z -= delta * 0.05;
  });

  return (
    <group rotation={[0.25, 0, -0.12]}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#92f5c5" size={0.045} transparent opacity={0.68} />
      </points>
      <mesh ref={ring} rotation={[1.22, 0.15, 0]}>
        <torusGeometry args={[1.85, 0.006, 8, 180]} />
        <meshBasicMaterial color="#d8ad6b" transparent opacity={0.24} />
      </mesh>
      <mesh rotation={[1.05, 0.5, 0.7]}>
        <torusGeometry args={[1.22, 0.004, 8, 140]} />
        <meshBasicMaterial color="#8eb1c5" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

export function IntelligenceField() {
  return (
    <div className="intelligence-field" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={createAdaptiveRenderer}
        fallback={<div className="field-fallback" />}
      >
        <ProjectNodes />
      </Canvas>
    </div>
  );
}
