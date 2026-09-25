/**
 * Semana ISO (lunes a domingo) como "2026-W39", a partir de una fecha cuya hora
 * local ya representa la hora del centro de México (ver nowCST en cada módulo).
 *
 * Antes cada módulo contaba días desde el 4 de enero; en 2026 eso hacía que la
 * semana cambiara en jueves mientras la liga cierra en lunes. Todos los módulos
 * (liga, rankings, XP semanal, cuates) deben usar esta misma función.
 * La app tiene una copia en src/screens/LeaderboardScreen.jsx (weekId.test.ts las compara).
 */
export function isoWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // lunes = 1 … domingo = 7
  d.setUTCDate(d.getUTCDate() + 4 - day); // el jueves de esa semana decide el año ISO
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
