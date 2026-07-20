import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createAdaptiveRenderer } from "@/graphics/adaptiveRenderer";
import type { NavigationItem } from "@/app/navigation";

export const orbNodes: (NavigationItem & { position: [number, number, number]; metric: string })[] = [
  { label: "Projects", shortLabel: "Projects", to: "/projects", icon: "projects", description: "Shape fragments into approved canon.", position: [-2.25, .9, .55], metric: "24 objects" },
  { label: "Screenplay", shortLabel: "Script", to: "/screenplay", icon: "script", description: "Write, validate, and lock the draft.", position: [1.95, 1.35, -.2], metric: "5 scenes" },
  { label: "Compilation", shortLabel: "Compile", to: "/compile", icon: "compile", description: "Condense canon into professional documents.", position: [2.35, -.8, .4], metric: "17 profiles" },
  { label: "Delivery Rooms", shortLabel: "Delivery", to: "/delivery", icon: "delivery", description: "Share frozen, recipient-safe versions.", position: [-1.75, -1.55, -.35], metric: "2 active" },
  { label: "Settings", shortLabel: "Settings", to: "/settings", icon: "settings", description: "Control team, security, and preferences.", position: [.1, 2.25, -.65], metric: "Team of 4" },
];

const connectionPositions = new Float32Array(
  orbNodes.flatMap((node) => [0, 0, 0, ...node.position]),
);

function createLabelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(245, 242, 233, 0.96)";
    context.font = "600 34px 'Segoe UI', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function NodeLabel({ text, position }: { text: string; position: [number, number, number] }) {
  const [texture] = useState(() => createLabelTexture(text));
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[position[0], position[1] + .38, position[2]]} scale={[1.55, .35, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} opacity={.86} />
    </sprite>
  );
}

interface OrbSceneProps {
  selected: number;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
}

function OrbScene({ selected, onSelect, onOpen }: OrbSceneProps) {
  "use no memo";
  const group = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const previous = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: .08 });

  useFrame((_, delta) => {
    if (!group.current) return;
    if (!dragging.current) {
      group.current.rotation.y += velocity.current.y * delta;
      group.current.rotation.x += velocity.current.x * delta;
      velocity.current.x *= .96;
      velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, .08, .02);
    }
  });

  const startDrag = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    dragging.current = true;
    previous.current = { x: event.clientX, y: event.clientY };
  };
  const drag = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !group.current) return;
    const dx = event.clientX - previous.current.x;
    const dy = event.clientY - previous.current.y;
    group.current.rotation.y += dx * .007;
    group.current.rotation.x += dy * .005;
    group.current.rotation.x = THREE.MathUtils.clamp(group.current.rotation.x, -.8, .8);
    velocity.current = { x: dy * .01, y: dx * .012 };
    previous.current = { x: event.clientX, y: event.clientY };
  };
  const stopDrag = (event: ThreeEvent<PointerEvent>) => {
    dragging.current = false;
    event.stopPropagation();
  };

  return (
    <group ref={group} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={stopDrag} onPointerLeave={(event) => dragging.current ? stopDrag(event) : undefined}>
      <mesh>
        <sphereGeometry args={[2.75, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[connectionPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8f8778" transparent opacity={.22} />
      </lineSegments>
      <mesh>
        <icosahedronGeometry args={[1.34, 5]} />
        <meshPhysicalMaterial color="#26312b" roughness={.52} metalness={.16} clearcoat={.25} clearcoatRoughness={.72} />
      </mesh>
      <mesh scale={1.004}>
        <icosahedronGeometry args={[1.34, 2]} />
        <meshBasicMaterial color="#9c927f" wireframe transparent opacity={.13} />
      </mesh>
      <mesh scale={.82}>
        <sphereGeometry args={[1.34, 28, 28]} />
        <meshBasicMaterial color="#b58d63" transparent opacity={.055} />
      </mesh>
      {orbNodes.map((node, index) => {
        const active = selected === index;
        return (
          <group key={node.to}>
            <mesh
              position={node.position}
              scale={active ? 1.18 : 1}
              onPointerEnter={(event) => { event.stopPropagation(); onSelect(index); document.body.style.cursor = "pointer"; }}
              onPointerLeave={() => { document.body.style.cursor = "default"; }}
              onClick={(event) => { event.stopPropagation(); if (event.delta < 6) onOpen(index); }}
            >
              <sphereGeometry args={[.15, 24, 24]} />
              <meshStandardMaterial color={active ? "#c79a68" : "#e7e1d5"} roughness={.4} metalness={.22} />
            </mesh>
            <mesh position={node.position} scale={active ? 1 : .72}>
              <torusGeometry args={[.27, .012, 8, 48]} />
              <meshBasicMaterial color={active ? "#c79a68" : "#706d65"} transparent opacity={active ? .8 : .38} />
            </mesh>
            <NodeLabel text={node.shortLabel} position={node.position} />
          </group>
        );
      })}
      <ambientLight intensity={1.4} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} color="#f5ead8" />
      <directionalLight position={[-4, -1, 2]} intensity={1.1} color="#769185" />
    </group>
  );
}

export function OrbMenu() {
  const [selected, setSelected] = useState(2);
  const navigate = useNavigate();
  const node = orbNodes[selected] ?? orbNodes[0];
  if (!node) return null;
  const open = (index: number) => {
    const target = orbNodes[index];
    if (target) void navigate({ to: target.to });
  };
  return (
    <div className="orb-menu">
      <div className="orb-canvas" aria-label="Interactive project navigation. Drag to rotate, or use the menu below.">
        <div className="orb-static-guide" aria-hidden="true">
          {orbNodes.map((item, index) => <i key={item.to} className={selected === index ? "active" : ""} />)}
        </div>
        <Canvas camera={{ position: [0, 0, 7.25], fov: 43 }} dpr={[1, 1.5]} gl={createAdaptiveRenderer} fallback={<div className="orb-fallback">3D navigation unavailable</div>}>
          <OrbScene selected={selected} onSelect={setSelected} onOpen={open} />
        </Canvas>
        <div className="orb-instruction"><span>Drag</span> to explore · select a node to enter</div>
      </div>
      <div className="orb-selection" aria-live="polite">
        <p>{String(selected + 1).padStart(2, "0")} / {String(orbNodes.length).padStart(2, "0")}</p>
        <h2>{node.label}</h2>
        <span>{node.description}</span>
        <small>{node.metric}</small>
        <button type="button" onClick={() => open(selected)}>Open workspace <span>→</span></button>
      </div>
      <div className="orb-node-tabs" aria-label="Orb destinations">
        {orbNodes.map((item, index) => (
          <button type="button" className={selected === index ? "active" : ""} key={item.to} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => open(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{item.shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
