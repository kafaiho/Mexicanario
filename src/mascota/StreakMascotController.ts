// ─── StreakMascotController ──────────────────────────────────────────────────
// Vanilla Three.js controller for the Xoloitzcuintli GLB model.
// No React dependency — works with any Three.js setup.
//
// Responsibilities:
//   1. Load and own the GLB scene graph
//   2. Drive rig animations via AnimationMixer
//   3. Apply day-based progression (materials, accessories, aura, glow)
//   4. Handle tap reactions
//   5. Tick every frame via update(dt)
//
// Usage:
//   const ctrl = new StreakMascotController();
//   await ctrl.init(renderer, scene);
//   ctrl.applyProgression(day);
//   // in render loop: ctrl.update(deltaTime);
//   // on tap: ctrl.handleTap();

import * as THREE from "three";
import {
  getStreakParams,
  ACCESSORY_MANIFEST,
  HUE_PALETTE,
  type StreakParams,
  type EnergyTier,
} from "./streakParams";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Names the 3D artist must use inside the GLB for each mesh/bone group */
const MESH_NAMES = {
  body: "Body",
  aura: "Aura",
  chestSymbol: "ChestSymbol",
  accessories: {
    Collar: "Acc_Collar",
    Bandana: "Acc_Bandana",
    ChestPlate: "Acc_ChestPlate",
    Crown: "Acc_Crown",
  },
} as const;

/** Morph target indices (set in Blender export order) */
const MORPH = {
  smile: 0,
  eyeSquint: 1,
  earPerk: 2,
  chestPuff: 3,
} as const;

/** Tap reaction — short animation burst */
const TAP_BOUNCE_DURATION = 0.35; // seconds
const TAP_BOUNCE_HEIGHT = 0.15;
const TAP_SQUASH_AMOUNT = 0.12;
const TAP_SPIN_SPEED = 8; // rad/s

/** Aura ring rotation speed */
const AURA_ROTATION_SPEED = 0.4; // rad/s

/** Particle orbit config */
const PARTICLE_ORBIT_RADIUS = 1.0;
const PARTICLE_ORBIT_SPEED = 1.2; // rad/s
const PARTICLE_COUNT = 8;
const PARTICLE_SIZE = 0.035;

// ─── Helper: parse hex to THREE.Color ───────────────────────────────────────

function hexColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

// ─── Aura Ring Builder ──────────────────────────────────────────────────────

function createAuraRing(radius: number, tube: number): THREE.Mesh {
  const geo = new THREE.TorusGeometry(radius, tube, 16, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff6f00,
    emissive: 0xff6f00,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.name = "AuraRing";
  return mesh;
}

// ─── Particle System (lightweight point sprites) ────────────────────────────

function createParticleSystem(): THREE.Points {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffd54f,
    size: PARTICLE_SIZE,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.name = "Particles";
  points.frustumCulled = false;
  return points;
}

// ─── Outline Glow (scaled duplicate with backface) ──────────────────────────

function createOutlineGlow(bodyMesh: THREE.Mesh): THREE.Mesh {
  const geo = bodyMesh.geometry.clone();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff6f00,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const outline = new THREE.Mesh(geo, mat);
  outline.name = "OutlineGlow";
  outline.scale.multiplyScalar(1.05);
  return outline;
}

// ═══════════════════════════════════════════════════════════════════════════
// StreakMascotController
// ═══════════════════════════════════════════════════════════════════════════

export class StreakMascotController {
  // ── Scene references ───────────────────────────────────────────────────
  private root: THREE.Group = new THREE.Group();
  private bodyMesh: THREE.Mesh | null = null;
  private auraMesh: THREE.Mesh | null = null;
  private chestSymbol: THREE.Object3D | null = null;
  private outlineGlow: THREE.Mesh | null = null;
  private accessoryMap: Map<string, THREE.Object3D> = new Map();

  // ── FX layers ──────────────────────────────────────────────────────────
  private auraRings: THREE.Mesh[] = [];
  private particles: THREE.Points | null = null;

  // ── Animation ──────────────────────────────────────────────────────────
  private mixer: THREE.AnimationMixer | null = null;
  private clips: Map<string, THREE.AnimationClip> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private currentClipName: string = "";

  // ── State ──────────────────────────────────────────────────────────────
  private params: StreakParams | null = null;
  private tapTimer: number = 0;
  private isTapping: boolean = false;
  private elapsedTime: number = 0;
  private particleBurstTimer: number = 0;
  private loaded: boolean = false;

  // ── Public getters ─────────────────────────────────────────────────────
  get scene(): THREE.Group {
    return this.root;
  }
  get isLoaded(): boolean {
    return this.loaded;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // INIT — Parse GLB data, extract references, build FX layers
  // ═════════════════════════════════════════════════════════════════════════

  async init(
    parentScene: THREE.Scene | THREE.Group,
    glbData?: ArrayBuffer,
  ): Promise<void> {
    if (glbData) {
      // Lazy-import GLTFLoader only when we actually have data to parse
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader"
      );
      const loader = new GLTFLoader();

      const gltf = await new Promise<any>((resolve, reject) => {
        loader.parse(glbData, "", resolve, reject);
      });

      this.root = gltf.scene;
      this.root.name = "XoloMascot";

      // Register animation clips from GLB
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.root);
        for (const clip of gltf.animations) {
          this.clips.set(clip.name, clip);
        }
      }
    } else {
      // No GLB data — create empty group as placeholder
      this.root = new THREE.Group();
      this.root.name = "XoloMascot_Placeholder";
    }

    parentScene.add(this.root);

    // ── Extract mesh references by name ──────────────────────────────────
    this.root.traverse((child: THREE.Object3D) => {
      if (child.name === MESH_NAMES.body && child instanceof THREE.Mesh) {
        this.bodyMesh = child;
      }
      if (child.name === MESH_NAMES.aura && child instanceof THREE.Mesh) {
        this.auraMesh = child;
      }
      if (child.name === MESH_NAMES.chestSymbol) {
        this.chestSymbol = child;
        child.visible = false;
      }

      // Accessories
      for (const [key, glbName] of Object.entries(MESH_NAMES.accessories)) {
        if (child.name === glbName) {
          this.accessoryMap.set(key, child);
          child.visible = false; // all off by default
        }
      }
    });

    // ── Ensure body material supports emissive ───────────────────────────
    if (this.bodyMesh) {
      const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
      mat.emissive = hexColor("#000000");
      mat.emissiveIntensity = 0;

      // Build outline glow from body geometry
      this.outlineGlow = createOutlineGlow(this.bodyMesh);
      this.bodyMesh.parent?.add(this.outlineGlow);
    }

    // ── Build aura rings (2 concentric, like reference images) ───────────
    const ring1 = createAuraRing(0.9, 0.025);
    const ring2 = createAuraRing(1.2, 0.018);
    ring2.rotation.x = Math.PI / 2 + 0.3; // slight tilt for depth
    this.auraRings = [ring1, ring2];
    this.auraRings.forEach((r) => this.root.add(r));

    // ── Build particle system ────────────────────────────────────────────
    this.particles = createParticleSystem();
    this.root.add(this.particles);

    // ── Initial hidden aura (if present in GLB) ─────────────────────────
    if (this.auraMesh) {
      const mat = this.auraMesh.material as THREE.MeshStandardMaterial;
      mat.transparent = true;
      mat.opacity = 0;
      mat.depthWrite = false;
    }

    this.loaded = true;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // APPLY PROGRESSION — The core method. Call when day changes.
  // ═════════════════════════════════════════════════════════════════════════

  applyProgression(day: number): void {
    const params = getStreakParams(day);
    this.params = params;

    this.applyMaterials(params);
    this.applyAccessories(params);
    this.applyAura(params);
    this.applyMorphTargets(params);
    this.applyOutlineGlow(params);
    this.applyChestSymbol(params);
    this.applyAnimation(params);
    this.applyScale(params);
    this.applyParticles(params);
  }

  // ── Sub-methods ────────────────────────────────────────────────────────

  private applyMaterials(p: StreakParams): void {
    if (!this.bodyMesh) return;
    const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;

    // Hue shift — tint the base color
    const tintColor = hexColor(HUE_PALETTE[p.hueShift] ?? HUE_PALETTE[0]);
    mat.color.copy(tintColor);

    // Emissive glow — ramps with progress
    mat.emissive.copy(tintColor);
    mat.emissiveIntensity = p.emissiveStrength;

    // Surface quality evolves: less rough, more metallic at higher tiers
    mat.roughness = THREE.MathUtils.lerp(0.7, 0.25, p.progress);
    mat.metalness = THREE.MathUtils.lerp(0.0, 0.35, p.progress);

    // Eternal Form: full golden override
    if (p.isEternalForm) {
      mat.color.set(0xffd54f);
      mat.emissive.set(0xffd54f);
      mat.emissiveIntensity = 1.5;
      mat.metalness = 0.6;
      mat.roughness = 0.15;
    }
  }

  private applyAccessories(p: StreakParams): void {
    const unlocked = ACCESSORY_MANIFEST[p.accessoryLevel] ?? [];
    for (const [name, obj] of this.accessoryMap) {
      obj.visible = unlocked.includes(name);
    }
  }

  private applyAura(p: StreakParams): void {
    // GLB-embedded aura mesh
    if (this.auraMesh) {
      const mat = this.auraMesh.material as THREE.MeshStandardMaterial;
      mat.opacity = p.auraOpacity;
      mat.emissiveIntensity = p.auraIntensity * 0.4;
    }

    // Procedural aura rings — visible from auraIntensity >= 2
    for (let i = 0; i < this.auraRings.length; i++) {
      const ring = this.auraRings[i];
      const mat = ring.material as THREE.MeshStandardMaterial;
      const ringThreshold = i === 0 ? 2 : 3;

      if (p.auraIntensity >= ringThreshold) {
        mat.opacity = 0.15 + (p.auraIntensity - ringThreshold) * 0.12;
        mat.emissiveIntensity = 0.8 + p.auraIntensity * 0.3;

        if (p.isEternalForm) {
          mat.color.set(0xffd54f);
          mat.emissive.set(0xffd54f);
          mat.opacity = 0.6;
          mat.emissiveIntensity = 2.5;
        }
      } else {
        mat.opacity = 0;
      }
    }
  }

  private applyMorphTargets(p: StreakParams): void {
    if (!this.bodyMesh || !this.bodyMesh.morphTargetInfluences) return;

    const morph = this.bodyMesh.morphTargetInfluences;

    // Smile increases with confidence
    morph[MORPH.smile] = Math.min(1, p.poseConfidence * 0.2);

    // Ear perk at Medium+
    morph[MORPH.earPerk] = p.poseConfidence >= 2 ? 0.6 + p.progress * 0.4 : 0;

    // Chest puff at High+
    morph[MORPH.chestPuff] = p.poseConfidence >= 3 ? 0.4 + p.progress * 0.6 : 0;

    // Eye squint for Legendary (confident look)
    morph[MORPH.eyeSquint] = p.energyTier === "Legendary" ? 0.5 : 0;
  }

  private applyOutlineGlow(p: StreakParams): void {
    if (!this.outlineGlow) return;
    const mat = this.outlineGlow.material as THREE.MeshBasicMaterial;

    if (p.showOutlineGlow || p.isEternalForm) {
      mat.opacity = p.isEternalForm ? 0.5 : 0.3;
      mat.color.set(p.isEternalForm ? 0xffd54f : 0xff6f00);
    } else {
      mat.opacity = 0;
    }
  }

  private applyChestSymbol(p: StreakParams): void {
    if (!this.chestSymbol) return;
    this.chestSymbol.visible = p.showChestSymbol || p.isEternalForm;
  }

  private applyAnimation(p: StreakParams): void {
    if (!this.mixer) return;

    const targetClip = p.animationName;
    if (targetClip === this.currentClipName) return;

    const clip = this.clips.get(targetClip);
    if (!clip) return;

    const newAction = this.mixer.clipAction(clip);

    if (this.currentAction) {
      // Crossfade over 0.4s for smooth transition
      this.currentAction.fadeOut(0.4);
      newAction.reset().fadeIn(0.4).play();
    } else {
      newAction.play();
    }

    this.currentAction = newAction;
    this.currentClipName = targetClip;
  }

  private applyScale(p: StreakParams): void {
    const s = p.bodyScale;
    this.root.scale.set(s, s, s);
  }

  private applyParticles(p: StreakParams): void {
    if (!this.particles) return;
    const mat = this.particles.material as THREE.PointsMaterial;

    if (p.showParticles || p.isEternalForm) {
      mat.opacity = 0.8;
      this.particleBurstTimer = 3.0; // 3s burst
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLE TAP — Reaction to user touch
  // ═════════════════════════════════════════════════════════════════════════

  handleTap(): void {
    if (this.isTapping) return; // don't stack taps

    this.isTapping = true;
    this.tapTimer = TAP_BOUNCE_DURATION;

    // Trigger a short morph target burst (big smile + eye squint)
    if (this.bodyMesh?.morphTargetInfluences) {
      this.bodyMesh.morphTargetInfluences[MORPH.smile] = 1.0;
      this.bodyMesh.morphTargetInfluences[MORPH.eyeSquint] = 0.7;
    }

    // Flash emissive
    if (this.bodyMesh) {
      const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = Math.min(2.0, mat.emissiveIntensity + 0.6);
    }

    // Particle burst on tap
    if (this.particles) {
      (this.particles.material as THREE.PointsMaterial).opacity = 1.0;
      this.particleBurstTimer = Math.max(this.particleBurstTimer, 1.0);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // UPDATE — Call every frame with delta time
  // ═════════════════════════════════════════════════════════════════════════

  update(deltaTime: number): void {
    if (!this.loaded) return;

    this.elapsedTime += deltaTime;
    const t = this.elapsedTime;

    // ── Animation mixer tick ─────────────────────────────────────────────
    this.mixer?.update(deltaTime);

    // ── Tap bounce animation ─────────────────────────────────────────────
    if (this.isTapping) {
      this.tapTimer -= deltaTime;
      const tapProgress = 1 - this.tapTimer / TAP_BOUNCE_DURATION;

      if (tapProgress <= 1) {
        // Squash & stretch
        const squash = Math.sin(tapProgress * Math.PI);
        const scaleY = 1 + squash * TAP_SQUASH_AMOUNT;
        const scaleXZ = 1 - squash * TAP_SQUASH_AMOUNT * 0.5;

        const baseScale = this.params?.bodyScale ?? 1;
        this.root.scale.set(
          baseScale * scaleXZ,
          baseScale * scaleY,
          baseScale * scaleXZ,
        );

        // Vertical bounce
        this.root.position.y = squash * TAP_BOUNCE_HEIGHT;

        // Quick spin
        this.root.rotation.y += TAP_SPIN_SPEED * deltaTime * (1 - tapProgress);
      }

      if (this.tapTimer <= 0) {
        this.isTapping = false;
        const s = this.params?.bodyScale ?? 1;
        this.root.scale.set(s, s, s);
        this.root.position.y = 0;

        // Restore morph targets to progression values
        if (this.params) {
          this.applyMorphTargets(this.params);
        }
      }
    }

    // ── Idle breathing (subtle scale oscillation) ────────────────────────
    if (!this.isTapping) {
      const breathSpeed = this.getBreathSpeed();
      const breathAmp = 0.015;
      const breath = Math.sin(t * breathSpeed) * breathAmp;
      const s = this.params?.bodyScale ?? 1;
      this.root.scale.set(s + breath, s - breath * 0.5, s + breath);
    }

    // ── Aura ring rotation ───────────────────────────────────────────────
    for (let i = 0; i < this.auraRings.length; i++) {
      const ring = this.auraRings[i];
      const direction = i % 2 === 0 ? 1 : -1;
      ring.rotation.z += AURA_ROTATION_SPEED * direction * deltaTime;

      // Pulsing opacity
      const mat = ring.material as THREE.MeshStandardMaterial;
      if (mat.opacity > 0) {
        const pulse = Math.sin(t * 2 + i) * 0.05;
        mat.opacity = Math.max(0, mat.opacity + pulse * deltaTime);
      }
    }

    // ── Particle orbit ───────────────────────────────────────────────────
    this.updateParticles(deltaTime, t);

    // ── Emissive pulse (breathing glow) ──────────────────────────────────
    if (this.bodyMesh && !this.isTapping) {
      const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
      const baseEmissive = this.params?.emissiveStrength ?? 0;
      const glowPulse = Math.sin(t * 1.5) * 0.08;
      mat.emissiveIntensity = baseEmissive + glowPulse;
    }

    // ── Aura mesh pulse (if in GLB) ──────────────────────────────────────
    if (this.auraMesh) {
      const mat = this.auraMesh.material as THREE.MeshStandardMaterial;
      const baseOpacity = this.params?.auraOpacity ?? 0;
      mat.opacity = baseOpacity + Math.sin(t * 1.2) * 0.03;
    }
  }

  // ── Private: particle tick ─────────────────────────────────────────────

  private updateParticles(dt: number, t: number): void {
    if (!this.particles) return;

    const mat = this.particles.material as THREE.PointsMaterial;

    // Fade out burst timer
    if (this.particleBurstTimer > 0) {
      this.particleBurstTimer -= dt;
      if (this.particleBurstTimer <= 0) {
        // Only keep particles visible if progression says so
        mat.opacity = this.params?.showParticles || this.params?.isEternalForm
          ? 0.6
          : 0;
      }
    }

    if (mat.opacity <= 0) return;

    // Update positions: orbit around the mascot
    const posAttr = this.particles.geometry.getAttribute("position");
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + t * PARTICLE_ORBIT_SPEED;
      const yOffset = Math.sin(t * 3 + i * 0.7) * 0.2;
      positions[i * 3] = Math.cos(angle) * PARTICLE_ORBIT_RADIUS;
      positions[i * 3 + 1] = 0.5 + yOffset;
      positions[i * 3 + 2] = Math.sin(angle) * PARTICLE_ORBIT_RADIUS;
    }

    posAttr.needsUpdate = true;
  }

  // ── Private: breath speed by tier ──────────────────────────────────────

  private getBreathSpeed(): number {
    const tier = this.params?.energyTier ?? "Low";
    const speeds: Record<EnergyTier, number> = {
      Low: 1.2,
      Medium: 1.6,
      High: 2.0,
      Rare: 2.4,
      Legendary: 2.8,
    };
    return speeds[tier];
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═════════════════════════════════════════════════════════════════════════

  dispose(): void {
    // Stop all animations
    this.mixer?.stopAllAction();
    this.mixer = null;

    // Dispose geometries and materials
    this.root.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });

    // Remove from parent
    this.root.parent?.remove(this.root);
    this.loaded = false;
  }
}
