// ─── Streak Progression Parameters ──────────────────────────────────────────
// Pure math module. Zero dependencies. Maps day (1–364) to visual parameters.
// Single source of truth for the entire mascot progression system.

// ── Types ───────────────────────────────────────────────────────────────────

export type EnergyTier = "Low" | "Medium" | "High" | "Rare" | "Legendary";

export interface StreakParams {
  /** Raw day 1–364 */
  day: number;
  /** Normalized progress 0→1 */
  progress: number;
  /** Energy classification */
  energyTier: EnergyTier;
  /** Aura ring intensity 0–5 */
  auraIntensity: number;
  /** Pose confidence level 0–5 (maps to animation blend) */
  poseConfidence: number;
  /** Accessory unlock level 0–4 */
  accessoryLevel: number;
  /** Material hue shift step 0–8 */
  hueShift: number;
  /** Name of the animation clip to play */
  animationName: string;
  /** Whether to show particle burst */
  showParticles: boolean;
  /** Whether to show outline glow (rim light) */
  showOutlineGlow: boolean;
  /** Whether to show chest symbol */
  showChestSymbol: boolean;
  /** Whether this is the final Eternal Form */
  isEternalForm: boolean;
  /** Emissive glow multiplier 0→1 */
  emissiveStrength: number;
  /** Aura mesh opacity 0→1 */
  auraOpacity: number;
  /** Body scale multiplier */
  bodyScale: number;
}

// ── Tier Lookup ─────────────────────────────────────────────────────────────

function getEnergyTier(d: number): EnergyTier {
  if (d <= 60) return "Low";
  if (d <= 150) return "Medium";
  if (d <= 260) return "High";
  if (d <= 330) return "Rare";
  return "Legendary";
}

// ── Animation Mapping ───────────────────────────────────────────────────────

const TIER_ANIMATIONS: Record<EnergyTier, string> = {
  Low: "Idle",
  Medium: "IdleTailWag",
  High: "HappyBounce",
  Rare: "PowerCharge",
  Legendary: "LegendaryIdle",
};

// ── Main Function ───────────────────────────────────────────────────────────

export function getStreakParams(d: number): StreakParams {
  // Clamp to valid range
  const day = Math.max(1, Math.min(364, Math.round(d)));
  const p = day / 364;

  const energyTier = getEnergyTier(day);

  return {
    day,
    progress: p,
    energyTier,

    // Floor-stepped parameters (discrete levels, not smooth)
    auraIntensity: Math.floor(p * 5),       // 0,1,2,3,4,5
    poseConfidence: Math.floor(p * 5),      // 0,1,2,3,4,5
    accessoryLevel: Math.floor(p * 4),      // 0,1,2,3,4
    hueShift: Math.floor(p * 8),            // 0,1,2,...,8

    // Animation clip name
    animationName: TIER_ANIMATIONS[energyTier],

    // Special-day rules
    showParticles: day % 45 === 0,
    showOutlineGlow: day % 90 === 0,
    showChestSymbol: day % 120 === 0,
    isEternalForm: day === 364,

    // Derived continuous values for shaders/materials
    emissiveStrength: Math.min(1.0, p * 1.2),
    auraOpacity: 0.05 + p * 0.55,           // 0.05 → 0.60
    bodyScale: 0.85 + p * 0.20,             // 0.85 → 1.05
  };
}

// ── Accessory Definitions ───────────────────────────────────────────────────
// Maps accessoryLevel → which accessories are unlocked.
// The controller uses this to toggle visibility on the GLB's child meshes.

export const ACCESSORY_MANIFEST: Record<number, string[]> = {
  0: [],                                     // No accessories
  1: ["Collar"],                             // Simple collar
  2: ["Collar", "Bandana"],                  // + bandana (like reference img)
  3: ["Collar", "Bandana", "ChestPlate"],    // + chest armor plate
  4: ["Collar", "Bandana", "ChestPlate", "Crown"],  // Full regalia
};

// ── Hue Shift Palette ───────────────────────────────────────────────────────
// 9 steps (0–8) mapping hueShift → body color tint.
// Base is dark gray-brown xolo skin; progresses toward warm golden/amber.

export const HUE_PALETTE = [
  "#3E2723", // 0 — Dark chocolate (base xolo skin)
  "#4E342E", // 1 — Warm brown
  "#5D4037", // 2 — Medium brown
  "#6D4C41", // 3 — Lighter brown
  "#795548", // 4 — Warm taupe
  "#8D6E63", // 5 — Warm amber
  "#A1887F", // 6 — Sandy gold
  "#BCAAA4", // 7 — Pale gold
  "#D7CCC8", // 8 — Luminous bone (Eternal proximity)
] as const;
