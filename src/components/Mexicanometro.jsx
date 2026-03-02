import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// ─── Mexican milestone levels ─────────────────────────────────────────────────
// Each milestone: { tacos, emoji, title, desc }
const MILESTONES = [
  { tacos: 0,    emoji: '🩲',  title: 'En calzones',             desc: '¿Taco? ¿Eso con qué se come?' },
  { tacos: 10,   emoji: '🐣',  title: 'Chapulín novato',         desc: 'Ya sabes que el chile pica' },
  { tacos: 30,   emoji: '🌮',  title: 'Taquero en training',     desc: '¡Ya le agarraste el sabor al rollo!' },
  { tacos: 60,   emoji: '🎺',  title: 'Chilango honorario',      desc: '¡Ya hablas como del DF!' },
  { tacos: 100,  emoji: '🌶️', title: 'Jalapeño con poder',      desc: '¡Ya le atas el caballo al poste!' },
  { tacos: 150,  emoji: '🎩',  title: 'Charro de barrio',        desc: '¡Mero mero de la colonia!' },
  { tacos: 200,  emoji: '🦅',  title: 'Cuate de hueso colorado', desc: '¡Ya eres de los nuestros, carnal!' },
  { tacos: 300,  emoji: '🇲🇽', title: 'Neta del mexica',        desc: '¡Eres más mexicano que el mole!' },
  { tacos: 400,  emoji: '🌵',  title: 'Mexica de corazón',       desc: '¡Ya hasta sueñas en mexicano!' },
  { tacos: 500,  emoji: '🏆',  title: 'Luchador de barrio',      desc: '¡Ni el más cabrón te para!' },
  { tacos: 600,  emoji: '🗿',  title: 'Tenochtitlán VIP',        desc: '¡Los dioses aztecas te conocen!' },
  { tacos: 700,  emoji: '🌙',  title: 'Tlacuache eterno',        desc: '¡Ya sobreviviste todo, compa!' },
  { tacos: 800,  emoji: '🥑',  title: 'Dios del guacamole',      desc: '¡Eres una leyenda de la cultura!' },
  { tacos: 900,  emoji: '🫔',  title: 'Leyenda del mole',        desc: '¡Hasta los chiles te respetan!' },
  { tacos: 1000, emoji: '🔱',  title: 'El mero mero chingón',    desc: '¡Conquistaste todo México, leyenda!' },
];

function getCurrentMilestone(tacos) {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (tacos >= m.tacos) current = m;
    else break;
  }
  return current;
}

function getNextMilestone(tacos) {
  return MILESTONES.find((m) => m.tacos > tacos) ?? null;
}

// Mapear nivel a posición 0→1 alineada con la distribución visual de los milestones
function levelToPosition(level) {
  const n = MILESTONES.length;
  for (let i = 0; i < n - 1; i++) {
    if (level < MILESTONES[i + 1].tacos) {
      const segProgress = (level - MILESTONES[i].tacos) / (MILESTONES[i + 1].tacos - MILESTONES[i].tacos);
      return (i + segProgress) / (n - 1);
    }
  }
  return 1; // pasó todos los milestones
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Mexicanometro({ visible, onClose }) {
  const { user } = useAuth();
  // Tacos = palabras adivinadas (1 taco por palabra)
  const tacos = user?.tacos ?? 0;

  const current  = getCurrentMilestone(tacos);
  const nextM    = getNextMilestone(tacos);
  const maxTacos = MILESTONES[MILESTONES.length - 1].tacos;

  // Posición alineada con los milestones visuales
  const barPosition = levelToPosition(tacos);

  // Animated fill bar
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    Animated.timing(fillAnim, {
      toValue: barPosition,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [visible, tacos]);

  const BAR_HEIGHT = height * 0.55;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Mexicanómetro 🌮</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Current rank banner */}
          <View style={s.rankBanner}>
            <Text style={s.rankEmoji}>{current.emoji}</Text>
            <View>
              <Text style={s.rankTitle}>{current.title}</Text>
              <Text style={s.rankDesc}>{current.desc}</Text>
            </View>
          </View>

          {/* Progress info */}
          <View style={s.progressInfo}>
            <Text style={s.tacoCount}>🌮 {tacos} tacos</Text>
            {nextM && (
              <Text style={s.nextInfo}>
                Faltan {nextM.tacos - tacos} tacos para «{nextM.title}»
              </Text>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            <View style={[s.meterRow, { minHeight: BAR_HEIGHT }]}>
              {/* Vertical bar */}
              <View style={s.barTrack}>
                <Animated.View
                  style={[
                    s.barFill,
                    {
                      height: fillAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
                {/* Current position indicator */}
                <View
                  style={[
                    s.posIndicator,
                    {
                      bottom: `${Math.min(barPosition * 100, 98)}%`,
                    },
                  ]}
                >
                  <View style={s.posCircle}>
                    <Text style={s.posText}>{tacos}</Text>
                  </View>
                </View>
              </View>

              {/* Milestones list */}
              <View style={s.milestoneList}>
                {[...MILESTONES].reverse().map((m) => {
                  const unlocked = tacos >= m.tacos;
                  return (
                    <View key={m.tacos} style={s.milestoneRow}>
                      {/* Level number */}
                      <Text style={[s.mLevel, unlocked && s.mLevelUnlocked]}>
                        {m.tacos}
                      </Text>
                      {/* Dot on bar */}
                      <View style={[s.dot, unlocked && s.dotUnlocked]} />
                      {/* Card */}
                      <View style={[s.card, !unlocked && s.cardLocked]}>
                        {unlocked ? (
                          <>
                            <Text style={s.cardEmoji}>{m.emoji}</Text>
                            <View style={s.cardText}>
                              <Text style={s.cardTitle}>{m.title}</Text>
                              <Text style={s.cardDesc}>{m.desc}</Text>
                            </View>
                          </>
                        ) : (
                          <Text style={s.lockIcon}>🔒</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BROWN  = '#8B4513';
const ORANGE = '#FF6B35';
const AMBER  = '#D2691E';
const GOLD   = '#F8BE17';

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFE4B5',
    borderRadius: width * 0.05,
    width: width * 0.88,
    maxHeight: height * 0.85,
    paddingBottom: height * 0.02,
    overflow: 'hidden',
    borderWidth: width * 0.01,
    borderColor: BROWN,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.022,
    paddingBottom: height * 0.012,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E55',
  },
  title: { color: BROWN, fontWeight: 'bold', fontSize: width * 0.053 },
  closeBtn: {
    width: width * 0.085,
    height: width * 0.085,
    borderRadius: width * 0.0425,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: width * 0.058, fontWeight: 'bold', lineHeight: width * 0.068 },

  // Rank banner
  rankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.03,
    backgroundColor: '#F5DEB3',
    marginHorizontal: width * 0.04,
    marginTop: height * 0.015,
    borderRadius: width * 0.04,
    padding: width * 0.035,
    borderWidth: 2,
    borderColor: AMBER,
  },
  rankEmoji: { fontSize: width * 0.095 },
  rankTitle: { color: BROWN, fontWeight: 'bold', fontSize: width * 0.042 },
  rankDesc:  { color: '#7A4020', fontSize: width * 0.032, marginTop: height * 0.003 },

  // Progress info
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.012,
  },
  tacoCount: { color: BROWN, fontWeight: 'bold', fontSize: width * 0.048 },
  nextInfo:  { color: '#9A6030', fontSize: width * 0.029, maxWidth: width * 0.45, textAlign: 'right' },

  scroll: { paddingHorizontal: width * 0.04, paddingBottom: height * 0.01 },

  // Meter row
  meterRow: {
    flexDirection: 'row',
    gap: width * 0.02,
  },

  // Bar
  barTrack: {
    width: width * 0.025,
    backgroundColor: '#DEB887',
    borderRadius: width * 0.02,
    marginTop: height * 0.012,
    position: 'relative',
    overflow: 'visible',
  },
  barFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AMBER,
    borderRadius: width * 0.02,
  },
  posIndicator: {
    position: 'absolute',
    left: width * -0.058,
    alignItems: 'center',
  },
  posCircle: {
    backgroundColor: BROWN,
    borderRadius: width * 0.042,
    minWidth: width * 0.085,
    paddingHorizontal: width * 0.015,
    paddingVertical: height * 0.005,
    alignItems: 'center',
  },
  posText: { color: '#fff', fontWeight: 'bold', fontSize: width * 0.029 },

  // Milestone list
  milestoneList: { flex: 1, gap: 0 },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.015,
    marginBottom: height * 0.017,
  },
  mLevel: { color: '#C4A882', fontWeight: 'bold', fontSize: width * 0.034, width: width * 0.075, textAlign: 'right' },
  mLevelUnlocked: { color: BROWN },
  dot: {
    width: width * 0.037,
    height: width * 0.037,
    borderRadius: width * 0.0185,
    backgroundColor: '#D2A679',
    borderWidth: 2,
    borderColor: '#B8926A',
  },
  dotUnlocked: { backgroundColor: GOLD, borderColor: '#C8950A' },

  // Cards
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.025,
    backgroundColor: '#F5DEB3',
    borderRadius: width * 0.037,
    padding: width * 0.025,
    minHeight: height * 0.065,
    borderWidth: 1.5,
    borderColor: '#D2A679',
  },
  cardLocked: { backgroundColor: '#E8C99A', justifyContent: 'center', borderColor: '#C4A882' },
  cardEmoji: { fontSize: width * 0.074 },
  cardText:  { flex: 1 },
  cardTitle: { color: BROWN, fontWeight: 'bold', fontSize: width * 0.037 },
  cardDesc:  { color: '#7A4020', fontSize: width * 0.029, marginTop: height * 0.001 },
  lockIcon:  { fontSize: width * 0.063, textAlign: 'center', flex: 1 },
});
