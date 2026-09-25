import Constants from 'expo-constants';
import { DEFAULT_PET_TYPE, normalizePetName, normalizePetType } from '../config/petTypes';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications = null;
if (!isExpoGo) {
  Notifications = require('expo-notifications');
}

// ─────────────────────────────────────────────────────────────────────────────
// Mexicanario — Notification Service
// 7 canales dopamínicos con copy por mascota, timing inteligente y loss aversion
// ─────────────────────────────────────────────────────────────────────────────

const NOTIF_IDS = {
  streakRisk:   'streak-risk',       // 21:00 si no jugó hoy
  streakLost:   'streak-lost',       // 09:00 día siguiente si pierde racha
  milestoneEve: 'milestone-eve',     // noche antes del próximo hito
  mascotHungry: 'mascot-hungry',     // 36h sin jugar
  missionsReset:'missions-reset',    // 08:00 día siguiente (misiones nuevas)
  wheelReady:   'wheel-ready',       // 24h después del spin
  leagueDrama:  'league-drama',      // domingo 19:00
};

// ── Hitos de racha y sus recompensas en diamantes ─────────────────────────────
const MILESTONES     = [7, 14, 30, 50, 100, 365];
const MILESTONE_GEMS = { 7: 35, 14: 140, 30: 210, 50: 350, 100: 500, 365: 2000 };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de fecha (hora local del dispositivo)
// ─────────────────────────────────────────────────────────────────────────────
function todayAt(h, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
function tomorrowAt(h, m = 0) {
  const d = todayAt(h, m);
  d.setDate(d.getDate() + 1);
  return d;
}
function daysFromNowAt(days, h, m = 0) {
  const d = todayAt(h, m);
  d.setDate(d.getDate() + days);
  return d;
}
function nextSundayAt(h, m = 0) {
  const day = new Date().getDay(); // 0=Dom
  const daysUntil = day === 0 ? 7 : 7 - day;
  return daysFromNowAt(daysUntil, h, m);
}
function getNextMilestone(streak) {
  return MILESTONES.find(m => m > streak) ?? null;
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy por mascota — pools rotatorios (framing de pérdida + vínculo emocional)
// ─────────────────────────────────────────────────────────────────────────────

const COPY = {

  // ── Racha en riesgo (21:00) — la llama del tonalli está bajita ─────────────
  // Una sola, amable y sin culpa: la mascota nunca "se muere" por no jugar.
  streakRisk: {
    tecolote: (name, n) => [
      { title: `🦉 ${name} sigue despierto`,              body: `Su tonalli está bajito. ¿Una palabra antes de dormir? Van ${n} días.` },
      { title: `🔥 ${n} días de llama`,                    body: `${name} tiene el libro abierto. Dos minutos y la llama sigue viva.` },
    ],
    monarca: (name, n) => [
      { title: `🦋 ${name} bate las alas despacito`,       body: `Su llama está bajita. Un nivel y siguen ${n} días de viaje.` },
      { title: `🔥 ${n} días de llama`,                    body: `${name} quiere seguir volando contigo hoy. ¿Una palabra?` },
    ],
    ayotl: (name, n) => [
      { title: `🐢 ${name} te espera en la orilla`,        body: `Lenta pero segura: un nivel y siguen ${n} días de racha.` },
      { title: `🔥 ${n} días de llama`,                    body: `El tonalli de ${name} está bajito. Dos minutos bastan.` },
    ],
  },

  // ── Racha perdida (09:00 día siguiente) — nuevo comienzo, sin culpa ─────────
  streakLost: {
    tecolote: (name, n) => [
      { title: `🦉 ${name} se durmió`,                     body: `La llama se apagó, pero tu récord de ${n} días se queda. Hoy enciendes una nueva.` },
    ],
    monarca: (name, n) => [
      { title: `🦋 ${name} descansa en su hoja`,           body: `Tu récord de ${n} días sigue en tu perfil. ¿Encendemos una llama nueva?` },
    ],
    ayotl: (name, n) => [
      { title: `🐢 ${name} se durmió en la arena`,         body: `No pasa nada: tu récord de ${n} días se queda. Hoy empieza otra llama.` },
    ],
  },

  // ── Mascota hambrienta (36h sin jugar) ────────────────────────────────────────
  mascotHungry: {
    tecolote: (name) => [
      { title: `🦉 ${name} quiere leer contigo`,           body: `Tiene palabras nuevas guardadas para ti. Ven un ratito.` },
    ],
    monarca: (name) => [
      { title: `🦋 ${name} tiene hambre de palabras`,      body: `Aprende 3 modismos y dale de comer.` },
    ],
    ayotl: (name) => [
      { title: `🐢 ${name} te extraña`,                    body: `Sin prisa, pero sin pausa: ven a jugar una palabra.` },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────────────────────

export function setupNotificationHandler() {
  if (isExpoGo) return; // notifications not supported in Expo Go (SDK 53+)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
}

export async function requestPermission() {
  if (isExpoGo) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function _schedule(id, content, trigger) {
  if (isExpoGo) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { ...content, sound: true },
      trigger,
    });
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Canales individuales
// ─────────────────────────────────────────────────────────────────────────────

// 1. Racha en riesgo — 21:00 local (si ya pasó, mañana 21:00)
async function _scheduleStreakRisk(streak, petName, petType) {
  if (streak <= 0) return;
  const type = normalizePetType(petType) in COPY.streakRisk ? normalizePetType(petType) : DEFAULT_PET_TYPE;
  const msg  = pickRandom(COPY.streakRisk[type](petName || 'Tu mascota', streak));
  let   fire = todayAt(21, 0);
  if (fire <= new Date()) fire = tomorrowAt(21, 0);
  await _schedule(NOTIF_IDS.streakRisk, msg, { date: fire });
}

// 2. Racha perdida — mañana 09:00
//    Se cancela si el usuario juega antes de medianoche.
async function _scheduleStreakLost(streak, petName, petType) {
  if (streak <= 0) return;
  const type = normalizePetType(petType) in COPY.streakLost ? normalizePetType(petType) : DEFAULT_PET_TYPE;
  const msg  = pickRandom(COPY.streakLost[type](petName || 'Tu mascota', streak));
  await _schedule(NOTIF_IDS.streakLost, msg, { date: tomorrowAt(9, 0) });
}

// 3. Víspera de hito — noche antes del próximo milestone a las 20:00
async function _scheduleMilestoneEve(streak) {
  const next = getNextMilestone(streak);
  if (!next) return;
  const daysLeft = next - streak; // días hasta el hito
  if (daysLeft <= 0 || daysLeft > 7) return; // demasiado lejos; se reprograma en siguientes sesiones
  const gems   = MILESTONE_GEMS[next] ?? 0;
  const eveDays = daysLeft - 1; // días hasta la víspera
  let fire;
  if (eveDays === 0) {
    fire = todayAt(20, 0);
    if (fire <= new Date()) return; // ya pasó hoy
  } else {
    fire = daysFromNowAt(eveDays, 20, 0);
  }
  await _schedule(NOTIF_IDS.milestoneEve, {
    title: `🔥 ¡Mañana cumples ${next} días de racha!`,
    body:  `💎 ${gems} diamantes te esperan. Una sesión más, cuate. ¡No pares!`,
  }, { date: fire });
}

// 4. Mascota hambrienta — 36h desde ahora
async function _scheduleMascotHungry(petName, petType) {
  const type = normalizePetType(petType) in COPY.mascotHungry ? normalizePetType(petType) : DEFAULT_PET_TYPE;
  const msg  = pickRandom(COPY.mascotHungry[type](petName || 'Tu mascota'));
  const fire = new Date(Date.now() + 36 * 60 * 60 * 1000);
  await _schedule(NOTIF_IDS.mascotHungry, msg, { date: fire });
}

// 5. Misiones nuevas — mañana 08:00
async function _scheduleMissionsReset() {
  await _schedule(NOTIF_IDS.missionsReset, {
    title: '🎯 Nuevas misiones del día',
    body:  'Una incluye 💎 diamantes. Solo duran 24 horas. ¡Ándale cuate!',
  }, { date: tomorrowAt(8, 0) });
}

// ─────────────────────────────────────────────────────────────────────────────
// Canales externos (llamados desde otros componentes)
// ─────────────────────────────────────────────────────────────────────────────

// 6. Ruleta lista — exactamente 24h después del spin
export async function scheduleWheelReady() {
  const fire = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await _schedule(NOTIF_IDS.wheelReady, {
    title: '🎡 Tu ruleta del día está lista',
    body:  'Podría ser 💎 diamantes. Gratis. ¿Le entras?',
  }, { date: fire });
}

// 7. Drama de liga — próximo domingo 19:00
//    rank: posición actual, divisionName: "Jade", "Tonatiuh", etc.
export async function scheduleLeagueDrama(rank, divisionName) {
  if (!rank || !divisionName) return;
  const fire = nextSundayAt(19, 0);
  if (fire <= new Date()) return; // safety: no schedules en el pasado

  const inSafeZone = rank <= 5;
  const msg = inSafeZone
    ? {
        title: `⚔️ Liga ${divisionName}: ¡zona de ascenso!`,
        body:  `Estás en el puesto #${rank}. Quedan horas. Defiende tu posición.`,
      }
    : {
        title: `⚔️ Liga ${divisionName}: zona de peligro`,
        body:  `Puesto #${rank}. Los últimos descienden esta noche. ¿Te quedas quieto?`,
      };
  await _schedule(NOTIF_IDS.leagueDrama, msg, { date: fire });
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancelar todo (llamar cuando el usuario juega)
// ─────────────────────────────────────────────────────────────────────────────
export async function cancelAllReminders() {
  if (isExpoGo) return;
  await Promise.allSettled(
    Object.values(NOTIF_IDS).map(id =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// rescheduleAfterPlay — punto de entrada principal
// Llamar cada vez que el usuario completa una palabra.
//
// Parámetros:
//   streakDays  — racha actual (ya actualizada)
//   petName     — nombre del pet del usuario
//   petType     — 'tecolote' | 'monarca' | 'ayotl' (acepta los tipos anteriores)
// ─────────────────────────────────────────────────────────────────────────────
export async function rescheduleAfterPlay({ streakDays, petName, petType }) {
  await cancelAllReminders();

  const type = normalizePetType(petType);
  const name = normalizePetName(petName, petType);

  if (streakDays > 0) {
    await _scheduleStreakRisk(streakDays, name, type);
    await _scheduleStreakLost(streakDays, name, type);
    await _scheduleMilestoneEve(streakDays);
  }

  await _scheduleMascotHungry(name, type);
  await _scheduleMissionsReset();
}
