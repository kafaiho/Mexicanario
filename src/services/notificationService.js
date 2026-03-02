import * as Notifications from 'expo-notifications';

// Fixed identifiers so we can cancel by type
const NOTIF_IDS = {
  streak: 'streak-daily-reminder',
  mascot: 'mascot-misses-you',
};

// Configure how notifications appear while the app is in the foreground
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Ask for permission (call at a high-momentum moment, e.g. streak >= 3)
export async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Check permission without prompting the user
export async function hasPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Schedule the streak reminder for 22:00 today; if already past, schedules for tomorrow
export async function scheduleStreakReminder(streakDays) {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_IDS.streak).catch(() => {});

  const now = new Date();
  const trigger = new Date();
  trigger.setHours(22, 0, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1); // tomorrow 22:00
  }

  const messages = [
    {
      title: '🔥 ¡Tu racha te necesita!',
      body: `Llevas ${streakDays} día${streakDays > 1 ? 's' : ''} seguidos. ¡No la rompas hoy!`,
    },
    {
      title: '🌮 ¿Ya aprendiste hoy?',
      body: `Tu racha de ${streakDays} días depende de ti.`,
    },
    {
      title: '¡Órale! No te me rajes 🤠',
      body: `${streakDays} días de racha en juego. Entra y aprende algo chido.`,
    },
  ];
  const msg = messages[streakDays % messages.length];

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.streak,
    content: { title: msg.title, body: msg.body, sound: true },
    trigger: { date: trigger },
  });
}

// Schedule "mascota misses you" — fires 24 hours from now
export async function scheduleMascotReminder(petName) {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_IDS.mascot).catch(() => {});

  const name = petName || 'tu mascota';
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.mascot,
    content: {
      title: `${name} te extraña 🦎`,
      body: '¡Vuelve a jugar y fortalece su vínculo!',
      sound: true,
    },
    trigger: { seconds: 86400 }, // 24 hours
  });
}

// Cancel all pending reminders (call when the user plays today)
export async function cancelAllReminders() {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_IDS.streak).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(NOTIF_IDS.mascot).catch(() => {});
}

// Re-schedule everything after the user completes a word
// streakDays: current streak, petName: pet's display name
export async function rescheduleAfterPlay(streakDays, petName) {
  await cancelAllReminders();
  if (streakDays > 0) await scheduleStreakReminder(streakDays);
  await scheduleMascotReminder(petName);
}
