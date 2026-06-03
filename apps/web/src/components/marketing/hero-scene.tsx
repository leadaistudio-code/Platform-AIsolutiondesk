'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Environment,
  MeshDistortMaterial,
  Icosahedron,
  Sphere,
  Line,
  Stars,
} from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';

/**
 * The hero's 3D centerpiece is an "AI automation core": a glowing neural brain
 * surrounded by agent/task nodes. Edges connect each node back to the core, and
 * data pulses continuously travel inward along those edges — visualizing work
 * flowing into the AI and decisions flowing back out. It is deliberately a
 * network/automation metaphor rather than abstract decoration.
 */

/** Positions of the satellite "agent" nodes around the core (roughly a ring). */
const NODES: { pos: THREE.Vector3; color: string }[] = [
  { pos: new THREE.Vector3(3.0, 1.2, -0.4), color: '#22d3ee' }, // service desk
  { pos: new THREE.Vector3(-3.1, 0.9, 0.5), color: '#a855f7' }, // assistant
  { pos: new THREE.Vector3(2.2, -1.8, 0.8), color: '#6366f1' }, // sales
  { pos: new THREE.Vector3(-2.4, -1.6, -0.6), color: '#ec4899' }, // social
  { pos: new THREE.Vector3(0.2, 2.6, -0.8), color: '#38bdf8' },
  { pos: new THREE.Vector3(-0.6, -2.7, 0.6), color: '#818cf8' },
];

/** A small glowing packet that travels along an edge from a node into the core. */
function DataPulse({
  from,
  color,
  offset,
}: {
  from: THREE.Vector3;
  color: string;
  offset: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    // t cycles 0→1; pulses ride from the node (t=0) to the core at origin (t=1).
    const t = (state.clock.elapsedTime * 0.45 + offset) % 1;
    ref.current.position.copy(from).multiplyScalar(1 - t);
    const s = 0.09 * (0.4 + Math.sin(t * Math.PI)); // fade in/out along the path
    ref.current.scale.setScalar(Math.max(s, 0.001));
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** The full automation network: core + nodes + edges + flowing pulses. */
function AutomationCore() {
  const group = useRef<Group>(null);
  const lattice = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
    }
    if (lattice.current) {
      lattice.current.rotation.y -= delta * 0.25;
      lattice.current.rotation.z += delta * 0.1;
    }
  });

  // Build pulses once: a few staggered packets per edge for a steady stream.
  const pulses = useMemo(
    () =>
      NODES.flatMap((n, i) =>
        [0, 0.33, 0.66].map((o) => ({
          key: `${i}-${o}`,
          from: n.pos,
          color: n.color,
          offset: o,
        })),
      ),
    [],
  );

  return (
    <group ref={group}>
      {/* Central AI brain: soft distorted core inside a rotating neural lattice */}
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <group>
          <Sphere args={[1.05, 64, 64]}>
            <MeshDistortMaterial
              color="#7c5cff"
              emissive="#4827b3"
              emissiveIntensity={0.6}
              roughness={0.15}
              metalness={0.6}
              distort={0.3}
              speed={1.4}
            />
          </Sphere>
          <Icosahedron ref={lattice} args={[1.7, 1]}>
            <meshBasicMaterial wireframe color="#8b7bff" transparent opacity={0.35} />
          </Icosahedron>
        </group>
      </Float>

      {/* Edges from each node back to the core */}
      {NODES.map((n, i) => (
        <Line
          key={`edge-${i}`}
          points={[n.pos, new THREE.Vector3(0, 0, 0)]}
          color={n.color}
          lineWidth={1}
          transparent
          opacity={0.25}
        />
      ))}

      {/* Agent / task nodes */}
      {NODES.map((n, i) => (
        <Float key={`node-${i}`} speed={1.5 + i * 0.2} rotationIntensity={0.6} floatIntensity={1.2}>
          <mesh position={n.pos}>
            <icosahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color={n.color}
              emissive={n.color}
              emissiveIntensity={0.6}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
        </Float>
      ))}

      {/* Data packets flowing inward (automation in motion) */}
      {pulses.map((p) => (
        <DataPulse key={p.key} from={p.from} color={p.color} offset={p.offset} />
      ))}
    </group>
  );
}

/**
 * The full hero canvas. Absolutely positioned by its parent; it is purely
 * decorative so it's marked aria-hidden and pointer-events-none.
 */
export function HeroScene() {
  // Three.js touches the DOM/WebGL, so only render after mount to keep SSR clean.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, -3, -2]} intensity={2} color="#7c5cff" />
          <pointLight position={[5, 2, 3]} intensity={1.5} color="#22d3ee" />
          <AutomationCore />
          <Stars
            radius={50}
            depth={50}
            count={1000}
            factor={4}
            saturation={0}
            fade
            speed={0.4}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
