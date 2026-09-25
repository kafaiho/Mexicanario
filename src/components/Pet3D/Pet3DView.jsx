import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { createGestureTracker } from './petGestures';
import { createPetController } from './petModels';

// expo-gl es un módulo nativo: si el build instalado no lo trae, no tronamos la
// app, solo mostramos la imagen estática (prop `fallback`).
let GLView = null;
try {
  GLView = require('expo-gl').GLView;
} catch (_) {
  GLView = null;
}

export const is3DAvailable = () => !!GLView;

// three.js espera un <canvas>; expo-gl solo entrega el contexto WebGL.
function createRenderer(gl) {
  const w = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  const canvas = {
    width: w,
    height: h,
    style: {},
    clientHeight: h,
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => gl,
  };
  if (!gl.getContextAttributes) {
    gl.getContextAttributes = () => ({ alpha: true, antialias: false, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
  }
  // expo-gl no implementa varios parámetros de pixelStorei y los reporta como
  // advertencia en cada textura; solo dejamos pasar el que sí soporta.
  const pixelStorei = gl.pixelStorei.bind(gl);
  gl.pixelStorei = (param, value) => {
    if (param === gl.UNPACK_FLIP_Y_WEBGL || param === gl.UNPACK_ALIGNMENT) pixelStorei(param, value);
  };
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: false, premultipliedAlpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

class GLErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { this.props.onError?.(e); }
  render() { return this.state.failed ? this.props.fallback ?? null : this.props.children; }
}

/**
 * Pet3DView — mascota 3D animada (Tecolote, Monarca, Ayotl) con expo-gl + three.js.
 *
 * Props:
 *   petType, stage        – mascota y etapa 1-6
 *   size                  – ancho = alto en dp
 *   active                – false pausa el render (pantalla sin foco)
 *   reduceMotion          – dibuja una pose quieta y no anima
 *   interactive           – la mirada sigue el dedo; arrastrar la gira; toque en la cabeza =
 *                           palmadita, en el cuerpo = rebote; frotar y cosquillas (4 toques)
 *   onInteract(kind)      – 'head' | 'body' | 'rub' | 'tickle' cuando el jugador la acaricia
 *   showFlame, streakDays, streakStatus – llama del tonalli ('activa' | 'riesgo' | 'apagada')
 *   mood                  – 'joyful' | 'happy' | 'hungry' | 'sad' | 'sleepy'
 *   reaction, reactionKey – 'tap' | 'correct' | 'combo' | 'wrong' | 'hint'; cambia reactionKey para repetir
 *   framing               – 'fit' (llena el cuadro) | 'stage' (crece con la etapa)
 *   outfit                – traje de la tienda ('skin_mariachi'…) o null
 *   fps                   – tope de cuadros por segundo (30 en el gameplay)
 *   fallback              – elemento a mostrar si no hay 3D en este dispositivo
 */
function Pet3DView({
  petType, stage = 1, size = 160, style,
  active = true, reduceMotion = false, interactive = false,
  showFlame = false, streakDays = 0, streakStatus = 'activa',
  mood = 'happy', reaction = null, reactionKey = 0,
  framing = 'fit', fps = 60, fallback = null, outfit = null, onInteract,
}) {
  const [failed, setFailed] = useState(!GLView);
  const ctrlRef = useRef(null);
  const glRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const needsFrameRef = useRef(true);
  const lastDxRef = useRef(0);
  const gestureRef = useRef(null);
  if (!gestureRef.current) gestureRef.current = createGestureTracker();
  const touchStartRef = useRef({ x: 0, y: 0 });
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const running = active && appActive && !reduceMotion;

  // Props actuales, legibles desde el contexto GL sin recrearlo
  const propsRef = useRef({});
  propsRef.current = { petType, stage, showFlame, streakDays, streakStatus, mood, reduceMotion, framing, outfit };

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  const renderOnce = () => {
    const ctrl = ctrlRef.current, renderer = rendererRef.current, gl = glRef.current;
    if (!ctrl || !renderer || !gl) return;
    renderer.render(ctrl.scene, ctrl.camera);
    gl.endFrameEXP();
  };

  const onContextCreate = (gl) => {
    try {
      const p = propsRef.current;
      glRef.current = gl;
      rendererRef.current = createRenderer(gl);
      const ctrl = createPetController({ petType: p.petType, stage: p.stage, framing: p.framing, showFlame: p.showFlame, outfit: p.outfit });
      ctrl.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      ctrl.setStreak(p.streakDays, p.streakStatus);
      ctrl.setMood(p.mood);
      ctrl.setReduceMotion(p.reduceMotion);
      ctrl.update(0.016);
      ctrlRef.current = ctrl;
      renderOnce();
      needsFrameRef.current = true;
    } catch (e) {
      if (__DEV__) console.warn('[Pet3DView] no se pudo iniciar el 3D:', e?.message ?? e);
      setFailed(true);
    }
  };

  // Bucle de animación con tope de fps; se detiene sin foco, en segundo plano o con movimiento reducido
  useEffect(() => {
    if (failed) return undefined;
    let last = 0;
    let lastUpdate = 0;
    const minDelta = 1000 / fps;
    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      const ctrl = ctrlRef.current;
      if (!ctrl) return;
      if (!running) {
        if (needsFrameRef.current) { ctrl.update(0.016); renderOnce(); needsFrameRef.current = false; }
        return;
      }
      if (now - last < minDelta - 1) return;
      last = now;
      const dt = lastUpdate ? (now - lastUpdate) / 1000 : 0.016;
      lastUpdate = now;
      try {
        ctrl.update(dt);
        renderOnce();
      } catch (e) {
        if (__DEV__) console.warn('[Pet3DView] error al dibujar:', e?.message ?? e);
        setFailed(true);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, fps, failed]);

  // Cambios de props → controlador
  useEffect(() => { ctrlRef.current?.setPet(petType, stage); needsFrameRef.current = true; }, [petType, stage]);
  useEffect(() => { ctrlRef.current?.setShowFlame(showFlame); needsFrameRef.current = true; }, [showFlame]);
  useEffect(() => { ctrlRef.current?.setOutfit(outfit); needsFrameRef.current = true; }, [outfit]);
  useEffect(() => { ctrlRef.current?.setStreak(streakDays, streakStatus); needsFrameRef.current = true; }, [streakDays, streakStatus]);
  useEffect(() => { ctrlRef.current?.setMood(mood); needsFrameRef.current = true; }, [mood]);
  useEffect(() => { ctrlRef.current?.setReduceMotion(reduceMotion); needsFrameRef.current = true; }, [reduceMotion]);
  useEffect(() => {
    if (reaction && !reduceMotion) ctrlRef.current?.react(reaction);
  }, [reaction, reactionKey, reduceMotion]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    ctrlRef.current?.dispose();
    ctrlRef.current = null;
    rendererRef.current = null;
    glRef.current = null;
  }, []);

  // Toques: la mirada sigue el dedo; arrastrar en horizontal la gira; tocar, frotar
  // y hacer cosquillas son caricias. El arrastre vertical se deja al ScrollView.
  const pan = useMemo(() => {
    const toView = (x, y) => [(x / size) * 2 - 1, -((y / size) * 2 - 1)];
    const look = (x, y) => {
      const [nx, ny] = toView(x, y);
      ctrlRef.current?.lookAt(nx, ny);
      needsFrameRef.current = true;
    };
    const finish = () => {
      lastDxRef.current = 0;
      ctrlRef.current?.release();
      ctrlRef.current?.lookAt(null);
      needsFrameRef.current = true;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: (_, g) => interactive && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        touchStartRef.current = { x, y };
        lastDxRef.current = 0;
        gestureRef.current.begin(x, y, Date.now());
        look(x, y);
      },
      onPanResponderMove: (_, g) => {
        const ctrl = ctrlRef.current;
        if (!ctrl) return;
        const x = touchStartRef.current.x + g.dx;
        const y = touchStartRef.current.y + g.dy;
        if (gestureRef.current.move(x, y, Date.now()) === 'rub') {
          ctrl.pet('rub');
          onInteractRef.current?.('rub');
        }
        if (!gestureRef.current.rubbing && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5) {
          ctrl.dragBy(g.dx - lastDxRef.current);
          lastDxRef.current = g.dx;
        }
        look(x, y);
      },
      onPanResponderRelease: (_, g) => {
        const ctrl = ctrlRef.current;
        const x = touchStartRef.current.x + g.dx;
        const y = touchStartRef.current.y + g.dy;
        const kind = gestureRef.current.end(x, y, Date.now());
        if (ctrl && kind === 'tickle') {
          ctrl.pet('tickle');
          onInteractRef.current?.('tickle');
        } else if (ctrl && kind === 'tap') {
          const [nx, ny] = toView(x, y);
          const zone = ctrl.zoneAt(nx, ny) || 'body';
          if (zone === 'head') ctrl.pet('headpat');
          else ctrl.react('tap');
          onInteractRef.current?.(zone);
        }
        finish();
      },
      onPanResponderTerminate: () => { gestureRef.current.cancel(); finish(); },
      onPanResponderTerminationRequest: () => true,
    });
  }, [interactive, size]);

  if (failed || !GLView) return fallback;

  return (
    <View style={[{ width: size, height: size }, style]} {...(interactive ? pan.panHandlers : null)}>
      <GLErrorBoundary fallback={fallback} onError={() => setFailed(true)}>
        <GLView style={styles.fill} onContextCreate={onContextCreate} msaaSamples={4} />
      </GLErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%', backgroundColor: 'transparent' },
});

export default React.memo(Pet3DView);
