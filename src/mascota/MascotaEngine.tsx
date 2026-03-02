import React, { useRef } from "react";
import { View } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import {
  PET_COLORS,
  MX_COLORS,
  STREAK_TIER_CONFIG,
  getStreakTier,
  type StreakTier,
  type TierConfig,
} from "./streakVisuals";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPetColor(petType: string, stage: number): string {
  const colors = PET_COLORS[petType];
  if (!colors) return "#C2185B";
  const idx = Math.min(Math.max(stage - 1, 0), 3);
  return colors.base[idx] ?? colors.base[0];
}

function getPetGlow(petType: string): string {
  return PET_COLORS[petType]?.glow ?? "#F48FB1";
}

// ─── Streak Flame (3D sub-component) ────────────────────────────────────────

function StreakFlame({ config }: { config: TierConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 1.5 + Math.sin(t * 6) * 0.06 * config.flame.scale;
    groupRef.current.scale.y = 1 + Math.sin(t * 8) * 0.15;
    groupRef.current.scale.x = 1 + Math.sin(t * 7.3) * 0.08;
  });

  if (!config.flame.enabled) return null;

  const s = config.flame.scale;

  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      <mesh>
        <sphereGeometry args={[0.14 * s, 12, 12]} />
        <meshStandardMaterial
          color={MX_COLORS.blancoHueso}
          emissive={MX_COLORS.blancoHueso}
          emissiveIntensity={2.0}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.11 * s, 10, 10]} />
        <meshStandardMaterial
          color={config.flame.color}
          emissive={config.flame.color}
          emissiveIntensity={config.flame.emissive}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.18 * s, 10, 10]} />
        <meshStandardMaterial
          color={config.flame.color}
          emissive={config.flame.color}
          emissiveIntensity={config.flame.emissive * 0.5}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Orbiting Particles (3D sub-component) ──────────────────────────────────

function OrbitingParticles({ config }: { config: TierConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.5;
  });

  if (!config.particles.enabled) return null;

  const count = config.particles.count;
  const radius = 1.1;

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={config.particles.color}
              emissive={config.particles.color}
              emissiveIntensity={1.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Cultural Marks (3D sub-component) ──────────────────────────────────────

function CulturalMarks({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <group>
      <mesh position={[0, 0.95, 0.5]} scale={[0.08, 0.08, 0.03]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={MX_COLORS.amarilloCempasuchil}
          emissive={MX_COLORS.amarilloCempasuchil}
          emissiveIntensity={1.2}
        />
      </mesh>
      <mesh position={[0, -0.05, 0.65]} scale={[0.06, 0.06, 0.02]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={MX_COLORS.rosaBugambilia}
          emissive={MX_COLORS.rosaBugambilia}
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh position={[-0.62, 0.0, 0.25]} scale={[0.04, 0.04, 0.02]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={MX_COLORS.azulTalavera}
          emissive={MX_COLORS.azulTalavera}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[0.62, 0.0, 0.25]} scale={[0.04, 0.04, 0.02]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={MX_COLORS.azulTalavera}
          emissive={MX_COLORS.azulTalavera}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

// ─── Egg Form (stage 0) ─────────────────────────────────────────────────────

function EggForm({
  petType,
  mascotaState,
  boostActive,
}: {
  petType: string;
  mascotaState: string;
  boostActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const eggRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const boostPhaseRef = useRef(0);
  const prevBoostRef = useRef(false);

  const glowCol = getPetGlow(petType);
  const color = PET_COLORS[petType]?.base[0] ?? "#C2185B";

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (boostActive && !prevBoostRef.current) boostPhaseRef.current = 1.2;
    prevBoostRef.current = boostActive;
    if (boostPhaseRef.current > 0) boostPhaseRef.current = Math.max(0, boostPhaseRef.current - delta);
    const boostFactor = boostPhaseRef.current > 0
      ? Math.sin((1.2 - boostPhaseRef.current) / 1.2 * Math.PI)
      : 0;

    // Wobble
    if (groupRef.current) {
      if (mascotaState === "happy" || mascotaState === "celebrating") {
        groupRef.current.rotation.z = Math.sin(t * 6) * 0.15;
        groupRef.current.position.y = Math.abs(Math.sin(t * 4)) * 0.12;
      } else {
        groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.06;
        groupRef.current.position.y = Math.sin(t * 0.8) * 0.04;
      }
    }

    // Breathing
    if (eggRef.current) {
      const b = 1 + Math.sin(t * 1.5) * 0.02 + boostFactor * 0.15;
      eggRef.current.scale.set(b, 1 + Math.sin(t * 1.5) * 0.015, b);
    }

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.12 + Math.sin(t * 1.5) * 0.05 + boostFactor * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshStandardMaterial
          color={glowCol}
          transparent
          opacity={0.12}
          emissive={glowCol}
          emissiveIntensity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Egg body — elongated sphere */}
      <mesh ref={eggRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.1}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Top highlight */}
      <mesh position={[0, 0.35, 0.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={MX_COLORS.blancoHueso}
          transparent
          opacity={0.35}
          emissive={MX_COLORS.blancoHueso}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Crack lines (decorative) — small marks on the egg */}
      <mesh position={[0.15, 0.1, 0.55]} scale={[0.12, 0.03, 0.01]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.08, -0.05, 0.56]} scale={[0.09, 0.025, 0.01]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── Baby Form (stage 1 — Cría) ─────────────────────────────────────────────
// Smaller head+body ratio, tiny stub features, big eyes

function BabyForm({
  petType,
  stage,
  mascotaState,
  streakDays,
  boostActive,
}: {
  petType: string;
  stage: number;
  mascotaState: string;
  streakDays: number;
  boostActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const nextBlinkRef = useRef(3 + Math.random() * 4);
  const blinkPhaseRef = useRef(-1);
  const boostPhaseRef = useRef(0);
  const prevBoostRef = useRef(false);

  const color = getPetColor(petType, stage);
  const glowCol = getPetGlow(petType);
  const tier = getStreakTier(streakDays);
  const config = STREAK_TIER_CONFIG[tier];

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (boostActive && !prevBoostRef.current) boostPhaseRef.current = 1.4;
    prevBoostRef.current = boostActive;
    if (boostPhaseRef.current > 0) boostPhaseRef.current = Math.max(0, boostPhaseRef.current - delta);
    const boostFactor = boostPhaseRef.current > 0
      ? Math.sin((1.4 - boostPhaseRef.current) / 1.4 * Math.PI) : 0;

    // Breathing
    if (bodyRef.current) {
      const b = 1 + Math.sin(t * 1.8) * 0.03;
      const bs = 1 + boostFactor * 0.2;
      bodyRef.current.scale.set(b * bs, (1 / b) * bs, b * bs);
    }

    // Glow
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.1 + Math.sin(t * 1.2) * 0.04 + boostFactor * 0.3;
    }

    // Blink
    const canBlink = mascotaState !== "sad" && mascotaState !== "sleeping";
    if (canBlink) {
      nextBlinkRef.current -= delta;
      if (nextBlinkRef.current <= 0 && blinkPhaseRef.current < 0) blinkPhaseRef.current = 0;
      if (blinkPhaseRef.current >= 0) {
        blinkPhaseRef.current += delta / 0.15;
        const p = blinkPhaseRef.current;
        const scaleY = p < 0.5 ? 1 - 0.95 * (p / 0.5) : 0.05 + 0.95 * ((p - 0.5) / 0.5);
        if (leftEyeRef.current) leftEyeRef.current.scale.y = scaleY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = scaleY;
        if (p >= 1) {
          blinkPhaseRef.current = -1;
          nextBlinkRef.current = 3 + Math.random() * 4;
          if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        }
      }
    }

    // Movement
    if (groupRef.current) {
      if (mascotaState === "happy" || mascotaState === "celebrating") {
        groupRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.18;
        groupRef.current.rotation.z = Math.sin(t * 6) * 0.1;
      } else if (mascotaState === "sad") {
        groupRef.current.position.y = -Math.abs(Math.sin(t * 0.8)) * 0.06;
        groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.06;
      } else {
        groupRef.current.position.y = Math.sin(t * 1.0) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.1;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  // Baby is 70% the size of adult
  const s = 0.7;

  return (
    <group ref={groupRef} scale={[s, s, s]}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshStandardMaterial color={glowCol} transparent opacity={0.1} emissive={glowCol} emissiveIntensity={0.5} depthWrite={false} />
      </mesh>

      {/* Body — rounder, smaller */}
      <mesh ref={bodyRef} position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} emissive={color} emissiveIntensity={0.15} />
      </mesh>

      {/* Head — proportionally bigger (baby look) */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} emissive={color} emissiveIntensity={0.15} />
      </mesh>

      {/* Big baby eyes */}
      <mesh ref={leftEyeRef} position={[-0.2, 0.6, 0.4]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.2, 0.6, 0.4]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Big eye shines */}
      <mesh position={[-0.17, 0.64, 0.5]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.23, 0.64, 0.5]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1} />
      </mesh>

      {/* Tiny stub gills for ajolote baby */}
      {petType === "ajolote" && (
        <>
          <mesh position={[-0.38, 0.82, 0]} rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.04, 0.15, 6]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0.38, 0.82, 0]} rotation={[0, 0, 0.5]}>
            <coneGeometry args={[0.04, 0.15, 6]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <coneGeometry args={[0.035, 0.12, 6]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.4} />
          </mesh>
        </>
      )}

      {/* Tiny stub ears for xolo baby */}
      {petType === "xolo" && (
        <>
          <mesh position={[-0.32, 0.95, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.07, 0.18, 4]} />
            <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0.32, 0.95, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.07, 0.18, 4]} />
            <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.1} />
          </mesh>
        </>
      )}

      {/* Tiny nub horns for alebrije baby */}
      {petType === "alebrije" && (
        <>
          <mesh position={[-0.2, 1.0, 0]} rotation={[0.1, 0, -0.3]}>
            <coneGeometry args={[0.03, 0.15, 6]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.2, 1.0, 0]} rotation={[0.1, 0, 0.3]}>
            <coneGeometry args={[0.03, 0.15, 6]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.5} />
          </mesh>
        </>
      )}

      {/* Tiny tail nub */}
      <mesh position={[0, -0.52, -0.3]} rotation={[0.5, 0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* Streak visuals even on baby */}
      <StreakFlame config={config} />
      <OrbitingParticles config={config} />
    </group>
  );
}

// ─── Xolo Aura Rings (concentric torus, like reference images) ──────────────

function XoloAuraRings({ tier, config }: { tier: StreakTier; config: TierConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) groupRef.current.rotation.y = t * 0.15;
    if (ring1Ref.current) ring1Ref.current.rotation.z += 0.004;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= 0.003;
    if (ring3Ref.current) ring3Ref.current.rotation.z += 0.002;
    // Pulse opacity
    [ring1Ref, ring2Ref, ring3Ref].forEach((ref, i) => {
      if (!ref.current) return;
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      if (mat.opacity > 0) {
        const base = mat.userData.baseOpacity ?? mat.opacity;
        mat.opacity = base + Math.sin(t * 1.8 + i * 1.2) * 0.06;
      }
    });
  });

  if (tier < 2) return null;

  const ringColor = tier >= 4 ? MX_COLORS.oroCempasuchil : MX_COLORS.naranjaFuego;
  const o1 = tier >= 4 ? 0.45 : tier >= 3 ? 0.3 : 0.18;
  const o2 = tier >= 4 ? 0.3 : tier >= 3 ? 0.2 : 0.1;
  const o3 = tier >= 4 ? 0.2 : 0;

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {/* Ring 1 — inner */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.022, 12, 36]} />
        <meshStandardMaterial
          color={ringColor} emissive={ringColor} emissiveIntensity={1.2}
          transparent opacity={o1} depthWrite={false} side={2}
          userData={{ baseOpacity: o1 }}
        />
      </mesh>
      {/* Ring 2 — outer, tilted */}
      {tier >= 3 && (
        <mesh ref={ring2Ref} rotation={[Math.PI / 2 + 0.25, 0.15, 0]}>
          <torusGeometry args={[1.15, 0.016, 12, 36]} />
          <meshStandardMaterial
            color={ringColor} emissive={ringColor} emissiveIntensity={0.9}
            transparent opacity={o2} depthWrite={false} side={2}
            userData={{ baseOpacity: o2 }}
          />
        </mesh>
      )}
      {/* Ring 3 — outermost, Tier 4 only */}
      {tier >= 4 && (
        <mesh ref={ring3Ref} rotation={[Math.PI / 2 - 0.15, -0.1, 0.2]}>
          <torusGeometry args={[1.45, 0.012, 12, 36]} />
          <meshStandardMaterial
            color={MX_COLORS.oroCempasuchil} emissive={MX_COLORS.oroCempasuchil} emissiveIntensity={1.5}
            transparent opacity={o3} depthWrite={false} side={2}
            userData={{ baseOpacity: o3 }}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Xolo Bandana (neck accessory, Tier 4 / stage 3+) ──────────────────────

function XoloBandana({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[0, 0.38, 0.05]}>
      {/* Ring around neck */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]}>
        <torusGeometry args={[0.28, 0.04, 8, 16]} />
        <meshStandardMaterial
          color="#FF6F00" roughness={0.6} metalness={0.0}
          emissive="#FF6F00" emissiveIntensity={0.2}
        />
      </mesh>
      {/* Triangle hanging in front */}
      <mesh position={[0, -0.08, 0.22]} rotation={[0.3, 0, 0]} scale={[0.18, 0.14, 0.02]}>
        <coneGeometry args={[1, 1, 3]} />
        <meshStandardMaterial
          color="#FF6F00" roughness={0.6}
          emissive="#FF6F00" emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

// ─── Xolo Adult Form (stage 2-4) — proper dog anatomy ───────────────────────

function XoloAdultForm({
  stage = 2,
  mascotaState = "idle",
  streakDays = 0,
  boostActive = false,
}: {
  stage: number;
  mascotaState: string;
  streakDays: number;
  boostActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);

  const nextBlinkRef = useRef(3 + Math.random() * 4);
  const blinkPhaseRef = useRef(-1);
  const boostPhaseRef = useRef(0);
  const prevBoostRef = useRef(false);

  const tier = getStreakTier(streakDays);
  const config = STREAK_TIER_CONFIG[tier];

  const color = getPetColor("xolo", stage);
  const glowCol = getPetGlow("xolo");
  const darkColor = "#2E1A0E";

  const roughness = 0.32 - tier * 0.02;
  const metalness = 0.08 + tier * 0.04;
  const emI = 0.12 + config.emissiveBoost;

  const stageScale = stage <= 2 ? 0.88 : stage === 3 ? 0.96 : 1.05;

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Boost
    if (boostActive && !prevBoostRef.current) boostPhaseRef.current = 1.4;
    prevBoostRef.current = boostActive;
    if (boostPhaseRef.current > 0) boostPhaseRef.current = Math.max(0, boostPhaseRef.current - delta);
    const boost = boostPhaseRef.current > 0
      ? Math.sin((1.4 - boostPhaseRef.current) / 1.4 * Math.PI) : 0;

    // Breathing on body group
    if (bodyRef.current) {
      const bS = config.breathingSpeed;
      const bA = 0.02 + tier * 0.004;
      const b = 1 + Math.sin(t * bS) * bA;
      const bs = 1 + boost * 0.2;
      bodyRef.current.scale.set(b * bs, (1 / b) * bs, b * bs);
    }

    // Tail wag
    if (tailRef.current) {
      const wagSpeed = mascotaState === "happy" || mascotaState === "celebrating" ? 8 : 2.5;
      const wagAmp = mascotaState === "happy" || mascotaState === "celebrating" ? 0.4 : 0.15;
      tailRef.current.rotation.x = -0.3 + Math.sin(t * wagSpeed) * wagAmp;
    }

    // Eye blink
    const canBlink = mascotaState !== "sad" && mascotaState !== "sleeping";
    if (canBlink) {
      nextBlinkRef.current -= delta;
      if (nextBlinkRef.current <= 0 && blinkPhaseRef.current < 0) blinkPhaseRef.current = 0;
      if (blinkPhaseRef.current >= 0) {
        blinkPhaseRef.current += delta / 0.15;
        const p = blinkPhaseRef.current;
        const sY = p < 0.5 ? 1 - 0.95 * (p / 0.5) : 0.05 + 0.95 * ((p - 0.5) / 0.5);
        if (leftEyeRef.current) leftEyeRef.current.scale.y = sY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = sY;
        if (p >= 1) {
          blinkPhaseRef.current = -1;
          nextBlinkRef.current = 3 + Math.random() * 4;
          if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        }
      }
    }

    // Group movement (same state machine as AdultForm)
    if (groupRef.current) {
      const baseY = config.positionY;
      const bobAmp = config.idleBobAmplitude;
      if (mascotaState === "happy" || mascotaState === "celebrating") {
        groupRef.current.position.y = baseY + Math.abs(Math.sin(t * 4)) * 0.22;
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.12;
      } else if (mascotaState === "sad") {
        groupRef.current.position.y = baseY - Math.abs(Math.sin(t * 0.8)) * 0.08;
        groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.08;
      } else if (mascotaState === "sleeping") {
        groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.06;
        groupRef.current.position.y = baseY - 0.05;
      } else if (mascotaState === "streakLost") {
        groupRef.current.position.y = baseY - 0.12;
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.04;
        groupRef.current.scale.set(0.92, 0.92, 0.92);
      } else if (mascotaState === "streakRecord") {
        groupRef.current.position.y = baseY + Math.abs(Math.sin(t * 3)) * 0.35;
        groupRef.current.rotation.y = t * 2;
        groupRef.current.rotation.z = Math.sin(t * 6) * 0.15;
      } else {
        groupRef.current.position.y = baseY + Math.sin(t * 0.9) * bobAmp;
        groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.12;
        groupRef.current.rotation.z = 0;
        groupRef.current.scale.set(1, 1, 1);
      }
    }
  });

  const bs = config.bodyScale * stageScale;
  const showBandana = tier >= 4 || stage >= 4;

  return (
    <group ref={groupRef} scale={[bs, bs, bs]}>
      {/* === Aura Rings (replaces sphere glow for xolo) === */}
      <XoloAuraRings tier={tier} config={config} />

      {/* === Subtle sphere glow (kept minimal) === */}
      <mesh>
        <sphereGeometry args={[1.1 * config.glowScale, 14, 14]} />
        <meshStandardMaterial
          color={glowCol} transparent opacity={config.glowOpacity * 0.5}
          emissive={glowCol} emissiveIntensity={0.4} depthWrite={false}
        />
      </mesh>

      {/* === Dog Body === */}
      <group ref={bodyRef}>
        {/* Torso — elongated sphere */}
        <mesh position={[0, 0, 0]} scale={[1, 0.78, 1.35]}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={color} emissiveIntensity={emI} />
        </mesh>

        {/* Chest — front bump */}
        <mesh position={[0, 0.08, 0.38]}>
          <sphereGeometry args={[0.32, 20, 20]} />
          <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={color} emissiveIntensity={emI} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.28, 0.32]} rotation={[0.35, 0, 0]} scale={[1, 1.2, 1]}>
          <cylinderGeometry args={[0.18, 0.22, 0.28, 10]} />
          <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={color} emissiveIntensity={emI} />
        </mesh>

        {/* Bandana */}
        <XoloBandana visible={showBandana} />

        {/* === Head === */}
        <group position={[0, 0.62, 0.38]}>
          {/* Skull */}
          <mesh>
            <sphereGeometry args={[0.34, 24, 24]} />
            <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={color} emissiveIntensity={emI} />
          </mesh>

          {/* Snout / muzzle */}
          <mesh position={[0, -0.08, 0.28]} scale={[0.55, 0.48, 0.75]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={color} roughness={roughness * 0.8} metalness={metalness} emissive={color} emissiveIntensity={emI} />
          </mesh>

          {/* Nose */}
          <mesh position={[0, -0.05, 0.44]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color={darkColor} roughness={0.9} />
          </mesh>

          {/* Eye whites */}
          <mesh position={[-0.14, 0.06, 0.26]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.2} />
          </mesh>
          <mesh position={[0.14, 0.06, 0.26]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.2} />
          </mesh>

          {/* Pupils */}
          <mesh ref={leftEyeRef} position={[-0.14, 0.07, 0.33]}>
            <sphereGeometry args={[0.058, 12, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.14, 0.07, 0.33]}>
            <sphereGeometry args={[0.058, 12, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>

          {/* Eye shines */}
          <mesh position={[-0.12, 0.1, 0.38]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.16, 0.1, 0.38]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1.2} />
          </mesh>

          {/* Ears — tall, pointy, alert */}
          <mesh position={[-0.26, 0.32, -0.05]} rotation={[0.15, 0, -0.25]}>
            <coneGeometry args={[0.1, 0.5, 5]} />
            <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={emI * 0.6} />
          </mesh>
          <mesh position={[0.26, 0.32, -0.05]} rotation={[0.15, 0, 0.25]}>
            <coneGeometry args={[0.1, 0.5, 5]} />
            <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={emI * 0.6} />
          </mesh>
          {/* Ear inner (slightly lighter) */}
          <mesh position={[-0.24, 0.3, -0.02]} rotation={[0.15, 0, -0.25]} scale={[0.6, 0.8, 0.3]}>
            <coneGeometry args={[0.1, 0.5, 5]} />
            <meshStandardMaterial color={glowCol} roughness={0.5} emissive={glowCol} emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0.24, 0.3, -0.02]} rotation={[0.15, 0, 0.25]} scale={[0.6, 0.8, 0.3]}>
            <coneGeometry args={[0.1, 0.5, 5]} />
            <meshStandardMaterial color={glowCol} roughness={0.5} emissive={glowCol} emissiveIntensity={0.15} />
          </mesh>
        </group>

        {/* === 4 Legs === */}
        {/* Front-Left */}
        <group position={[-0.2, -0.35, 0.28]}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.06, 0.42, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.3} />
          </mesh>
        </group>
        {/* Front-Right */}
        <group position={[0.2, -0.35, 0.28]}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.06, 0.42, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.3} />
          </mesh>
        </group>
        {/* Back-Left */}
        <group position={[-0.18, -0.32, -0.32]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.065, 0.45, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.26, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.3} />
          </mesh>
        </group>
        {/* Back-Right */}
        <group position={[0.18, -0.32, -0.32]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.065, 0.45, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.26, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.3} />
          </mesh>
        </group>

        {/* === Tail — 3 segments curving upward === */}
        <group ref={tailRef} position={[0, 0.05, -0.52]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, 0.14, -0.08]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, 0.28, -0.06]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={color} roughness={roughness} emissive={color} emissiveIntensity={emI * 0.5} />
          </mesh>
        </group>
      </group>

      {/* === Stage 4 halo === */}
      {stage >= 4 && (
        <mesh position={[0, 1.15, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.035, 12, 24]} />
          <meshStandardMaterial
            color={MX_COLORS.oroCempasuchil} emissive={MX_COLORS.oroCempasuchil}
            emissiveIntensity={1.5}
          />
        </mesh>
      )}

      {/* === Streak VFX (reused) === */}
      <StreakFlame config={config} />
      <OrbitingParticles config={config} />
      <CulturalMarks show={config.culturalDetails} />
    </group>
  );
}

// ─── Xolo Baby Form (stage 1) — puppy proportions ──────────────────────────

function XoloBabyForm({
  stage = 1,
  mascotaState = "idle",
  streakDays = 0,
  boostActive = false,
}: {
  stage: number;
  mascotaState: string;
  streakDays: number;
  boostActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);

  const nextBlinkRef = useRef(3 + Math.random() * 4);
  const blinkPhaseRef = useRef(-1);
  const boostPhaseRef = useRef(0);
  const prevBoostRef = useRef(false);

  const color = getPetColor("xolo", stage);
  const glowCol = getPetGlow("xolo");
  const darkColor = "#2E1A0E";
  const tier = getStreakTier(streakDays);
  const config = STREAK_TIER_CONFIG[tier];

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (boostActive && !prevBoostRef.current) boostPhaseRef.current = 1.4;
    prevBoostRef.current = boostActive;
    if (boostPhaseRef.current > 0) boostPhaseRef.current = Math.max(0, boostPhaseRef.current - delta);
    const boost = boostPhaseRef.current > 0
      ? Math.sin((1.4 - boostPhaseRef.current) / 1.4 * Math.PI) : 0;

    if (bodyRef.current) {
      const b = 1 + Math.sin(t * 1.8) * 0.03;
      const bs = 1 + boost * 0.2;
      bodyRef.current.scale.set(b * bs, (1 / b) * bs, b * bs);
    }

    if (tailRef.current) {
      tailRef.current.rotation.x = -0.2 + Math.sin(t * 3) * 0.2;
    }

    // Blink
    const canBlink = mascotaState !== "sad" && mascotaState !== "sleeping";
    if (canBlink) {
      nextBlinkRef.current -= delta;
      if (nextBlinkRef.current <= 0 && blinkPhaseRef.current < 0) blinkPhaseRef.current = 0;
      if (blinkPhaseRef.current >= 0) {
        blinkPhaseRef.current += delta / 0.15;
        const p = blinkPhaseRef.current;
        const sY = p < 0.5 ? 1 - 0.95 * (p / 0.5) : 0.05 + 0.95 * ((p - 0.5) / 0.5);
        if (leftEyeRef.current) leftEyeRef.current.scale.y = sY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = sY;
        if (p >= 1) {
          blinkPhaseRef.current = -1;
          nextBlinkRef.current = 3 + Math.random() * 4;
          if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        }
      }
    }

    // Movement
    if (groupRef.current) {
      if (mascotaState === "happy" || mascotaState === "celebrating") {
        groupRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.18;
        groupRef.current.rotation.z = Math.sin(t * 6) * 0.1;
      } else if (mascotaState === "sad") {
        groupRef.current.position.y = -Math.abs(Math.sin(t * 0.8)) * 0.06;
        groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.06;
      } else {
        groupRef.current.position.y = Math.sin(t * 1.0) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.1;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  const s = 0.65;

  return (
    <group ref={groupRef} scale={[s, s, s]}>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[1.0, 14, 14]} />
        <meshStandardMaterial color={glowCol} transparent opacity={0.08} emissive={glowCol} emissiveIntensity={0.4} depthWrite={false} />
      </mesh>

      <group ref={bodyRef}>
        {/* Torso — rounder for baby */}
        <mesh position={[0, 0, 0]} scale={[1, 0.85, 1.2]}>
          <sphereGeometry args={[0.38, 20, 20]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} emissive={color} emissiveIntensity={0.1} />
        </mesh>

        {/* Head — proportionally bigger */}
        <group position={[0, 0.45, 0.25]}>
          <mesh>
            <sphereGeometry args={[0.36, 20, 20]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} emissive={color} emissiveIntensity={0.1} />
          </mesh>

          {/* Baby snout (smaller) */}
          <mesh position={[0, -0.06, 0.28]} scale={[0.5, 0.45, 0.6]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={0.08} />
          </mesh>

          {/* Baby nose */}
          <mesh position={[0, -0.04, 0.38]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={darkColor} roughness={0.9} />
          </mesh>

          {/* Big baby eyes (whites) */}
          <mesh position={[-0.13, 0.06, 0.28]}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.2} />
          </mesh>
          <mesh position={[0.13, 0.06, 0.28]}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.2} />
          </mesh>

          {/* Baby pupils */}
          <mesh ref={leftEyeRef} position={[-0.13, 0.07, 0.35]}>
            <sphereGeometry args={[0.062, 10, 10]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.13, 0.07, 0.35]}>
            <sphereGeometry args={[0.062, 10, 10]} />
            <meshStandardMaterial color="#111" />
          </mesh>

          {/* Baby eye shines */}
          <mesh position={[-0.11, 0.1, 0.4]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1} />
          </mesh>
          <mesh position={[0.15, 0.1, 0.4]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1} />
          </mesh>

          {/* Stub ears */}
          <mesh position={[-0.24, 0.28, -0.02]} rotation={[0.1, 0, -0.3]}>
            <coneGeometry args={[0.07, 0.22, 4]} />
            <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.08} />
          </mesh>
          <mesh position={[0.24, 0.28, -0.02]} rotation={[0.1, 0, 0.3]}>
            <coneGeometry args={[0.07, 0.22, 4]} />
            <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.08} />
          </mesh>
        </group>

        {/* Short baby legs */}
        {[[-0.16, -0.28, 0.2], [0.16, -0.28, 0.2], [-0.15, -0.26, -0.22], [0.15, -0.26, -0.22]].map(
          ([x, y, z], i) => (
            <group key={i} position={[x as number, y as number, z as number]}>
              <mesh>
                <cylinderGeometry args={[0.05, 0.055, 0.28, 8]} />
                <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={0.06} />
              </mesh>
              <mesh position={[0, -0.16, 0]}>
                <sphereGeometry args={[0.058, 6, 6]} />
                <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={0.04} />
              </mesh>
            </group>
          ),
        )}

        {/* Baby tail */}
        <group ref={tailRef} position={[0, 0.05, -0.38]}>
          <mesh>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={0.06} />
          </mesh>
          <mesh position={[0, 0.1, -0.04]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={0.06} />
          </mesh>
        </group>
      </group>

      {/* Baby streak visuals */}
      <StreakFlame config={config} />
      <OrbitingParticles config={config} />
    </group>
  );
}

// ─── Full Adult Character (stage 2-4) ────────────────────────────────────────

function AdultForm({
  petType = "ajolote",
  stage = 2,
  mascotaState = "idle",
  streakDays = 0,
  boostActive = false,
}: {
  petType: string;
  stage: number;
  mascotaState: string;
  streakDays: number;
  boostActive: boolean;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Mesh>(null);
  const glowRef     = useRef<THREE.Mesh>(null);
  const leftEyeRef  = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  const nextBlinkRef = useRef(3 + Math.random() * 4);
  const blinkPhaseRef = useRef(-1);
  const boostPhaseRef = useRef(0);
  const prevBoostRef  = useRef(false);

  const tier = getStreakTier(streakDays);
  const config = STREAK_TIER_CONFIG[tier];

  const color   = getPetColor(petType, stage);
  const glowCol = getPetGlow(petType);

  const roughness = 0.28 - tier * 0.02;
  const metalness = 0.12 + tier * 0.03;
  const emissiveIntensity = 0.18 + config.emissiveBoost;

  // Stage-dependent scaling: 2=0.88, 3=0.96, 4=1.05
  const stageScale = stage <= 2 ? 0.88 : stage === 3 ? 0.96 : 1.05;

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Boost trigger
    if (boostActive && !prevBoostRef.current) boostPhaseRef.current = 1.4;
    prevBoostRef.current = boostActive;
    if (boostPhaseRef.current > 0) boostPhaseRef.current = Math.max(0, boostPhaseRef.current - delta);
    const boostFactor = boostPhaseRef.current > 0
      ? Math.sin((1.4 - boostPhaseRef.current) / 1.4 * Math.PI) : 0;

    // Breathing
    if (bodyRef.current) {
      const bSpeed = config.breathingSpeed;
      const bAmp = 0.025 + tier * 0.005;
      const b = 1 + Math.sin(t * bSpeed) * bAmp;
      const boostScale = 1 + boostFactor * 0.25;
      bodyRef.current.scale.set(b * boostScale, (1 / b) * boostScale, b * boostScale);
    }

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = config.glowOpacity + Math.sin(t * 1.2) * 0.04 + boostFactor * 0.4;
      mat.emissiveIntensity = 0.6 + boostFactor * 1.5;
    }

    // Eye blink
    const canBlink = mascotaState !== "sad" && mascotaState !== "sleeping";
    if (canBlink) {
      nextBlinkRef.current -= delta;
      if (nextBlinkRef.current <= 0 && blinkPhaseRef.current < 0) blinkPhaseRef.current = 0;
      if (blinkPhaseRef.current >= 0) {
        blinkPhaseRef.current += delta / 0.15;
        const p = blinkPhaseRef.current;
        const scaleY = p < 0.5 ? 1 - 0.95 * (p / 0.5) : 0.05 + 0.95 * ((p - 0.5) / 0.5);
        if (leftEyeRef.current) leftEyeRef.current.scale.y = scaleY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = scaleY;
        if (p >= 1) {
          blinkPhaseRef.current = -1;
          nextBlinkRef.current = 3 + Math.random() * 4;
          if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        }
      }
    }

    // Group movement
    if (groupRef.current) {
      const baseY = config.positionY;
      const bobAmp = config.idleBobAmplitude;

      if (mascotaState === "happy" || mascotaState === "celebrating") {
        groupRef.current.position.y = baseY + Math.abs(Math.sin(t * 4)) * 0.22;
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.12;
      } else if (mascotaState === "sad") {
        groupRef.current.position.y = baseY - Math.abs(Math.sin(t * 0.8)) * 0.08;
        groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.08;
      } else if (mascotaState === "sleeping") {
        groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.06;
        groupRef.current.position.y = baseY - 0.05;
      } else if (mascotaState === "streakLost") {
        groupRef.current.position.y = baseY - 0.12;
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.04;
        groupRef.current.scale.set(0.92, 0.92, 0.92);
      } else if (mascotaState === "streakRecord") {
        groupRef.current.position.y = baseY + Math.abs(Math.sin(t * 3)) * 0.35;
        groupRef.current.rotation.y = t * 2;
        groupRef.current.rotation.z = Math.sin(t * 6) * 0.15;
      } else {
        groupRef.current.position.y = baseY + Math.sin(t * 0.9) * bobAmp;
        groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.12;
        groupRef.current.rotation.z = 0;
        groupRef.current.scale.set(1, 1, 1);
      }
    }
  });

  const bodyScale = config.bodyScale * stageScale;

  return (
    <group ref={groupRef} scale={[bodyScale, bodyScale, bodyScale]}>
      {/* Glow aura */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.15 * config.glowScale, 16, 16]} />
        <meshStandardMaterial color={glowCol} transparent opacity={config.glowOpacity} emissive={glowCol} emissiveIntensity={0.6} depthWrite={false} />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.68, 32, 32]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={color} emissiveIntensity={emissiveIntensity} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.54, 32, 32]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={color} emissiveIntensity={emissiveIntensity} />
      </mesh>

      {/* Eyes */}
      <mesh ref={leftEyeRef} position={[-0.21, 0.77, 0.44]}>
        <sphereGeometry args={[0.095, 16, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.21, 0.77, 0.44]}>
        <sphereGeometry args={[0.095, 16, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Eye shines */}
      <mesh position={[-0.18, 0.80, 0.53]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.24, 0.80, 0.53]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1} />
      </mesh>

      {/* Ajolote: external gills */}
      {petType === "ajolote" && (
        <>
          <mesh position={[-0.52, 1.02, 0]} rotation={[0, 0, -0.55]}>
            <coneGeometry args={[0.075, 0.36, 8]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.52, 1.02, 0]} rotation={[0, 0, 0.55]}>
            <coneGeometry args={[0.075, 0.36, 8]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1.28, 0]}>
            <coneGeometry args={[0.07, 0.32, 8]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.5} />
          </mesh>
        </>
      )}

      {/* Xolo: pointy ears */}
      {petType === "xolo" && (
        <>
          <mesh position={[-0.42, 1.18, 0]} rotation={[0, 0, -0.28]}>
            <coneGeometry args={[0.14, 0.42, 4]} />
            <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0.42, 1.18, 0]} rotation={[0, 0, 0.28]}>
            <coneGeometry args={[0.14, 0.42, 4]} />
            <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.1} />
          </mesh>
        </>
      )}

      {/* Alebrije: fantasy crown horns */}
      {petType === "alebrije" && (
        <>
          <mesh position={[-0.27, 1.28, 0]} rotation={[0.2, 0, -0.32]}>
            <coneGeometry args={[0.055, 0.42, 6]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0.27, 1.28, 0]} rotation={[0.2, 0, 0.32]}>
            <coneGeometry args={[0.055, 0.42, 6]} />
            <meshStandardMaterial color={glowCol} emissive={glowCol} emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0, 1.42, 0]} rotation={[0.1, 0, 0]}>
            <coneGeometry args={[0.065, 0.52, 6]} />
            <meshStandardMaterial color={MX_COLORS.oroCempasuchil} emissive={MX_COLORS.oroCempasuchil} emissiveIntensity={0.9} />
          </mesh>
        </>
      )}

      {/* Tail */}
      <mesh position={[0, -0.72, -0.42]} rotation={[0.5, 0, 0]}>
        <sphereGeometry args={[0.19, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={emissiveIntensity * 0.7} />
      </mesh>

      {/* Stage 4 mítico: crown/halo */}
      {stage >= 4 && (
        <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.04, 12, 24]} />
          <meshStandardMaterial color={MX_COLORS.oroCempasuchil} emissive={MX_COLORS.oroCempasuchil} emissiveIntensity={1.5} />
        </mesh>
      )}

      {/* Streak Visuals */}
      <StreakFlame config={config} />
      <OrbitingParticles config={config} />
      <CulturalMarks show={config.culturalDetails} />
    </group>
  );
}

// ─── Alebrije Wings (butterfly/dragonfly, animated) ──────────────────────────

function AlebrijeWings({
  stage,
  mascotaState,
}: {
  stage: number;
  mascotaState: string;
}) {
  const leftWingRef  = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const isCelebrating = mascotaState === "happy" || mascotaState === "celebrating";
    const flapSpeed = isCelebrating ? 7 : 2.0;
    const flapAmp   = isCelebrating ? 0.32 : 0.10;
    const flapVal   = Math.sin(t * flapSpeed) * flapAmp;

    if (leftWingRef.current)  leftWingRef.current.rotation.z  =  flapVal;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flapVal;
  });

  const wingColor   = "#E91E63";   // vivid magenta
  const wingColor2  = "#FF80AB";   // lighter pink for lower wing
  const ribColor    = "#FFD700";   // gold ribs
  const tipColor    = stage >= 4 ? "#FFD700" : stage >= 3 ? "#FFB300" : "#FF8A65";
  const opacity     = 0.78;

  // Wing size scales with stage
  const sW = stage >= 4 ? 1.0 : stage >= 3 ? 0.88 : 0.76;
  const sH = stage >= 4 ? 1.0 : stage >= 3 ? 0.88 : 0.76;

  return (
    <group position={[0, 0.05, 0]}>
      {/* ── LEFT WINGS ── */}
      <group ref={leftWingRef} position={[-0.38, 0.18, 0.05]}>
        {/* Upper wing membrane — large teardrop shape */}
        <mesh scale={[sW * 0.52, sH * 0.78, 0.05]} rotation={[0, 0, -0.28]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial
            color={wingColor} transparent opacity={opacity}
            emissive={wingColor} emissiveIntensity={0.45}
            side={2} depthWrite={false}
          />
        </mesh>
        {/* Upper wing rib */}
        <mesh position={[-0.18, 0.14, 0]} rotation={[0, 0, -0.28]} scale={[0.38, 0.01, 0.01]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={ribColor} emissive={ribColor} emissiveIntensity={1.2} />
        </mesh>
        {/* Stage 3+ wing tip gem */}
        {stage >= 3 && (
          <mesh position={[-0.48, 0.5, 0]}>
            <sphereGeometry args={[0.055, 6, 6]} />
            <meshStandardMaterial color={tipColor} emissive={tipColor} emissiveIntensity={1.8} />
          </mesh>
        )}

        {/* Lower wing membrane — smaller rounded lobe */}
        <mesh position={[-0.06, -0.46, 0]} scale={[sW * 0.38, sH * 0.48, 0.04]} rotation={[0, 0, 0.18]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial
            color={wingColor2} transparent opacity={opacity * 0.85}
            emissive={wingColor2} emissiveIntensity={0.3}
            side={2} depthWrite={false}
          />
        </mesh>
        {/* Lower rib */}
        <mesh position={[-0.1, -0.32, 0]} rotation={[0, 0, 0.4]} scale={[0.26, 0.008, 0.008]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={ribColor} emissive={ribColor} emissiveIntensity={0.9} />
        </mesh>
      </group>

      {/* ── RIGHT WINGS (mirrored) ── */}
      <group ref={rightWingRef} position={[0.38, 0.18, 0.05]}>
        {/* Upper wing */}
        <mesh scale={[sW * 0.52, sH * 0.78, 0.05]} rotation={[0, 0, 0.28]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial
            color={wingColor} transparent opacity={opacity}
            emissive={wingColor} emissiveIntensity={0.45}
            side={2} depthWrite={false}
          />
        </mesh>
        <mesh position={[0.18, 0.14, 0]} rotation={[0, 0, 0.28]} scale={[0.38, 0.01, 0.01]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={ribColor} emissive={ribColor} emissiveIntensity={1.2} />
        </mesh>
        {stage >= 3 && (
          <mesh position={[0.48, 0.5, 0]}>
            <sphereGeometry args={[0.055, 6, 6]} />
            <meshStandardMaterial color={tipColor} emissive={tipColor} emissiveIntensity={1.8} />
          </mesh>
        )}
        {/* Lower wing */}
        <mesh position={[0.06, -0.46, 0]} scale={[sW * 0.38, sH * 0.48, 0.04]} rotation={[0, 0, -0.18]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial
            color={wingColor2} transparent opacity={opacity * 0.85}
            emissive={wingColor2} emissiveIntensity={0.3}
            side={2} depthWrite={false}
          />
        </mesh>
        <mesh position={[0.1, -0.32, 0]} rotation={[0, 0, -0.4]} scale={[0.26, 0.008, 0.008]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={ribColor} emissive={ribColor} emissiveIntensity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Alebrije Baby Form (stage 1) — cute hatchling with wing nubs ──────────

function AlebrijevBabyForm({
  stage = 1,
  mascotaState = "idle",
  streakDays = 0,
  boostActive = false,
}: {
  stage: number;
  mascotaState: string;
  streakDays: number;
  boostActive: boolean;
}) {
  const groupRef     = useRef<THREE.Group>(null);
  const bodyRef      = useRef<THREE.Mesh>(null);
  const glowRef      = useRef<THREE.Mesh>(null);
  const leftEyeRef   = useRef<THREE.Mesh>(null);
  const rightEyeRef  = useRef<THREE.Mesh>(null);
  const boostPhaseRef = useRef(0);
  const prevBoostRef  = useRef(false);
  const nextBlinkRef  = useRef(3 + Math.random() * 4);
  const blinkPhaseRef = useRef(-1);

  const color      = getPetColor("alebrije", stage);
  const glowCol    = getPetGlow("alebrije");
  const spineColor = MX_COLORS.oroCempasuchil;
  const wingNubColor = "#E91E63";
  const tier   = getStreakTier(streakDays);
  const config = STREAK_TIER_CONFIG[tier];

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (boostActive && !prevBoostRef.current) boostPhaseRef.current = 1.2;
    prevBoostRef.current = boostActive;
    if (boostPhaseRef.current > 0) boostPhaseRef.current = Math.max(0, boostPhaseRef.current - delta);
    const bf = boostPhaseRef.current > 0 ? Math.sin((1.2 - boostPhaseRef.current) / 1.2 * Math.PI) : 0;

    if (bodyRef.current) {
      const b = 1 + Math.sin(t * 1.8) * 0.03 + bf * 0.15;
      bodyRef.current.scale.set(b, 1 / b, b);
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.1 + Math.sin(t * 1.5) * 0.04 + bf * 0.3;
    }

    const canBlink = mascotaState !== "sad";
    if (canBlink) {
      nextBlinkRef.current -= delta;
      if (nextBlinkRef.current <= 0 && blinkPhaseRef.current < 0) blinkPhaseRef.current = 0;
      if (blinkPhaseRef.current >= 0) {
        blinkPhaseRef.current += delta / 0.15;
        const p  = blinkPhaseRef.current;
        const sY = p < 0.5 ? 1 - 0.95 * (p / 0.5) : 0.05 + 0.95 * ((p - 0.5) / 0.5);
        if (leftEyeRef.current)  leftEyeRef.current.scale.y  = sY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = sY;
        if (p >= 1) {
          blinkPhaseRef.current = -1;
          nextBlinkRef.current = 3 + Math.random() * 4;
          if (leftEyeRef.current)  leftEyeRef.current.scale.y  = 1;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        }
      }
    }

    if (groupRef.current) {
      if (mascotaState === "happy" || mascotaState === "celebrating") {
        groupRef.current.position.y = Math.abs(Math.sin(t * 6)) * 0.18;
        groupRef.current.rotation.z = Math.sin(t * 7) * 0.14;
      } else if (mascotaState === "sad") {
        groupRef.current.position.y = -Math.abs(Math.sin(t * 0.8)) * 0.06;
        groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.06;
      } else {
        groupRef.current.position.y = Math.sin(t * 1.1) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.1;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef} scale={[0.65, 0.65, 0.65]}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshStandardMaterial color={glowCol} transparent opacity={0.1} emissive={glowCol} emissiveIntensity={0.9} depthWrite={false} />
      </mesh>

      {/* Wing nubs — tiny start of wings */}
      <mesh position={[-0.44, 0.1, 0.02]} rotation={[0.2, 0.25, -0.85]} scale={[0.28, 0.045, 0.18]}>
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color={wingNubColor} transparent opacity={0.8} emissive={wingNubColor} emissiveIntensity={0.6} side={2} />
      </mesh>
      <mesh position={[0.44, 0.1, 0.02]} rotation={[0.2, -0.25, 0.85]} scale={[0.28, 0.045, 0.18]}>
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color={wingNubColor} transparent opacity={0.8} emissive={wingNubColor} emissiveIntensity={0.6} side={2} />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.54, 28, 28]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {/* Underbelly highlight */}
      <mesh position={[0, -0.28, 0.1]} scale={[0.7, 0.4, 1.0]}>
        <sphereGeometry args={[0.48, 14, 10]} />
        <meshStandardMaterial color={MX_COLORS.blancoHueso} roughness={0.6} transparent opacity={0.38} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.46, 28, 28]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {/* Snout nub */}
      <mesh position={[0, 0.44, 0.38]} scale={[0.5, 0.4, 0.6]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* Big baby eyes — whites */}
      <mesh position={[-0.19, 0.6, 0.36]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.15} />
      </mesh>
      <mesh position={[0.19, 0.6, 0.36]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.15} />
      </mesh>
      {/* Pupils */}
      <mesh ref={leftEyeRef}  position={[-0.19, 0.62, 0.46]}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.19, 0.62, 0.46]}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Eye shines */}
      <mesh position={[-0.16, 0.66, 0.54]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.22, 0.66, 0.54]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1.2} />
      </mesh>

      {/* Baby horn trio */}
      <mesh position={[0, 1.0, 0]} rotation={[-0.1, 0, 0]}>
        <coneGeometry args={[0.04, 0.24, 6]} />
        <meshStandardMaterial color={spineColor} emissive={spineColor} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[-0.18, 0.94, 0]} rotation={[0.1, 0, -0.4]}>
        <coneGeometry args={[0.028, 0.15, 6]} />
        <meshStandardMaterial color={wingNubColor} emissive={wingNubColor} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.18, 0.94, 0]} rotation={[0.1, 0, 0.4]}>
        <coneGeometry args={[0.028, 0.15, 6]} />
        <meshStandardMaterial color={wingNubColor} emissive={wingNubColor} emissiveIntensity={0.7} />
      </mesh>

      {/* Decorative alebrije gems */}
      <mesh position={[0.28, 0.06, 0.42]}>
        <octahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial color={spineColor} emissive={spineColor} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-0.28, 0.06, 0.42]}>
        <octahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial color={wingNubColor} emissive={wingNubColor} emissiveIntensity={1.2} />
      </mesh>

      {/* Tiny tail nub */}
      <mesh position={[0.06, -0.44, -0.3]} rotation={[0.4, 0, 0.2]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      <StreakFlame config={config} />
      <OrbitingParticles config={config} />
    </group>
  );
}

// ─── Alebrije Adult Form (stage 2-4) — full alebrije with wings & dragon anatomy

function AlebrijeAdultForm({
  stage = 2,
  mascotaState = "idle",
  streakDays = 0,
  boostActive = false,
}: {
  stage: number;
  mascotaState: string;
  streakDays: number;
  boostActive: boolean;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Group>(null);
  const leftEyeRef  = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const tailRef     = useRef<THREE.Group>(null);

  const nextBlinkRef  = useRef(3 + Math.random() * 4);
  const blinkPhaseRef = useRef(-1);
  const boostPhaseRef = useRef(0);
  const prevBoostRef  = useRef(false);

  const tier   = getStreakTier(streakDays);
  const config = STREAK_TIER_CONFIG[tier];

  const bodyColor  = getPetColor("alebrije", stage);
  const glowCol    = getPetGlow("alebrije");  // gold
  const spineColor = MX_COLORS.oroCempasuchil;
  const accentColor = "#FF4081";  // hot pink gems/accents

  const emI       = 0.20 + config.emissiveBoost;
  const roughness = 0.28 - tier * 0.02;
  const metalness = 0.15 + tier * 0.04;

  const stageScale = stage <= 2 ? 0.86 : stage === 3 ? 0.95 : 1.06;

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (boostActive && !prevBoostRef.current) boostPhaseRef.current = 1.4;
    prevBoostRef.current = boostActive;
    if (boostPhaseRef.current > 0) boostPhaseRef.current = Math.max(0, boostPhaseRef.current - delta);
    const boost = boostPhaseRef.current > 0
      ? Math.sin((1.4 - boostPhaseRef.current) / 1.4 * Math.PI) : 0;

    if (bodyRef.current) {
      const bS = config.breathingSpeed;
      const b  = 1 + Math.sin(t * bS) * 0.022;
      const bs = 1 + boost * 0.22;
      bodyRef.current.scale.set(b * bs, (1 / b) * bs, b * bs);
    }

    const canBlink = mascotaState !== "sad" && mascotaState !== "sleeping";
    if (canBlink) {
      nextBlinkRef.current -= delta;
      if (nextBlinkRef.current <= 0 && blinkPhaseRef.current < 0) blinkPhaseRef.current = 0;
      if (blinkPhaseRef.current >= 0) {
        blinkPhaseRef.current += delta / 0.15;
        const p  = blinkPhaseRef.current;
        const sY = p < 0.5 ? 1 - 0.95 * (p / 0.5) : 0.05 + 0.95 * ((p - 0.5) / 0.5);
        if (leftEyeRef.current)  leftEyeRef.current.scale.y  = sY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = sY;
        if (p >= 1) {
          blinkPhaseRef.current = -1;
          nextBlinkRef.current = 3 + Math.random() * 4;
          if (leftEyeRef.current)  leftEyeRef.current.scale.y  = 1;
          if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        }
      }
    }

    if (groupRef.current) {
      const baseY  = config.positionY;
      const bobAmp = config.idleBobAmplitude;
      if (mascotaState === "happy" || mascotaState === "celebrating") {
        groupRef.current.position.y = baseY + Math.abs(Math.sin(t * 4)) * 0.22;
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.12;
      } else if (mascotaState === "sad") {
        groupRef.current.position.y = baseY - Math.abs(Math.sin(t * 0.8)) * 0.08;
        groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.08;
      } else if (mascotaState === "streakRecord") {
        groupRef.current.position.y = baseY + Math.abs(Math.sin(t * 3)) * 0.35;
        groupRef.current.rotation.y = t * 2;
        groupRef.current.rotation.z = Math.sin(t * 6) * 0.15;
      } else {
        groupRef.current.position.y = baseY + Math.sin(t * 0.9) * bobAmp;
        groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.12;
        groupRef.current.rotation.z = 0;
        groupRef.current.scale.set(1, 1, 1);
      }
    }

    if (tailRef.current) {
      const wagAmp   = mascotaState === "happy" || mascotaState === "celebrating" ? 0.22 : 0.06;
      const wagSpeed = mascotaState === "happy" || mascotaState === "celebrating" ? 4.5 : 1.2;
      tailRef.current.rotation.z = Math.sin(t * wagSpeed) * wagAmp;
    }
  });

  const bs = config.bodyScale * stageScale;

  return (
    <group ref={groupRef} scale={[bs, bs, bs]}>
      {/* Glow aura — gold, richer than other pets */}
      <mesh>
        <sphereGeometry args={[1.18 * config.glowScale, 16, 16]} />
        <meshStandardMaterial
          color={glowCol} transparent opacity={config.glowOpacity * 1.2}
          emissive={glowCol} emissiveIntensity={0.9} depthWrite={false}
        />
      </mesh>

      {/* Animated wings — rendered behind body */}
      <AlebrijeWings stage={stage} mascotaState={mascotaState} />

      {/* Body group */}
      <group ref={bodyRef}>

        {/* Torso — lizard-like: low, elongated */}
        <mesh position={[0, -0.08, 0]} scale={[1, 0.68, 1.28]}>
          <sphereGeometry args={[0.56, 28, 22]} />
          <meshStandardMaterial color={bodyColor} roughness={roughness} metalness={metalness} emissive={bodyColor} emissiveIntensity={emI} />
        </mesh>

        {/* Underbelly — cream strip */}
        <mesh position={[0, -0.3, 0.1]} scale={[0.65, 0.32, 1.1]}>
          <sphereGeometry args={[0.52, 16, 12]} />
          <meshStandardMaterial color={MX_COLORS.blancoHueso} roughness={0.5} transparent opacity={0.42} />
        </mesh>

        {/* === Spine crest — 4 dorsal spikes decreasing in size === */}
        {([0, -0.14, -0.27, -0.40] as const).map((zOff, i) => (
          <mesh key={i} position={[0, 0.36 - i * 0.05, zOff]} rotation={[0.5 + i * 0.1, 0, 0]}>
            <coneGeometry args={[0.032 + i * 0.004, 0.20 - i * 0.025, 5]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? spineColor : accentColor}
              emissive={i % 2 === 0 ? spineColor : accentColor}
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}

        {/* Neck */}
        <mesh position={[0, 0.3, 0.32]} rotation={[-0.38, 0, 0]} scale={[1, 1.2, 1]}>
          <cylinderGeometry args={[0.2, 0.26, 0.3, 10]} />
          <meshStandardMaterial color={bodyColor} roughness={roughness} emissive={bodyColor} emissiveIntensity={emI} />
        </mesh>

        {/* HEAD — elongated dragon/lizard snout */}
        <group position={[0, 0.62, 0.38]}>
          {/* Skull */}
          <mesh scale={[1, 0.85, 1.1]}>
            <sphereGeometry args={[0.36, 24, 20]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} metalness={metalness} emissive={bodyColor} emissiveIntensity={emI} />
          </mesh>

          {/* Snout */}
          <mesh position={[0, -0.1, 0.32]} scale={[0.54, 0.42, 0.86]}>
            <sphereGeometry args={[0.26, 16, 12]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} emissive={bodyColor} emissiveIntensity={emI} />
          </mesh>

          {/* Nostrils */}
          <mesh position={[-0.06, -0.08, 0.54]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
          <mesh position={[0.06, -0.08, 0.54]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>

          {/* Eye whites */}
          <mesh position={[-0.16, 0.1, 0.26]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#FAFAFA" roughness={0.15} />
          </mesh>
          <mesh position={[0.16, 0.1, 0.26]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#FAFAFA" roughness={0.15} />
          </mesh>
          {/* Pupils */}
          <mesh ref={leftEyeRef}  position={[-0.16, 0.12, 0.34]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.16, 0.12, 0.34]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Eye shines */}
          <mesh position={[-0.14, 0.16, 0.42]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.18, 0.16, 0.42]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={MX_COLORS.blancoHueso} emissive={MX_COLORS.blancoHueso} emissiveIntensity={1.2} />
          </mesh>

          {/* HEAD HORNS — trio, gold center + pink sides */}
          <mesh position={[0, 0.4, -0.04]} rotation={[-0.15, 0, 0]}>
            <coneGeometry args={[0.065, 0.55, 6]} />
            <meshStandardMaterial color={spineColor} emissive={spineColor} emissiveIntensity={1.0} />
          </mesh>
          <mesh position={[-0.22, 0.3, -0.02]} rotation={[0.1, 0, -0.38]}>
            <coneGeometry args={[0.048, 0.38, 6]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0.22, 0.3, -0.02]} rotation={[0.1, 0, 0.38]}>
            <coneGeometry args={[0.048, 0.38, 6]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
          </mesh>

          {/* Ear frills — flat wing-like flaps on sides of head */}
          <mesh position={[-0.34, 0.12, 0.02]} rotation={[0, 0.2, -0.5]} scale={[0.34, 0.07, 0.2]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={accentColor} transparent opacity={0.72} emissive={accentColor} emissiveIntensity={0.5} side={2} />
          </mesh>
          <mesh position={[0.34, 0.12, 0.02]} rotation={[0, -0.2, 0.5]} scale={[0.34, 0.07, 0.2]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={accentColor} transparent opacity={0.72} emissive={accentColor} emissiveIntensity={0.5} side={2} />
          </mesh>
        </group>

        {/* === DECORATIVE ALEBRIJE GEMS on body === */}
        <mesh position={[0.32, 0.06, 0.42]}>
          <octahedronGeometry args={[0.058, 0]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[-0.32, 0.06, 0.42]}>
          <octahedronGeometry args={[0.058, 0]} />
          <meshStandardMaterial color={spineColor} emissive={spineColor} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0.14, -0.14, 0.52]}>
          <octahedronGeometry args={[0.042, 0]} />
          <meshStandardMaterial color={MX_COLORS.rosaBugambilia} emissive={MX_COLORS.rosaBugambilia} emissiveIntensity={1.0} />
        </mesh>
        <mesh position={[-0.14, -0.14, 0.52]}>
          <octahedronGeometry args={[0.042, 0]} />
          <meshStandardMaterial color={MX_COLORS.amarilloCempasuchil} emissive={MX_COLORS.amarilloCempasuchil} emissiveIntensity={1.0} />
        </mesh>

        {/* === 4 LIZARD LEGS — wide-spread like a lizard === */}
        <group position={[-0.4, -0.38, 0.24]} rotation={[0, 0, 0.62]}>
          <mesh>
            <cylinderGeometry args={[0.054, 0.065, 0.28, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} emissive={bodyColor} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.068, 8, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} />
          </mesh>
        </group>
        <group position={[0.4, -0.38, 0.24]} rotation={[0, 0, -0.62]}>
          <mesh>
            <cylinderGeometry args={[0.054, 0.065, 0.28, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} emissive={bodyColor} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.068, 8, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} />
          </mesh>
        </group>
        <group position={[-0.38, -0.36, -0.28]} rotation={[0, 0, 0.52]}>
          <mesh>
            <cylinderGeometry args={[0.058, 0.07, 0.30, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} emissive={bodyColor} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} />
          </mesh>
        </group>
        <group position={[0.38, -0.36, -0.28]} rotation={[0, 0, -0.52]}>
          <mesh>
            <cylinderGeometry args={[0.058, 0.07, 0.30, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} emissive={bodyColor} emissiveIntensity={emI * 0.5} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} />
          </mesh>
        </group>

        {/* === SEGMENTED TAIL — curves to side with spine tip === */}
        <group ref={tailRef} position={[0.1, 0, -0.52]}>
          <mesh>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} emissive={bodyColor} emissiveIntensity={emI * 0.8} />
          </mesh>
          <mesh position={[0.16, 0.1, -0.14]}>
            <sphereGeometry args={[0.095, 8, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={roughness} />
          </mesh>
          <mesh position={[0.3, 0.22, -0.22]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={accentColor} roughness={roughness} emissive={accentColor} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.42, 0.34, -0.26]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color={spineColor} emissive={spineColor} emissiveIntensity={1.0} />
          </mesh>
          {/* Tail tip spine */}
          <mesh position={[0.48, 0.44, -0.28]} rotation={[-0.5, 0, 0.85]}>
            <coneGeometry args={[0.025, 0.15, 5]} />
            <meshStandardMaterial color={spineColor} emissive={spineColor} emissiveIntensity={1.2} />
          </mesh>
        </group>

        {/* Stage 3+ neck crest fin */}
        {stage >= 3 && (
          <mesh position={[0, 0.36, 0.22]} rotation={[-0.8, 0, 0]} scale={[0.5, 0.04, 0.28]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={accentColor} transparent opacity={0.78} emissive={accentColor} emissiveIntensity={0.7} side={2} />
          </mesh>
        )}

        {/* Stage 4 mítico: golden halo */}
        {stage >= 4 && (
          <mesh position={[0, 1.15, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.32, 0.038, 12, 24]} />
            <meshStandardMaterial
              color={MX_COLORS.oroCempasuchil} emissive={MX_COLORS.oroCempasuchil}
              emissiveIntensity={1.6}
            />
          </mesh>
        )}
      </group>

      <StreakFlame config={config} />
      <OrbitingParticles config={config} />
      <CulturalMarks show={config.culturalDetails} />
    </group>
  );
}

// ─── Public component ───────────────────────────────────────────────────────
interface MascotaEngineProps {
  petType?: string;
  stage?: number;
  mascotaState?: string;
  height?: number;
  streakDays?: number;
  boostActive?: boolean;
  onTap?: () => void;
}

export default function MascotaEngine({
  petType = "ajolote",
  stage = 1,
  mascotaState = "idle",
  height = 240,
  streakDays = 0,
  boostActive = false,
  onTap,
}: MascotaEngineProps) {
  const tier = getStreakTier(streakDays);
  const config = STREAK_TIER_CONFIG[tier];
  const glowCol = getPetGlow(petType);

  const ambientIntensity = 0.55 + tier * 0.05;
  const pointIntensity = 0.6 + tier * 0.15;

  return (
    <View style={{ width: "100%", height }}>
      <Canvas
        camera={{ position: [0, 0.4, 3.2], fov: 55 }}
        style={{ flex: 1 }}
        onTouchEnd={onTap}
      >
        <ambientLight intensity={ambientIntensity} />
        <pointLight position={[2, 3, 2]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-2, 1, -1]} intensity={pointIntensity} color={glowCol} />

        {config.flame.enabled && (
          <pointLight
            position={[0, 2.5, 0]}
            intensity={0.8 * config.flame.scale}
            color={config.flame.color}
            distance={4}
          />
        )}

        {/* Stage 0 = Egg, Stage 1 = Baby, Stage 2+ = Adult */}
        {stage <= 0 ? (
          <EggForm petType={petType} mascotaState={mascotaState} boostActive={boostActive} />
        ) : stage === 1 ? (
          petType === "xolo" ? (
            <XoloBabyForm stage={stage} mascotaState={mascotaState} streakDays={streakDays} boostActive={boostActive} />
          ) : petType === "alebrije" ? (
            <AlebrijevBabyForm stage={stage} mascotaState={mascotaState} streakDays={streakDays} boostActive={boostActive} />
          ) : (
            <BabyForm petType={petType} stage={stage} mascotaState={mascotaState} streakDays={streakDays} boostActive={boostActive} />
          )
        ) : petType === "xolo" ? (
          <XoloAdultForm stage={stage} mascotaState={mascotaState} streakDays={streakDays} boostActive={boostActive} />
        ) : petType === "alebrije" ? (
          <AlebrijeAdultForm stage={stage} mascotaState={mascotaState} streakDays={streakDays} boostActive={boostActive} />
        ) : (
          <AdultForm petType={petType} stage={stage} mascotaState={mascotaState} streakDays={streakDays} boostActive={boostActive} />
        )}
      </Canvas>
    </View>
  );
}
