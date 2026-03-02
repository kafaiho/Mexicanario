// ─── StreakMascotView ────────────────────────────────────────────────────────
// React Three Fiber bridge for StreakMascotController.
// Tries to load the GLB model; falls back to MascotaEngine (procedural) if
// the model is not yet available.

import React, { useRef, useEffect, useCallback, useState } from "react";
import { View } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { StreakMascotController } from "./StreakMascotController";
import { getStreakParams } from "./streakParams";
import MascotaEngine from "./MascotaEngine";

// ─── GLB configuration ──────────────────────────────────────────────────────
// Set to a URL string when the 3D model is ready.
// null = no model yet → renders procedural fallback.
const XOLO_GLB_URL: string | null = null;
// Future example:
// const XOLO_GLB_URL = "https://assets.mexicanario.com/models/xolo.glb";

// ─── Inner Scene (runs inside Canvas) ───────────────────────────────────────

function InnerScene({
  streakDay,
  glbData,
  controllerRef,
}: {
  streakDay: number;
  glbData: ArrayBuffer;
  controllerRef: React.MutableRefObject<StreakMascotController | null>;
}) {
  const { scene } = useThree();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const ctrl = new StreakMascotController();
    controllerRef.current = ctrl;

    ctrl.init(scene, glbData).then(() => {
      ctrl.applyProgression(streakDay);
    });

    return () => {
      ctrl.dispose();
      controllerRef.current = null;
    };
  }, [scene, glbData]);

  useEffect(() => {
    controllerRef.current?.applyProgression(streakDay);
  }, [streakDay]);

  useFrame((_, delta) => {
    controllerRef.current?.update(delta);
  });

  return null;
}

// ─── Lighting ───────────────────────────────────────────────────────────────

function Lights({ streakDay }: { streakDay: number }) {
  const params = getStreakParams(streakDay);
  const ambientIntensity = 0.5 + params.progress * 0.3;
  const auraColor = params.isEternalForm ? "#FFD54F" : "#FF6F00";

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[3, 4, 2]}
        intensity={1.2}
        color="#ffffff"
        castShadow={false}
      />
      <pointLight
        position={[-2, 1, -1]}
        intensity={0.4 + params.auraIntensity * 0.15}
        color={auraColor}
        distance={6}
      />
      {params.auraIntensity >= 3 && (
        <pointLight
          position={[0, 2.5, 0]}
          intensity={0.6}
          color={auraColor}
          distance={4}
        />
      )}
    </>
  );
}

// ─── Fallback: procedural MascotaEngine for xolo ────────────────────────────

function ProceduralFallback({
  streakDay,
  height,
  onTap,
}: {
  streakDay: number;
  height: number;
  onTap?: () => void;
}) {
  // Map streakDay to approximate stage (1–4) for the procedural renderer
  const stage = Math.min(4, Math.max(1, Math.ceil(streakDay / 90)));

  return (
    <MascotaEngine
      petType="xolo"
      stage={stage}
      mascotaState="idle"
      height={height}
      streakDays={streakDay}
      boostActive={false}
      onTap={onTap}
    />
  );
}

// ─── Public Component ───────────────────────────────────────────────────────

interface StreakMascotViewProps {
  streakDay: number;
  height?: number;
  onTap?: () => void;
}

export default function StreakMascotView({
  streakDay,
  height = 280,
  onTap,
}: StreakMascotViewProps) {
  const controllerRef = useRef<StreakMascotController | null>(null);
  const [glbData, setGlbData] = useState<ArrayBuffer | null>(null);
  const [useFallback, setUseFallback] = useState(!XOLO_GLB_URL);

  // Attempt to fetch GLB when URL is configured
  useEffect(() => {
    if (!XOLO_GLB_URL) {
      setUseFallback(true);
      return;
    }

    fetch(XOLO_GLB_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => setGlbData(buf))
      .catch(() => setUseFallback(true));
  }, []);

  // Fallback: render procedural MascotaEngine
  if (useFallback || !glbData) {
    return <ProceduralFallback streakDay={streakDay} height={height} onTap={onTap} />;
  }

  // GLB loaded: render the real 3D model
  const handleTouchEnd = useCallback(() => {
    controllerRef.current?.handleTap();
    onTap?.();
  }, [onTap]);

  return (
    <View style={{ width: "100%", height }}>
      <Canvas
        camera={{ position: [0, 0.5, 3.0], fov: 50 }}
        style={{ flex: 1 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 1.5]}
        onTouchEnd={handleTouchEnd}
      >
        <Lights streakDay={streakDay} />
        <InnerScene
          streakDay={streakDay}
          glbData={glbData}
          controllerRef={controllerRef}
        />
      </Canvas>
    </View>
  );
}
