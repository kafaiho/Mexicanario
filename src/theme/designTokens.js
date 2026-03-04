import { Easing } from 'react-native-reanimated';

export const COLORS = {
  // Identidad mexicana
  rosaMexicano: '#E4007C',
  turquesa: '#00B2A9',
  cempasuchil: '#FFB800',
  copal: '#FF6B35',
  // Dark mode
  bgDark: '#0A0A12',
  cardDark: '#13131F',
  // Texto
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8C0',
};

export const STAGE_THEMES = [
  null, // índice 0 vacío
  { name: 'Huevo Místico',    primary: '#4A90D9', accent: '#7B2D8B', glow: '#4A90D940' }, // Stage 1
  { name: 'Eclosionando',     primary: '#00C896', accent: '#FFB800', glow: '#00C89640' }, // Stage 2
  { name: 'Cachorro',         primary: '#FF6B35', accent: '#E4007C', glow: '#FF6B3540' }, // Stage 3
  { name: 'Juvenil',          primary: '#00B2A9', accent: '#FFB800', glow: '#00B2A940' }, // Stage 4
  { name: 'Adulto con Alas',  primary: '#E4007C', accent: '#00B2A9', glow: '#E4007C40' }, // Stage 5
  { name: 'Mítico',           primary: '#FFB800', accent: '#E4007C', glow: '#FFB80060' }, // Stage 6
];

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const RADIUS = { sm: 8, md: 16, lg: 24, pill: 999 };
export const FONTS = { display: 'Fredoka-Bold', body: 'Nunito-Regular', bodyBold: 'Nunito-Bold' };

// Umbrales vínculo → etapa (índice 0-based, stage = index + 1)
export const STAGE_THRESHOLDS = [0, 100, 300, 800, 1600, 3000]; // índice i → stage i+1
export const VINCULO_MAX = 4000;
