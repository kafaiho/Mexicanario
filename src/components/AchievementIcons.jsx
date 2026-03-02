import React from "react";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
} from "react-native-svg";

// ── PALETA POR CATEGORÍA ──────────────────────────────────────
const COLORS = {
  primeros: { pri: "#F59B40", sec: "#FCD11D", acc: "#523600" },
  racha: { pri: "#E85D3A", sec: "#FCD11D", acc: "#F59B40" },
  colecciones: { pri: "#2A81BA", sec: "#FCD11D", acc: "#1A5A82" },
  experto: { pri: "#FCD11D", sec: "#F59B40", acc: "#523600" },
  categoria: { pri: "#D4543B", sec: "#F59B40", acc: "#FCD11D" },
  social: { pri: "#2A81BA", sec: "#F59B40", acc: "#FCD11D" },
};

// ── 1. PRIMER TACO ────────────────────────────────────────────
// Taco estilizado con tortilla dorada, relleno naranja, gajo de limón
function PrimerTacoIcon({ size = 40 }) {
  const s = size / 64;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <G transform={`scale(${1})`}>
        {/* Sombra */}
        <Ellipse cx="32" cy="58" rx="18" ry="3" fill="rgba(82,54,0,0.15)" />
        {/* Tortilla */}
        <Path
          d="M8 38 C8 22 20 12 32 12 C44 12 56 22 56 38"
          fill={COLORS.primeros.pri}
          stroke={COLORS.primeros.acc}
          strokeWidth="1.5"
        />
        {/* Tortilla borde inferior */}
        <Path
          d="M8 38 Q32 48 56 38"
          fill={COLORS.primeros.sec}
          stroke={COLORS.primeros.acc}
          strokeWidth="1"
        />
        {/* Relleno - carne */}
        <Path
          d="M14 36 C18 28 26 22 32 22 C38 22 46 28 50 36"
          fill="#E85D3A"
        />
        {/* Relleno - lechuga */}
        <Path
          d="M16 34 C20 30 26 26 32 26 C38 26 44 30 48 34"
          fill="#4CAF50"
          opacity="0.7"
        />
        {/* Gajo de limón */}
        <Circle cx="48" cy="44" r="6" fill="#7CB342" />
        <Path
          d="M48 39 L50 44 L48 44 Z"
          fill="#C5E1A5"
        />
        <Path
          d="M48 39 L46 44 L48 44 Z"
          fill="#AED581"
        />
      </G>
    </Svg>
  );
}

// ── 2. DIEZ PALABRAS ──────────────────────────────────────────
// Chile serrano con líneas de calor
function DiezPalabrasIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="58" rx="12" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Tallo */}
      <Path
        d="M30 8 C30 8 28 4 32 4 C36 4 34 8 34 8 L34 16 L30 16 Z"
        fill="#4CAF50"
      />
      {/* Chile cuerpo */}
      <Path
        d="M24 16 C24 16 22 20 22 30 C22 42 28 52 32 54 C36 52 42 42 42 30 C42 20 40 16 40 16 Z"
        fill="#D4543B"
        stroke={COLORS.primeros.acc}
        strokeWidth="1"
      />
      {/* Brillo */}
      <Path
        d="M28 20 C28 20 26 26 26 34 C26 40 28 46 30 48"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Líneas de calor */}
      <Path d="M14 14 C16 10 14 6 16 2" fill="none" stroke={COLORS.primeros.sec} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M10 20 C12 16 10 12 12 8" fill="none" stroke={COLORS.primeros.sec} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M50 14 C48 10 50 6 48 2" fill="none" stroke={COLORS.primeros.sec} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M54 20 C52 16 54 12 52 8" fill="none" stroke={COLORS.primeros.sec} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ── 3. CINCUENTA PALABRAS ─────────────────────────────────────
// Ángel de la Independencia con corazón
function CincuentaPalabrasIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Base */}
      <Rect x="24" y="50" width="16" height="8" rx="2" fill={COLORS.primeros.acc} />
      {/* Columna */}
      <Rect x="29" y="22" width="6" height="28" fill={COLORS.primeros.pri} />
      {/* Capitel */}
      <Rect x="26" y="20" width="12" height="4" rx="1" fill={COLORS.primeros.sec} />
      {/* Ángel/Victoria - figura simplificada */}
      <Circle cx="32" cy="14" r="4" fill={COLORS.primeros.sec} />
      {/* Alas */}
      <Path
        d="M28 14 C24 10 18 10 16 14 C18 12 22 12 28 16 Z"
        fill={COLORS.primeros.sec}
      />
      <Path
        d="M36 14 C40 10 46 10 48 14 C46 12 42 12 36 16 Z"
        fill={COLORS.primeros.sec}
      />
      {/* Corona/laurel en cabeza */}
      <Path
        d="M29 11 C30 9 34 9 35 11"
        fill="none"
        stroke={COLORS.primeros.pri}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Corazón */}
      <Path
        d="M30 36 C30 34 27 32 27 34 C27 37 30 40 32 42 C34 40 37 37 37 34 C37 32 34 34 34 36 L32 39 Z"
        fill="#E85D3A"
      />
    </Svg>
  );
}

// ── 4. CIEN PALABRAS ──────────────────────────────────────────
// Águila dorada sobre nopal (escudo nacional estilizado)
function CienPalabrasIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Nopal */}
      <Ellipse cx="32" cy="50" rx="10" ry="6" fill="#4CAF50" />
      <Ellipse cx="26" cy="44" rx="6" ry="4" fill="#4CAF50" transform="rotate(-20 26 44)" />
      <Ellipse cx="38" cy="44" rx="6" ry="4" fill="#4CAF50" transform="rotate(20 38 44)" />
      {/* Águila cuerpo */}
      <Ellipse cx="32" cy="28" rx="8" ry="10" fill={COLORS.primeros.sec} />
      {/* Águila cabeza */}
      <Circle cx="32" cy="16" r="5" fill={COLORS.primeros.sec} />
      {/* Pico */}
      <Path d="M32 18 L34 22 L30 22 Z" fill={COLORS.primeros.pri} />
      {/* Ojo */}
      <Circle cx="30" cy="15" r="1" fill={COLORS.primeros.acc} />
      {/* Alas extendidas */}
      <Path
        d="M24 28 C18 22 10 18 6 20 C10 22 16 26 22 32 Z"
        fill={COLORS.primeros.pri}
      />
      <Path
        d="M40 28 C46 22 54 18 58 20 C54 22 48 26 42 32 Z"
        fill={COLORS.primeros.pri}
      />
      {/* Serpiente en pico */}
      <Path
        d="M28 20 C26 18 24 20 26 22 C28 24 30 22 32 20"
        fill="none"
        stroke="#4CAF50"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── 5. RACHA 3 ────────────────────────────────────────────────
// Sol naciente entre volcanes (Popo e Izta)
function Racha3Icon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Cielo - no background needed, transparent */}
      {/* Sol */}
      <Circle cx="32" cy="28" r="10" fill={COLORS.racha.sec} />
      {/* Rayos */}
      <Line x1="32" y1="12" x2="32" y2="16" stroke={COLORS.racha.sec} strokeWidth="2" strokeLinecap="round" />
      <Line x1="44" y1="20" x2="41" y2="22" stroke={COLORS.racha.sec} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="20" x2="23" y2="22" stroke={COLORS.racha.sec} strokeWidth="2" strokeLinecap="round" />
      <Line x1="48" y1="28" x2="44" y2="28" stroke={COLORS.racha.sec} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="28" x2="20" y2="28" stroke={COLORS.racha.sec} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="14" x2="21" y2="18" stroke={COLORS.racha.sec} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="46" y1="14" x2="43" y2="18" stroke={COLORS.racha.sec} strokeWidth="1.5" strokeLinecap="round" />
      {/* Volcán izq (Izta) */}
      <Polygon
        points="0,56 18,26 28,56"
        fill={COLORS.racha.pri}
      />
      {/* Nieve Izta */}
      <Path d="M14 34 L18 26 L22 34" fill="white" opacity="0.6" />
      {/* Volcán der (Popo) */}
      <Polygon
        points="36,56 46,22 64,56"
        fill={COLORS.racha.acc}
      />
      {/* Nieve Popo */}
      <Path d="M42 30 L46 22 L50 30" fill="white" opacity="0.6" />
      {/* Suelo */}
      <Rect x="0" y="52" width="64" height="12" fill="#523600" opacity="0.3" rx="2" />
    </Svg>
  );
}

// ── 6. RACHA 7 ────────────────────────────────────────────────
// Llama con pétalo de cempasúchil interior
function Racha7Icon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="14" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Llama exterior */}
      <Path
        d="M32 4 C38 16 52 24 48 40 C46 48 40 54 32 56 C24 54 18 48 16 40 C12 24 26 16 32 4 Z"
        fill={COLORS.racha.pri}
      />
      {/* Llama media */}
      <Path
        d="M32 14 C36 22 44 28 42 38 C40 44 37 48 32 50 C27 48 24 44 22 38 C20 28 28 22 32 14 Z"
        fill={COLORS.racha.acc}
      />
      {/* Pétalo de cempasúchil interior */}
      <Path
        d="M32 24 C34 28 28 32 32 36 C36 32 30 28 32 24 Z"
        fill={COLORS.racha.sec}
      />
      <Circle cx="32" cy="30" r="3" fill={COLORS.racha.sec} />
      {/* Pétalos cempasúchil */}
      <Ellipse cx="28" cy="30" rx="3" ry="2" fill={COLORS.racha.sec} opacity="0.8" />
      <Ellipse cx="36" cy="30" rx="3" ry="2" fill={COLORS.racha.sec} opacity="0.8" />
      <Ellipse cx="32" cy="26" rx="2" ry="3" fill={COLORS.racha.sec} opacity="0.8" />
      <Ellipse cx="32" cy="34" rx="2" ry="3" fill={COLORS.racha.sec} opacity="0.8" />
    </Svg>
  );
}

// ── 7. RACHA 30 ───────────────────────────────────────────────
// Ajolote amigable con branquias y corona de laurel
function Racha30Icon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="18" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Cola */}
      <Path
        d="M44 42 C50 40 54 36 56 32 C54 34 50 36 46 38"
        fill={COLORS.racha.pri}
        stroke={COLORS.racha.pri}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Cuerpo */}
      <Ellipse cx="32" cy="42" rx="16" ry="10" fill={COLORS.racha.pri} />
      {/* Barriga */}
      <Ellipse cx="32" cy="44" rx="10" ry="6" fill={COLORS.racha.sec} opacity="0.4" />
      {/* Cabeza */}
      <Circle cx="32" cy="30" r="12" fill={COLORS.racha.pri} />
      {/* Sonrisa */}
      <Path
        d="M27 34 C29 37 35 37 37 34"
        fill="none"
        stroke={COLORS.racha.acc}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Ojos */}
      <Circle cx="27" cy="28" r="3" fill="white" />
      <Circle cx="37" cy="28" r="3" fill="white" />
      <Circle cx="27" cy="28" r="1.5" fill="#333" />
      <Circle cx="37" cy="28" r="1.5" fill="#333" />
      {/* Branquias izquierda */}
      <Path d="M20 22 C14 16 12 12 10 10" stroke={COLORS.racha.pri} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M20 24 C14 20 10 18 8 16" stroke={COLORS.racha.pri} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M20 26 C14 24 10 24 8 22" stroke={COLORS.racha.pri} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Branquias derecha */}
      <Path d="M44 22 C50 16 52 12 54 10" stroke={COLORS.racha.pri} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M44 24 C50 20 54 18 56 16" stroke={COLORS.racha.pri} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M44 26 C50 24 54 24 56 22" stroke={COLORS.racha.pri} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Puntas branquias rosadas */}
      <Circle cx="10" cy="10" r="2" fill={COLORS.racha.sec} />
      <Circle cx="8" cy="16" r="2" fill={COLORS.racha.sec} />
      <Circle cx="8" cy="22" r="2" fill={COLORS.racha.sec} />
      <Circle cx="54" cy="10" r="2" fill={COLORS.racha.sec} />
      <Circle cx="56" cy="16" r="2" fill={COLORS.racha.sec} />
      <Circle cx="56" cy="22" r="2" fill={COLORS.racha.sec} />
      {/* Corona laurel */}
      <Path
        d="M24 20 C26 16 30 14 32 14 C34 14 38 16 40 20"
        fill="none"
        stroke="#4CAF50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="28" cy="17" r="1.5" fill="#4CAF50" />
      <Circle cx="36" cy="17" r="1.5" fill="#4CAF50" />
      <Circle cx="32" cy="15" r="1.5" fill="#4CAF50" />
      {/* Patitas */}
      <Ellipse cx="22" cy="52" rx="4" ry="2" fill={COLORS.racha.pri} />
      <Ellipse cx="42" cy="52" rx="4" ry="2" fill={COLORS.racha.pri} />
    </Svg>
  );
}

// ── 8. PRIMERA COLECCIÓN ──────────────────────────────────────
// Trofeo con greca azteca
function PrimeraColeccionIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="14" ry="3" fill="rgba(42,129,186,0.15)" />
      {/* Base */}
      <Rect x="22" y="52" width="20" height="4" rx="2" fill={COLORS.colecciones.acc} />
      {/* Pie */}
      <Rect x="28" y="44" width="8" height="8" fill={COLORS.colecciones.pri} />
      {/* Copa */}
      <Path
        d="M16 10 L16 28 C16 38 24 44 32 44 C40 44 48 38 48 28 L48 10 Z"
        fill={COLORS.colecciones.sec}
        stroke={COLORS.colecciones.acc}
        strokeWidth="1.5"
      />
      {/* Asas */}
      <Path
        d="M16 16 C10 16 8 22 8 26 C8 30 12 34 16 32"
        fill="none"
        stroke={COLORS.colecciones.sec}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M48 16 C54 16 56 22 56 26 C56 30 52 34 48 32"
        fill="none"
        stroke={COLORS.colecciones.sec}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Greca azteca (patrón escalonado) */}
      <Path
        d="M22 22 L26 22 L26 18 L30 18 L30 22 L34 22 L34 18 L38 18 L38 22 L42 22"
        fill="none"
        stroke={COLORS.colecciones.acc}
        strokeWidth="1.5"
      />
      <Path
        d="M22 28 L26 28 L26 32 L30 32 L30 28 L34 28 L34 32 L38 32 L38 28 L42 28"
        fill="none"
        stroke={COLORS.colecciones.acc}
        strokeWidth="1.5"
      />
      {/* Estrella */}
      <Polygon
        points="32,12 34,16 38,16 35,19 36,23 32,20 28,23 29,19 26,16 30,16"
        fill={COLORS.colecciones.pri}
      />
    </Svg>
  );
}

// ── 9. CINCUENTA CARTAS ───────────────────────────────────────
// Cartas estilo Lotería apiladas en abanico
function CincuentaCartasIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(42,129,186,0.15)" />
      {/* Carta trasera 1 */}
      <G transform="rotate(-15 32 36)">
        <Rect x="16" y="12" width="24" height="34" rx="3" fill={COLORS.colecciones.acc} stroke="#1A5A82" strokeWidth="1" />
        <Rect x="18" y="14" width="20" height="30" rx="2" fill="white" opacity="0.3" />
      </G>
      {/* Carta trasera 2 */}
      <G transform="rotate(-5 32 36)">
        <Rect x="18" y="10" width="24" height="34" rx="3" fill={COLORS.colecciones.pri} stroke="#1A5A82" strokeWidth="1" />
        <Rect x="20" y="12" width="20" height="30" rx="2" fill="white" opacity="0.3" />
      </G>
      {/* Carta frontal */}
      <G transform="rotate(8 32 36)">
        <Rect x="20" y="8" width="24" height="34" rx="3" fill="white" stroke={COLORS.colecciones.pri} strokeWidth="1.5" />
        {/* Borde decorativo */}
        <Rect x="23" y="11" width="18" height="28" rx="2" fill="none" stroke={COLORS.colecciones.sec} strokeWidth="1" />
        {/* Corazón lotería */}
        <Path
          d="M30 20 C30 18 27 16 27 18 C27 21 30 24 32 26 C34 24 37 21 37 18 C37 16 34 18 34 20 L32 23 Z"
          fill="#E85D3A"
        />
        {/* Texto "50" */}
        <Rect x="26" y="28" width="12" height="6" rx="1" fill={COLORS.colecciones.sec} />
      </G>
    </Svg>
  );
}

// ── 10. CINCO COLECCIONES ─────────────────────────────────────
// Libro abierto con borde de papel picado
function CincoColeccionesIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(42,129,186,0.15)" />
      {/* Libro abierto - página izquierda */}
      <Path
        d="M6 16 L30 12 L30 52 L6 48 Z"
        fill="white"
        stroke={COLORS.colecciones.pri}
        strokeWidth="1.5"
      />
      {/* Libro abierto - página derecha */}
      <Path
        d="M34 12 L58 16 L58 48 L34 52 Z"
        fill="white"
        stroke={COLORS.colecciones.pri}
        strokeWidth="1.5"
      />
      {/* Lomo */}
      <Rect x="30" y="12" width="4" height="40" fill={COLORS.colecciones.acc} />
      {/* Líneas de texto izq */}
      <Line x1="12" y1="24" x2="26" y2="22" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="30" x2="26" y2="28" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="36" x2="26" y2="34" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" />
      {/* Líneas de texto der */}
      <Line x1="38" y1="22" x2="52" y2="24" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="38" y1="28" x2="52" y2="30" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="38" y1="34" x2="52" y2="36" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" />
      {/* Papel picado - borde superior */}
      <Path
        d="M4 10 L8 14 L12 10 L16 14 L20 10 L24 14 L28 10 L32 14 L36 10 L40 14 L44 10 L48 14 L52 10 L56 14 L60 10"
        fill="none"
        stroke={COLORS.colecciones.sec}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Mini estrella decorativa */}
      <Polygon
        points="45,30 46,33 49,33 47,35 48,38 45,36 42,38 43,35 41,33 44,33"
        fill={COLORS.colecciones.sec}
      />
    </Svg>
  );
}

// ── 11. NIVEL PERFECTO ────────────────────────────────────────
// Olla de barro con vapor y motivo floral
function NivelPerfectoIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Olla */}
      <Path
        d="M14 28 C14 28 12 52 18 54 L46 54 C52 52 50 28 50 28 Z"
        fill={COLORS.experto.sec}
        stroke={COLORS.experto.acc}
        strokeWidth="1.5"
      />
      {/* Borde superior olla */}
      <Ellipse cx="32" cy="28" rx="18" ry="5" fill={COLORS.experto.pri} stroke={COLORS.experto.acc} strokeWidth="1.5" />
      {/* Motivo floral */}
      <Circle cx="32" cy="42" r="4" fill={COLORS.experto.pri} />
      <Ellipse cx="28" cy="40" rx="3" ry="2" fill={COLORS.experto.pri} transform="rotate(-30 28 40)" />
      <Ellipse cx="36" cy="40" rx="3" ry="2" fill={COLORS.experto.pri} transform="rotate(30 36 40)" />
      <Ellipse cx="28" cy="44" rx="3" ry="2" fill={COLORS.experto.pri} transform="rotate(30 28 44)" />
      <Ellipse cx="36" cy="44" rx="3" ry="2" fill={COLORS.experto.pri} transform="rotate(-30 36 44)" />
      <Circle cx="32" cy="42" r="2" fill={COLORS.experto.acc} />
      {/* Vapor */}
      <Path d="M24 22 C24 18 28 18 28 14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M32 20 C32 16 36 16 36 12" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M40 22 C40 18 44 18 44 14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── 12. NIVEL 50 ──────────────────────────────────────────────
// Estrella con centro de jade/obsidiana y líneas aztecas
function Nivel50Icon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Estrella grande */}
      <Polygon
        points="32,4 38,22 58,22 42,34 48,52 32,42 16,52 22,34 6,22 26,22"
        fill={COLORS.experto.pri}
        stroke={COLORS.experto.acc}
        strokeWidth="1.5"
      />
      {/* Centro de jade */}
      <Circle cx="32" cy="28" r="8" fill="#2E7D32" />
      <Circle cx="32" cy="28" r="6" fill="#43A047" />
      {/* Patrón azteca en el centro */}
      <Rect x="29" y="25" width="6" height="6" fill="none" stroke={COLORS.experto.acc} strokeWidth="1" transform="rotate(45 32 28)" />
      <Circle cx="32" cy="28" r="2" fill={COLORS.experto.pri} />
      {/* Líneas aztecas radiantes */}
      <Line x1="32" y1="20" x2="32" y2="16" stroke={COLORS.experto.acc} strokeWidth="1" />
      <Line x1="38" y1="24" x2="42" y2="22" stroke={COLORS.experto.acc} strokeWidth="1" />
      <Line x1="38" y1="32" x2="42" y2="34" stroke={COLORS.experto.acc} strokeWidth="1" />
      <Line x1="26" y1="24" x2="22" y2="22" stroke={COLORS.experto.acc} strokeWidth="1" />
      <Line x1="26" y1="32" x2="22" y2="34" stroke={COLORS.experto.acc} strokeWidth="1" />
    </Svg>
  );
}

// ── 13. NIVEL 100 ─────────────────────────────────────────────
// Piedra del Sol azteca simplificada
function Nivel100Icon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="18" ry="3" fill="rgba(82,54,0,0.15)" />
      {/* Disco exterior */}
      <Circle cx="32" cy="30" r="26" fill={COLORS.experto.sec} stroke={COLORS.experto.acc} strokeWidth="2" />
      {/* Anillo medio */}
      <Circle cx="32" cy="30" r="20" fill="none" stroke={COLORS.experto.acc} strokeWidth="1.5" />
      {/* Rayos del borde (triángulos) */}
      <Path d="M32 4 L34 8 L30 8 Z" fill={COLORS.experto.acc} />
      <Path d="M32 56 L34 52 L30 52 Z" fill={COLORS.experto.acc} />
      <Path d="M6 30 L10 32 L10 28 Z" fill={COLORS.experto.acc} />
      <Path d="M58 30 L54 32 L54 28 Z" fill={COLORS.experto.acc} />
      {/* Diagonal rays */}
      <Path d="M13 11 L16 14 L14 16 Z" fill={COLORS.experto.acc} />
      <Path d="M51 11 L48 14 L50 16 Z" fill={COLORS.experto.acc} />
      <Path d="M13 49 L16 46 L14 44 Z" fill={COLORS.experto.acc} />
      <Path d="M51 49 L48 46 L50 44 Z" fill={COLORS.experto.acc} />
      {/* Anillo interior */}
      <Circle cx="32" cy="30" r="13" fill={COLORS.experto.pri} stroke={COLORS.experto.acc} strokeWidth="1.5" />
      {/* Cara central (Tonatiuh simplificada) */}
      <Circle cx="32" cy="30" r="8" fill={COLORS.experto.sec} stroke={COLORS.experto.acc} strokeWidth="1" />
      {/* Ojos */}
      <Ellipse cx="28" cy="28" rx="2" ry="2.5" fill={COLORS.experto.acc} />
      <Ellipse cx="36" cy="28" rx="2" ry="2.5" fill={COLORS.experto.acc} />
      {/* Boca */}
      <Path
        d="M28 34 L32 36 L36 34"
        fill="none"
        stroke={COLORS.experto.acc}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Puntos cardinales decorativos */}
      <Circle cx="32" cy="14" r="2" fill={COLORS.experto.pri} />
      <Circle cx="32" cy="46" r="2" fill={COLORS.experto.pri} />
      <Circle cx="12" cy="30" r="2" fill={COLORS.experto.pri} />
      <Circle cx="52" cy="30" r="2" fill={COLORS.experto.pri} />
    </Svg>
  );
}

// ── 14. FOODIE MX ─────────────────────────────────────────────
// Trompo de pastor con piña y flama
function FoodieMxIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="14" ry="3" fill="rgba(212,84,59,0.15)" />
      {/* Base trompo */}
      <Rect x="26" y="52" width="12" height="4" rx="1" fill="#888" />
      {/* Eje vertical */}
      <Rect x="30" y="20" width="4" height="34" fill="#AAA" />
      {/* Carne apilada (cono/trompo) */}
      <Path
        d="M22 48 L32 20 L42 48 Z"
        fill={COLORS.categoria.pri}
        stroke={COLORS.categoria.acc}
        strokeWidth="0.5"
      />
      {/* Capas de carne */}
      <Line x1="24" y1="44" x2="40" y2="44" stroke={COLORS.categoria.sec} strokeWidth="1" opacity="0.5" />
      <Line x1="26" y1="40" x2="38" y2="40" stroke={COLORS.categoria.sec} strokeWidth="1" opacity="0.5" />
      <Line x1="27" y1="36" x2="37" y2="36" stroke={COLORS.categoria.sec} strokeWidth="1" opacity="0.5" />
      <Line x1="28" y1="32" x2="36" y2="32" stroke={COLORS.categoria.sec} strokeWidth="1" opacity="0.5" />
      {/* Piña encima */}
      <Ellipse cx="32" cy="18" rx="6" ry="4" fill={COLORS.categoria.acc} />
      <Path d="M29 14 L32 8 L35 14 Z" fill="#4CAF50" />
      <Path d="M26 15 L28 10 L31 15 Z" fill="#388E3C" />
      <Path d="M33 15 L36 10 L38 15 Z" fill="#388E3C" />
      {/* Patrón piña */}
      <Line x1="30" y1="16" x2="34" y2="20" stroke={COLORS.categoria.sec} strokeWidth="0.5" opacity="0.5" />
      <Line x1="34" y1="16" x2="30" y2="20" stroke={COLORS.categoria.sec} strokeWidth="0.5" opacity="0.5" />
      {/* Flama en base */}
      <Path
        d="M24 54 C26 50 28 52 30 48 C32 52 34 50 36 52 C38 48 40 52 42 54"
        fill="none"
        stroke={COLORS.categoria.pri}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── 15. MARIACHI FAN ──────────────────────────────────────────
// Trompeta con corazón saliendo
function MariachiFanIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="14" ry="3" fill="rgba(212,84,59,0.15)" />
      {/* Campana de trompeta */}
      <Path
        d="M38 28 C42 24 50 18 56 14 C58 14 58 24 56 30 C50 34 42 34 38 34 Z"
        fill={COLORS.categoria.sec}
        stroke={COLORS.categoria.pri}
        strokeWidth="1.5"
      />
      {/* Tubo */}
      <Rect x="10" y="28" width="30" height="6" rx="3" fill={COLORS.categoria.sec} stroke={COLORS.categoria.pri} strokeWidth="1" />
      {/* Pistones */}
      <Rect x="18" y="22" width="4" height="8" rx="1" fill={COLORS.categoria.pri} />
      <Rect x="24" y="22" width="4" height="8" rx="1" fill={COLORS.categoria.pri} />
      <Rect x="30" y="22" width="4" height="8" rx="1" fill={COLORS.categoria.pri} />
      {/* Boquilla */}
      <Circle cx="10" cy="31" r="3" fill={COLORS.categoria.sec} stroke={COLORS.categoria.pri} strokeWidth="1" />
      {/* Corazón saliendo de la campana */}
      <Path
        d="M50 8 C50 5 46 3 46 6 C46 9 50 13 52 15 C54 13 58 9 58 6 C58 3 54 5 54 8 L52 11 Z"
        fill="#E85D3A"
      />
      {/* Notas musicales */}
      <Circle cx="44" cy="42" r="2.5" fill={COLORS.categoria.acc} />
      <Line x1="46.5" y1="42" x2="46.5" y2="36" stroke={COLORS.categoria.acc} strokeWidth="1.5" />
      <Path d="M46.5 36 C48 35 50 36 50 38" fill="none" stroke={COLORS.categoria.acc} strokeWidth="1.5" />
      <Circle cx="22" cy="46" r="2" fill={COLORS.categoria.acc} opacity="0.6" />
      <Line x1="24" y1="46" x2="24" y2="41" stroke={COLORS.categoria.acc} strokeWidth="1" opacity="0.6" />
    </Svg>
  );
}

// ── 16. HISTORIA VIVA ─────────────────────────────────────────
// Códice desenrollado con glifos
function HistoriaVivaIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(212,84,59,0.15)" />
      {/* Rollo superior */}
      <Circle cx="12" cy="12" r="6" fill={COLORS.categoria.sec} stroke={COLORS.categoria.pri} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="2" fill={COLORS.categoria.pri} />
      {/* Pergamino desplegado */}
      <Path
        d="M12 18 L12 52 C12 54 14 56 16 56 L52 56 C54 56 56 54 56 52 L56 18"
        fill="#FFF8E1"
        stroke={COLORS.categoria.pri}
        strokeWidth="1.5"
      />
      {/* Rollo inferior derecho */}
      <Circle cx="56" cy="12" r="6" fill={COLORS.categoria.sec} stroke={COLORS.categoria.pri} strokeWidth="1.5" />
      <Circle cx="56" cy="12" r="2" fill={COLORS.categoria.pri} />
      {/* Borde pergamino superior */}
      <Line x1="12" y1="18" x2="56" y2="18" stroke={COLORS.categoria.pri} strokeWidth="1" />
      {/* Glifos aztecas simplificados */}
      {/* Glifo 1 - espiral */}
      <Path d="M22 26 C24 24 28 24 28 28 C28 32 22 32 22 28" fill="none" stroke={COLORS.categoria.pri} strokeWidth="1.5" strokeLinecap="round" />
      {/* Glifo 2 - escalonado */}
      <Path d="M34 24 L34 28 L38 28 L38 32 L42 32" fill="none" stroke={COLORS.categoria.pri} strokeWidth="1.5" strokeLinecap="round" />
      {/* Glifo 3 - ojo/sol */}
      <Circle cx="26" cy="40" r="3" fill="none" stroke={COLORS.categoria.pri} strokeWidth="1.5" />
      <Circle cx="26" cy="40" r="1" fill={COLORS.categoria.pri} />
      {/* Glifo 4 - zigzag agua */}
      <Path d="M34 38 C36 36 38 40 40 38 C42 36 44 40 46 38" fill="none" stroke={COLORS.categoria.acc} strokeWidth="1.5" strokeLinecap="round" />
      {/* Glifo 5 - pirámide */}
      <Path d="M20 50 L26 44 L32 50 Z" fill="none" stroke={COLORS.categoria.pri} strokeWidth="1.5" />
      {/* Glifo 6 - serpiente */}
      <Path d="M38 46 C40 44 42 48 44 46 C46 44 48 48 50 46" fill="none" stroke={COLORS.categoria.pri} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ── 17. INVITAR 3 ─────────────────────────────────────────────
// Megáfono con ondas y flor cempasúchil
function Invitar3Icon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="14" ry="3" fill="rgba(42,129,186,0.15)" />
      {/* Megáfono */}
      <Path
        d="M8 28 L8 38 L16 38 L34 50 L34 16 L16 28 Z"
        fill={COLORS.social.pri}
        stroke={COLORS.social.acc}
        strokeWidth="0.5"
      />
      {/* Campana del megáfono */}
      <Path
        d="M34 16 L44 10 L44 56 L34 50 Z"
        fill={COLORS.social.sec}
        stroke={COLORS.social.acc}
        strokeWidth="0.5"
      />
      {/* Ondas de sonido */}
      <Path d="M48 24 C52 28 52 38 48 42" fill="none" stroke={COLORS.social.acc} strokeWidth="2" strokeLinecap="round" />
      <Path d="M52 18 C58 24 58 42 52 48" fill="none" stroke={COLORS.social.acc} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Flor cempasúchil */}
      <Circle cx="54" cy="10" r="3" fill={COLORS.social.sec} />
      <Ellipse cx="50" cy="10" rx="3" ry="2" fill={COLORS.social.sec} />
      <Ellipse cx="58" cy="10" rx="3" ry="2" fill={COLORS.social.sec} />
      <Ellipse cx="54" cy="6" rx="2" ry="3" fill={COLORS.social.sec} />
      <Ellipse cx="54" cy="14" rx="2" ry="3" fill={COLORS.social.sec} />
      <Circle cx="54" cy="10" r="1.5" fill={COLORS.social.pri} />
    </Svg>
  );
}

// ── 18. INVITAR 10 ────────────────────────────────────────────
// Dos figuras unidas con banner de papel picado
function Invitar10Icon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(42,129,186,0.15)" />
      {/* Papel picado banner */}
      <Line x1="4" y1="10" x2="60" y2="10" stroke={COLORS.social.acc} strokeWidth="1.5" />
      {/* Banderitas */}
      <Polygon points="8,10 12,10 10,18" fill={COLORS.social.pri} />
      <Polygon points="16,10 20,10 18,18" fill={COLORS.social.sec} />
      <Polygon points="24,10 28,10 26,18" fill="#4CAF50" />
      <Polygon points="32,10 36,10 34,18" fill={COLORS.social.pri} />
      <Polygon points="40,10 44,10 42,18" fill={COLORS.social.sec} />
      <Polygon points="48,10 52,10 50,18" fill="#E85D3A" />
      <Polygon points="56,10 60,10 58,18" fill="#4CAF50" />
      {/* Calados en banderitas */}
      <Circle cx="10" cy="14" r="1" fill="white" />
      <Circle cx="18" cy="14" r="1" fill="white" />
      <Circle cx="26" cy="14" r="1" fill="white" />
      <Circle cx="34" cy="14" r="1" fill="white" />
      <Circle cx="42" cy="14" r="1" fill="white" />
      <Circle cx="50" cy="14" r="1" fill="white" />
      <Circle cx="58" cy="14" r="1" fill="white" />
      {/* Figura izquierda */}
      <Circle cx="22" cy="30" r="7" fill={COLORS.social.pri} />
      {/* Ojos */}
      <Circle cx="20" cy="29" r="1" fill="white" />
      <Circle cx="24" cy="29" r="1" fill="white" />
      {/* Sonrisa */}
      <Path d="M19 32 C20 34 24 34 25 32" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" />
      {/* Cuerpo izq */}
      <Path
        d="M14 42 C14 38 18 36 22 36 C26 36 30 38 30 42 L30 52 L14 52 Z"
        fill={COLORS.social.pri}
      />
      {/* Figura derecha */}
      <Circle cx="42" cy="30" r="7" fill={COLORS.social.sec} />
      {/* Ojos */}
      <Circle cx="40" cy="29" r="1" fill="white" />
      <Circle cx="44" cy="29" r="1" fill="white" />
      {/* Sonrisa */}
      <Path d="M39 32 C40 34 44 34 45 32" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" />
      {/* Cuerpo der */}
      <Path
        d="M34 42 C34 38 38 36 42 36 C46 36 50 38 50 42 L50 52 L34 52 Z"
        fill={COLORS.social.sec}
      />
      {/* Unión - manos */}
      <Path
        d="M28 44 C30 42 34 42 36 44"
        fill="none"
        stroke={COLORS.social.acc}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Corazón entre ellos */}
      <Path
        d="M31 24 C31 23 29 22 29 23 C29 25 31 27 32 28 C33 27 35 25 35 23 C35 22 33 23 33 24 L32 26 Z"
        fill="#E85D3A"
      />
    </Svg>
  );
}

// ── MAPA DE ÍCONOS ────────────────────────────────────────────
export const ACHIEVEMENT_ICONS = {
  primer_taco: PrimerTacoIcon,
  diez_palabras: DiezPalabrasIcon,
  cincuenta_palabras: CincuentaPalabrasIcon,
  cien_palabras: CienPalabrasIcon,
  racha_3: Racha3Icon,
  racha_7: Racha7Icon,
  racha_30: Racha30Icon,
  primera_coleccion: PrimeraColeccionIcon,
  cincuenta_cartas: CincuentaCartasIcon,
  cinco_colecciones: CincoColeccionesIcon,
  nivel_perfecto: NivelPerfectoIcon,
  nivel_50: Nivel50Icon,
  nivel_100: Nivel100Icon,
  foodie_mx: FoodieMxIcon,
  mariachi_fan: MariachiFanIcon,
  historia_viva: HistoriaVivaIcon,
  invitar_3: Invitar3Icon,
  invitar_10: Invitar10Icon,
};

// Color de fondo por categoría para el contenedor
export const CATEGORY_BG_COLORS = {
  primer_taco: "rgba(245,155,64,0.15)",
  diez_palabras: "rgba(245,155,64,0.15)",
  cincuenta_palabras: "rgba(245,155,64,0.15)",
  cien_palabras: "rgba(245,155,64,0.15)",
  racha_3: "rgba(232,93,58,0.15)",
  racha_7: "rgba(232,93,58,0.15)",
  racha_30: "rgba(232,93,58,0.15)",
  primera_coleccion: "rgba(42,129,186,0.15)",
  cincuenta_cartas: "rgba(42,129,186,0.15)",
  cinco_colecciones: "rgba(42,129,186,0.15)",
  nivel_perfecto: "rgba(252,209,29,0.15)",
  nivel_50: "rgba(252,209,29,0.15)",
  nivel_100: "rgba(252,209,29,0.15)",
  foodie_mx: "rgba(212,84,59,0.15)",
  mariachi_fan: "rgba(212,84,59,0.15)",
  historia_viva: "rgba(212,84,59,0.15)",
  invitar_3: "rgba(42,129,186,0.15)",
  invitar_10: "rgba(42,129,186,0.15)",
};
