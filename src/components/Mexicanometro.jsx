import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
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
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { useScreenDims } from '../hooks/useScreenDims';
import { TABLET_MODE } from '../utils/tabletSetup';

// Patched width for element sizing (fonts, padding)
const { width } = Dimensions.get('window');

// ─── 13 Milestones: 12 zonas del mapa + logro final ─────────────────────────
const MILESTONE_TEMPLATES = [
  { pct: 0,     emoji: '🏙️',  title: 'Carreteras de CDMX',      desc: 'La capital nunca duerme' },
  { pct: 1/12,  emoji: '🫙',  title: 'Sabores de Oaxaca',        desc: 'Tlayudas, mole negro y mezcal' },
  { pct: 2/12,  emoji: '🎺',  title: 'Tierra de Mariachi',       desc: 'De aquí viene el tequila' },
  { pct: 3/12,  emoji: '🌴',  title: 'Misterios del Mayab',      desc: 'Cenotes y pirámides mayas' },
  { pct: 4/12,  emoji: '⚓',  title: 'Puerto y Son Jarocho',     desc: 'Bongos, jarana y danzón' },
  { pct: 5/12,  emoji: '🤠',  title: 'El Norte Bravo',           desc: 'Corridos, banda y aguachile' },
  { pct: 6/12,  emoji: '🎭',  title: 'Mole y Talavera',          desc: 'Chiles en nogada y azulejos' },
  { pct: 7/12,  emoji: '🌊',  title: 'Costa y Tierra Caliente',  desc: 'Acapulco, lacas y calor del sur' },
  { pct: 8/12,  emoji: '🦜',  title: 'Selva y Maravillas',       desc: 'Selva Lacandona y Palenque' },
  { pct: 9/12,  emoji: '🌵',  title: 'Desierto y Frontera',      desc: 'Desierto, burritos y norteña bravía' },
  { pct: 10/12, emoji: '🦋',  title: 'Monarcas y Tradición',     desc: 'Mariposas monarca, cobre y carnitas' },
  { pct: 11/12, emoji: '🦅',  title: 'México Legendario',        desc: 'Leyendas, mitos y el México eterno' },
  { pct: 1.0,   emoji: '🔱',  title: 'El Mero Mero',             desc: '¡Conquistaste todo México, leyenda!' },
];

function buildMilestones(totalLevels) {
  return MILESTONE_TEMPLATES.map((t) => ({
    ...t,
    level: Math.round(t.pct * totalLevels),
  }));
}

function getCurrentMilestone(milestones, completed) {
  let current = milestones[0];
  for (const m of milestones) {
    if (completed >= m.level) current = m;
    else break;
  }
  return current;
}

function getNextMilestone(milestones, completed) {
  return milestones.find((m) => m.level > completed) ?? null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Mexicanometro({ visible, onClose }) {
  const { user, userId } = useAuth();
  // Per-user active path length (excludes retired words); shares the
  // subscription MainMenu already holds for getCurrentLevel.
  const levelInfo = useQuery(api.users.getCurrentLevel, userId ? { userId } : "skip");
  const fallbackCount = useQuery(api.levels.getLevelCount, levelInfo?.totalLevels ? "skip" : {});
  const totalLevels = levelInfo?.totalLevels ?? fallbackCount ?? 0;

  // Real screen dimensions — updates on rotation
  const screen = useScreenDims();
  const isLandscape = TABLET_MODE && screen.width > screen.height;

  // Modal sizing adapts to orientation
  const modalW = TABLET_MODE
    ? (isLandscape ? Math.min(screen.width * 0.85, 900) : Math.min(screen.width * 0.75, 540))
    : width * 0.88;
  const modalMaxH = TABLET_MODE
    ? (isLandscape ? screen.height * 0.90 : screen.height * 0.82)
    : screen.height * 0.85;

  // Clamp completed to totalLevels
  const completed = Math.max(0, Math.min((user?.currentLevel ?? 1) - 1, totalLevels));
  const pctDone = totalLevels > 0 ? completed / totalLevels : 0;

  const milestones = useMemo(() => buildMilestones(totalLevels), [totalLevels]);
  const reversed = useMemo(() => [...milestones].reverse(), [milestones]);

  const current = getCurrentMilestone(milestones, completed);
  const nextM   = getNextMilestone(milestones, completed);

  // ── Row layout tracking for precise bar alignment ────────────────────────
  const rowYs = useRef({});
  const [listH, setListH] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) { setReady(false); rowYs.current = {}; }
  }, [visible]);

  const onRowLayout = useCallback((idx, e) => {
    const { y, height: rh } = e.nativeEvent.layout;
    rowYs.current[idx] = y + rh / 2;
    if (Object.keys(rowYs.current).length === reversed.length) setReady(true);
  }, [reversed.length]);

  // Find current milestone index and interpolate position between rows
  const getIndicatorY = () => {
    if (!ready || listH === 0) return null;

    let curIdx = 0;
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (completed >= milestones[i].level) { curIdx = i; break; }
    }
    const nxtIdx = Math.min(curIdx + 1, milestones.length - 1);

    const revCur = milestones.length - 1 - curIdx;
    const revNxt = milestones.length - 1 - nxtIdx;

    const yCur = rowYs.current[revCur] ?? 0;
    const yNxt = rowYs.current[revNxt] ?? yCur;

    if (curIdx === nxtIdx) return yCur;
    const span = milestones[nxtIdx].level - milestones[curIdx].level;
    const seg = span > 0 ? (completed - milestones[curIdx].level) / span : 0;
    return yCur + (yNxt - yCur) * seg;
  };

  const indicatorY = ready ? getIndicatorY() : null;
  const barFillH = indicatorY != null ? Math.max(0, listH - indicatorY) : 0;

  // Animated fill
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible || !ready) return;
    fillAnim.setValue(0);
    Animated.timing(fillAnim, { toValue: barFillH, duration: 800, useNativeDriver: false }).start();
  }, [visible, ready, barFillH]);

  // ── Milestone list renderer (shared between layouts) ──
  const renderMilestoneList = () => (
    <View
      style={s.milestoneList}
      onLayout={(e) => setListH(e.nativeEvent.layout.height)}
    >
      <View style={s.barTrack} pointerEvents="none">
        <Animated.View style={[s.barFill, { height: fillAnim }]} />
      </View>
      {indicatorY != null && (
        <View style={[s.indicator, { top: indicatorY - IND_R }]}>
          <View style={s.indCircle}>
            <Text style={s.indText}>{completed}</Text>
          </View>
          <View style={s.indArrow} />
        </View>
      )}
      {reversed.map((m, idx) => {
        const unlocked = completed >= m.level;
        const isCurrent = m === current;
        return (
          <View key={String(m.pct)} style={s.row} onLayout={(e) => onRowLayout(idx, e)}>
            <Text style={[s.lvlNum, unlocked && s.lvlNumOn]}>{m.level}</Text>
            <View style={[s.dot, unlocked && s.dotOn, isCurrent && s.dotCur]} />
            <View style={[s.card, unlocked && s.cardOn, isCurrent && s.cardCur]}>
              <Text style={s.cardEmoji}>{unlocked ? m.emoji : '🔒'}</Text>
              <View style={s.cardBody}>
                <Text style={[s.cardTitle, !unlocked && s.cardTitleOff, isCurrent && s.cardTitleCur]}>
                  {m.title}
                </Text>
                <Text style={[s.cardDesc, !unlocked && s.cardDescOff]}>
                  {unlocked ? m.desc : `Nivel ${m.level}`}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.modal, { width: modalW, maxHeight: modalMaxH, ...(isLandscape && { height: modalMaxH }) }]}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Mexicanómetro 🌮</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          {isLandscape ? (
            // ── Landscape tablet: side-by-side ──
            <View style={s.landscapeBody}>
              {/* Left panel: rank + progress */}
              <ScrollView
                style={s.landscapeLeft}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                <View style={s.rankBanner}>
                  <Text style={s.rankEmoji}>{current.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rankTitle}>{current.title}</Text>
                    <Text style={s.rankDesc}>{current.desc}</Text>
                  </View>
                </View>

                <View style={s.progressInfo}>
                  <Text style={s.tacoCount}>Nivel {completed} / {totalLevels}</Text>
                  <Text style={s.pctText}>{Math.round(pctDone * 100)}%</Text>
                </View>

                <View style={s.globalBar}>
                  <View style={[s.globalFill, { width: `${Math.min(pctDone * 100, 100)}%` }]} />
                </View>

                {nextM && (
                  <Text style={s.nextInfo}>
                    Faltan {nextM.level - completed} palabras para «{nextM.title}» {nextM.emoji}
                  </Text>
                )}
              </ScrollView>

              {/* Right panel: milestone list */}
              <ScrollView
                style={s.landscapeRight}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
              >
                {renderMilestoneList()}
              </ScrollView>
            </View>
          ) : (
            // ── Portrait / phone: stacked layout ──
            <>
              <View style={s.rankBanner}>
                <Text style={s.rankEmoji}>{current.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.rankTitle}>{current.title}</Text>
                  <Text style={s.rankDesc}>{current.desc}</Text>
                </View>
              </View>

              <View style={s.progressInfo}>
                <Text style={s.tacoCount}>Nivel {completed} / {totalLevels}</Text>
                <Text style={s.pctText}>{Math.round(pctDone * 100)}%</Text>
              </View>

              <View style={s.globalBar}>
                <View style={[s.globalFill, { width: `${Math.min(pctDone * 100, 100)}%` }]} />
              </View>

              {nextM && (
                <Text style={s.nextInfo}>
                  Faltan {nextM.level - completed} palabras para «{nextM.title}» {nextM.emoji}
                </Text>
              )}

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {renderMilestoneList()}
              </ScrollView>
            </>
          )}
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

const LVL_W  = width * 0.11;
const DOT_SZ = width * 0.032;
const BAR_W  = width * 0.018;
const IND_R  = width * 0.038;

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modal: {
    backgroundColor: '#FFE4B5',
    borderRadius: 22,
    paddingBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: BROWN,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: '#D2691E44',
  },
  title: { color: BROWN, fontWeight: 'bold', fontSize: width * 0.05 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold', lineHeight: 28 },

  rankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F5DEB3', marginHorizontal: 16, marginTop: 10,
    borderRadius: 16, padding: 12, borderWidth: 2, borderColor: AMBER,
  },
  rankEmoji: { fontSize: TABLET_MODE ? 36 : width * 0.085 },
  rankTitle: { color: BROWN, fontWeight: 'bold', fontSize: width * 0.04 },
  rankDesc:  { color: '#7A4020', fontSize: width * 0.03, marginTop: 2 },

  progressInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4,
  },
  tacoCount: { color: BROWN, fontWeight: 'bold', fontSize: width * 0.04 },
  pctText:   { color: AMBER, fontWeight: 'bold', fontSize: width * 0.04 },

  globalBar: {
    height: 9, backgroundColor: '#DEB887', borderRadius: 6,
    marginHorizontal: 20, marginBottom: 4, overflow: 'hidden',
  },
  globalFill: { height: '100%', backgroundColor: GOLD, borderRadius: 6 },

  nextInfo: {
    color: '#9A6030', fontSize: width * 0.028, textAlign: 'center',
    paddingHorizontal: 24, paddingBottom: 6,
  },

  // ── Landscape tablet layout ──
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeLeft: {
    width: '38%',
    borderRightWidth: 1.5,
    borderRightColor: '#D2691E33',
  },
  landscapeRight: {
    flex: 1,
  },

  scroll: { paddingHorizontal: 14, paddingBottom: 8 },
  milestoneList: { position: 'relative' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: width * 0.01,
    marginBottom: 8,
  },

  // Vertical bar
  barTrack: {
    position: 'absolute',
    left: LVL_W + (DOT_SZ - BAR_W) / 2 + width * 0.005,
    width: BAR_W, top: 0, bottom: 0,
    backgroundColor: '#DEB887', borderRadius: BAR_W / 2, overflow: 'hidden', zIndex: 0,
  },
  barFill: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: AMBER, borderRadius: BAR_W / 2,
  },

  // Indicator
  indicator: {
    position: 'absolute', left: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  indCircle: {
    backgroundColor: BROWN, borderRadius: IND_R,
    minWidth: IND_R * 2, paddingHorizontal: width * 0.012, paddingVertical: 3,
    alignItems: 'center', borderWidth: 2, borderColor: GOLD,
  },
  indText: { color: '#fff', fontWeight: 'bold', fontSize: width * 0.025 },
  indArrow: {
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 7,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: BROWN,
  },

  // Level number
  lvlNum: { color: '#C4A882', fontWeight: 'bold', fontSize: width * 0.026, width: LVL_W, textAlign: 'right', paddingRight: width * 0.008 },
  lvlNumOn: { color: BROWN },

  // Dot
  dot: {
    width: DOT_SZ, height: DOT_SZ, borderRadius: DOT_SZ / 2,
    backgroundColor: '#D2A679', borderWidth: 2, borderColor: '#B8926A', zIndex: 1,
  },
  dotOn:  { backgroundColor: GOLD, borderColor: '#C8950A' },
  dotCur: { backgroundColor: ORANGE, borderColor: BROWN, width: DOT_SZ * 1.25, height: DOT_SZ * 1.25, borderRadius: DOT_SZ * 0.625 },

  // Card
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: width * 0.02,
    backgroundColor: '#E8D5B8', borderRadius: 14,
    padding: 10, minHeight: 44,
    borderWidth: 1.5, borderColor: '#C4A882',
  },
  cardOn:  { backgroundColor: '#F5DEB3', borderColor: '#D2A679' },
  cardCur: { backgroundColor: '#FFF3D6', borderColor: GOLD, borderWidth: 2 },
  cardEmoji: { fontSize: TABLET_MODE ? 24 : width * 0.06 },
  cardBody:  { flex: 1 },
  cardTitle:    { color: BROWN, fontWeight: 'bold', fontSize: width * 0.033 },
  cardTitleCur: { color: ORANGE },
  cardTitleOff: { color: '#A08060' },
  cardDesc:     { color: '#7A4020', fontSize: width * 0.026, marginTop: 1 },
  cardDescOff:  { color: '#B8A080' },
});
