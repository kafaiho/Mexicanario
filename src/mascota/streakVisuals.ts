// ─── Streak-Driven Visual Config ───────────────────────────────────────────
// Pure data module — no React imports. Centralizes all streak→visual mappings.

// ── Mexican Color Palette ──────────────────────────────────────────────────
export const MX_COLORS = {
  verdeNopal:         "#1B5E20",
  rosaBugambilia:     "#C2185B",
  amarilloCempasuchil:"#F9A825",
  azulTalavera:       "#1565C0",
  rojoChileSeco:      "#BF360C",
  blancoHueso:        "#FFF8E1",
  negroObsidiana:     "#1A1A2E",
  oroCempasuchil:     "#FFD54F",
  naranjaFuego:       "#FF6F00",
} as const;

// ── Per-Pet Colors (replaces old COLORS/GLOW_COLOR) ────────────────────────
export const PET_COLORS: Record<string, {
  base: [string, string, string, string];
  glow: string;
  accent: string;
}> = {
  ajolote: {
    base: ["#C2185B", "#D81B60", "#E91E63", "#F06292"],
    glow:   "#F48FB1",
    accent: "#FCE4EC",
  },
  xolo: {
    base: ["#BF360C", "#D84315", "#E64A19", "#FF5722"],
    glow:   "#FF8A65",
    accent: "#FBE9E7",
  },
  alebrije: {
    // Stage progression: vivid teal → deep violet → jade green → midnight indigo
    base: ["#00ACC1", "#6A1B9A", "#2E7D32", "#1A237E"],
    glow:   "#FFD700",   // gold glow — iconic alebrije feature
    accent: "#FF4081",   // hot pink wings
  },
};

// ── Tier helpers ───────────────────────────────────────────────────────────
export type StreakTier = 0 | 1 | 2 | 3 | 4;

export function getStreakTier(days: number): StreakTier {
  if (days >= 30) return 4;
  if (days >= 15) return 3;
  if (days >= 7)  return 2;
  if (days >= 3)  return 1;
  return 0;
}

// ── 3D Tier Config ─────────────────────────────────────────────────────────
export interface TierConfig {
  emissiveBoost: number;
  glowOpacity:   number;
  glowScale:     number;
  bodyScale:     number;
  positionY:     number;
  flame: {
    enabled: boolean;
    scale:   number;
    color:   string;
    emissive: number;
  };
  particles: {
    enabled: boolean;
    count:   number;
    color:   string;
  };
  culturalDetails: boolean;
  breathingSpeed:  number;
  idleBobAmplitude: number;
}

export const STREAK_TIER_CONFIG: Record<StreakTier, TierConfig> = {
  0: {
    emissiveBoost:    0.00,
    glowOpacity:      0.08,
    glowScale:        0.95,
    bodyScale:        0.82,
    positionY:       -0.06,
    flame:   { enabled: false, scale: 0,   color: MX_COLORS.amarilloCempasuchil, emissive: 0 },
    particles:{ enabled: false, count: 0,   color: MX_COLORS.oroCempasuchil },
    culturalDetails:  false,
    breathingSpeed:   1.2,
    idleBobAmplitude: 0.04,
  },
  1: {
    emissiveBoost:    0.12,
    glowOpacity:      0.14,
    glowScale:        1.0,
    bodyScale:        0.88,
    positionY:        0.0,
    flame:   { enabled: false, scale: 0,   color: MX_COLORS.amarilloCempasuchil, emissive: 0 },
    particles:{ enabled: false, count: 0,   color: MX_COLORS.oroCempasuchil },
    culturalDetails:  false,
    breathingSpeed:   1.6,
    idleBobAmplitude: 0.06,
  },
  2: {
    emissiveBoost:    0.22,
    glowOpacity:      0.18,
    glowScale:        1.05,
    bodyScale:        0.92,
    positionY:        0.0,
    flame:   { enabled: true, scale: 0.7,  color: MX_COLORS.amarilloCempasuchil, emissive: 1.2 },
    particles:{ enabled: false, count: 0,   color: MX_COLORS.oroCempasuchil },
    culturalDetails:  false,
    breathingSpeed:   1.8,
    idleBobAmplitude: 0.07,
  },
  3: {
    emissiveBoost:    0.32,
    glowOpacity:      0.24,
    glowScale:        1.1,
    bodyScale:        0.96,
    positionY:        0.0,
    flame:   { enabled: true, scale: 0.9,  color: MX_COLORS.naranjaFuego, emissive: 1.5 },
    particles:{ enabled: true, count: 4,    color: MX_COLORS.oroCempasuchil },
    culturalDetails:  true,
    breathingSpeed:   2.0,
    idleBobAmplitude: 0.08,
  },
  4: {
    emissiveBoost:    0.45,
    glowOpacity:      0.32,
    glowScale:        1.2,
    bodyScale:        1.02,
    positionY:        0.02,
    flame:   { enabled: true, scale: 1.2,  color: MX_COLORS.rojoChileSeco, emissive: 2.0 },
    particles:{ enabled: true, count: 8,    color: MX_COLORS.oroCempasuchil },
    culturalDetails:  true,
    breathingSpeed:   2.2,
    idleBobAmplitude: 0.10,
  },
};

// ── 2D MiniMascot Tier Visuals ─────────────────────────────────────────────
export interface MiniTierVisual {
  glowColor:    string;
  glowRadius:   number;
  glowOpacity:  number;
  showFlameEmoji: boolean;
  borderColor:  string;
  borderWidth:  number;
  pulsate:      boolean;
  particleDots: boolean;
}

export const MINI_STREAK_VISUALS: Record<StreakTier, MiniTierVisual> = {
  0: {
    glowColor:   "transparent",
    glowRadius:  0,
    glowOpacity: 0,
    showFlameEmoji: false,
    borderColor: "transparent",
    borderWidth: 0,
    pulsate:     false,
    particleDots: false,
  },
  1: {
    glowColor:   MX_COLORS.amarilloCempasuchil,
    glowRadius:  6,
    glowOpacity: 0.35,
    showFlameEmoji: false,
    borderColor: MX_COLORS.amarilloCempasuchil,
    borderWidth: 1.5,
    pulsate:     false,
    particleDots: false,
  },
  2: {
    glowColor:   MX_COLORS.naranjaFuego,
    glowRadius:  10,
    glowOpacity: 0.5,
    showFlameEmoji: true,
    borderColor: MX_COLORS.naranjaFuego,
    borderWidth: 2,
    pulsate:     true,
    particleDots: false,
  },
  3: {
    glowColor:   MX_COLORS.naranjaFuego,
    glowRadius:  14,
    glowOpacity: 0.6,
    showFlameEmoji: true,
    borderColor: MX_COLORS.rosaBugambilia,
    borderWidth: 2.5,
    pulsate:     true,
    particleDots: true,
  },
  4: {
    glowColor:   MX_COLORS.oroCempasuchil,
    glowRadius:  18,
    glowOpacity: 0.7,
    showFlameEmoji: true,
    borderColor: MX_COLORS.oroCempasuchil,
    borderWidth: 3,
    pulsate:     true,
    particleDots: true,
  },
};
