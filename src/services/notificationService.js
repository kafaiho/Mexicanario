import * as Notifications from 'expo-notifications';

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

  // ── Racha en riesgo (21:00) ─────────────────────────────────────────────────
  streakRisk: {
    ajolote: (name, n) => [
      { title: `🦎 ${name} lleva horas esperándote`,    body: `${n} días de racha. Se rompen a medianoche. ¿Los tiras?` },
      { title: `🦎 ${name} está inquieto esta noche`,   body: `Tu ajolote no puede dormir. La racha de ${n} días depende de ti.` },
      { title: `🌮 ¡Órale! Queda poco tiempo`,          body: `${name} pide que no te rajas. ${n} días en juego ahora mismo.` },
    ],
    xolo: (name, n) => [
      { title: `🐕 ${name} ladra bajito en la esquina`, body: `${n} días de racha a punto de romperse. No lo dejes plantado.` },
      { title: `🐕 ${name} está en la puerta`,          body: `Tu xolo espera. ${n} días. La medianoche se acerca rápido.` },
      { title: `🌮 ¡No te me rajes, cuate!`,            body: `${name} dice que aún hay tiempo. Salva los ${n} días.` },
    ],
    alebrije: (name, n) => [
      { title: `🌈 ${name} perdió colores de tristeza`, body: `La racha de ${n} días muere a medianoche. Vuélvele los colores.` },
      { title: `🌈 ${name} soñó que te perdía`,        body: `${n} días en juego. Tu alebrije dice que no pares ahora.` },
      { title: `🌮 La racha te necesita esta noche`,    body: `${name} espera. ${n} días. Solo toma 2 minutos. ¡Ándale!` },
    ],
  },

  // ── Racha perdida (09:00 día siguiente) ──────────────────────────────────────
  streakLost: {
    ajolote: (name, n) => [
      { title: `💔 Se rompió. ${n} días perdidos`,      body: `${name} no te culpa. Hoy empieza de cero, y esta vez sin excusas.` },
      { title: `🦎 ${name} sigue ahí, esperándote`,     body: `La racha cayó, pero tu ajolote no se rindió. ¿Y tú?` },
    ],
    xolo: (name, n) => [
      { title: `💔 ${n} días de racha se fueron`,       body: `${name} te perdonó. Dice que hoy es el día uno de algo mejor.` },
      { title: `🐕 ${name} sigue fiel en casa`,         body: `La racha se fue. Pero tu xolo no se rinde. No le falles hoy.` },
    ],
    alebrije: (name, n) => [
      { title: `💔 ${n} días. Se acabó la racha`,       body: `${name} está triste. Pero los alebrijes siempre renacen. Tú también.` },
      { title: `🌈 ${name} necesita tus colores`,       body: `La racha cayó. Tu alebrije espera el primer día de la próxima.` },
    ],
  },

  // ── Mascota hambrienta (36h sin jugar) ────────────────────────────────────────
  mascotHungry: {
    ajolote: (name) => [
      { title: `😢 ${name} tiene hambre`,               body: `Tu ajolote lleva días sin aprender modismos. Aprende 3 y aliméntalo.` },
      { title: `🦎 ${name} te extraña mucho`,           body: `Han pasado muchas horas. Tu ajolote espera que vuelvas.` },
    ],
    xolo: (name) => [
      { title: `🐕 ${name} está echado y solo`,         body: `Tu xolo no ha comido modismos en días. Ven a jugar un rato.` },
      { title: `😢 ${name} ladra sin que nadie escuche`,body: `No te ha visto en mucho tiempo. Vuelve y enséñale algo chido.` },
    ],
    alebrije: (name) => [
      { title: `🌈 ${name} perdió sus colores`,         body: `Tu alebrije se apaga sin ti. Vuelve y aprende algo hoy.` },
      { title: `😢 ${name} necesita brillar de nuevo`,  body: `Muchas horas sin modismos. Tu alebrije espera que lo despiertes.` },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────────────────────

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
}

export async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function _schedule(id, content, trigger) {
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
  const type = petType in COPY.streakRisk ? petType : 'ajolote';
  const msg  = pickRandom(COPY.streakRisk[type](petName || 'Tu mascota', streak));
  let   fire = todayAt(21, 0);
  if (fire <= new Date()) fire = tomorrowAt(21, 0);
  await _schedule(NOTIF_IDS.streakRisk, msg, { date: fire });
}

// 2. Racha perdida — mañana 09:00
//    Se cancela si el usuario juega antes de medianoche.
async function _scheduleStreakLost(streak, petName, petType) {
  if (streak <= 0) return;
  const type = petType in COPY.streakLost ? petType : 'ajolote';
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
  const type = petType in COPY.mascotHungry ? petType : 'ajolote';
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
//   petType     — 'ajolote' | 'xolo' | 'alebrije'
// ─────────────────────────────────────────────────────────────────────────────
export async function rescheduleAfterPlay({ streakDays, petName, petType }) {
  await cancelAllReminders();

  const name = petName || 'Tu mascota';
  const type = petType || 'ajolote';

  if (streakDays > 0) {
    await _scheduleStreakRisk(streakDays, name, type);
    await _scheduleStreakLost(streakDays, name, type);
    await _scheduleMilestoneEve(streakDays);
  }

  await _scheduleMascotHungry(name, type);
  await _scheduleMissionsReset();
}
