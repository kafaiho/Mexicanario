/**
 * Posiciones y zonas de un grupo de la liga. La usan tanto la pantalla
 * (getLeagueStatus) como el cierre semanal (processWeekEnd), para que lo que el
 * jugador ve durante la semana sea exactamente lo que pasa el lunes.
 */

export const PROMO_PCT = 0.2;      // el 20% de arriba asciende
export const DEMO_PCT = 0.2;       // el 20% de abajo desciende
export const PROMO_MIN_CXP = 200;  // cXP mínimos de la semana para poder ascender
export const SAFE_MIN_CXP = 50;    // con menos de esto se baja sin importar el lugar
export const MAX_DIVISION = 10;

export type LeagueZone = "promotion" | "safe" | "demotion";

export type StandingPlayer = {
  cxpTotal: number;
  wordsThisWeek: number;
  lastCompletionAt?: number;
  createdAt?: number;
};

/**
 * Orden del grupo: más cXP, luego más palabras y, si siguen empatados, gana quien
 * llegó primero a esa marca (antes el empate quedaba al azar y la posición podía
 * cambiar entre lo que se veía y el resultado del lunes).
 */
export function compareStanding(a: StandingPlayer, b: StandingPlayer): number {
  return (
    b.cxpTotal - a.cxpTotal
    || b.wordsThisWeek - a.wordsThisWeek
    || (a.lastCompletionAt ?? Number.MAX_SAFE_INTEGER) - (b.lastCompletionAt ?? Number.MAX_SAFE_INTEGER)
    || (a.createdAt ?? 0) - (b.createdAt ?? 0)
  );
}

/**
 * Cuántos lugares asciende y desciende un grupo según su tamaño. En grupos chicos
 * el 20% redondeado hacia arriba castigaba de más: con dos jugadores el segundo
 * siempre bajaba. Ahora se protege a los grupos pequeños y la inactividad
 * (menos de SAFE_MIN_CXP) sigue bajando en cualquier grupo.
 */
export function zoneSizes(total: number): { promoCount: number; demoCount: number } {
  if (total <= 0) return { promoCount: 0, demoCount: 0 };
  const promoCount = Math.max(1, Math.ceil(total * PROMO_PCT));
  const demoCount = total >= 10 ? Math.ceil(total * DEMO_PCT) : total >= 5 ? 1 : 0;
  return { promoCount, demoCount };
}

export function zoneFor(rank: number, total: number, cxpTotal: number, division: number): LeagueZone {
  const { promoCount, demoCount } = zoneSizes(total);
  if (rank <= promoCount && cxpTotal >= PROMO_MIN_CXP && division < MAX_DIVISION) return "promotion";
  if ((rank > total - demoCount || cxpTotal < SAFE_MIN_CXP) && division > 1) return "demotion";
  return "safe";
}

/** Ordena el grupo y le pone a cada jugador su lugar y su zona. */
export function rankGroup<T extends StandingPlayer>(players: T[], division: number) {
  const sorted = [...players].sort(compareStanding);
  const total = sorted.length;
  return sorted.map((player, index) => ({
    player,
    rank: index + 1,
    zone: zoneFor(index + 1, total, player.cxpTotal, division),
  }));
}

/**
 * cXP que le faltan a un jugador para entrar a la zona de ascenso o para salir de
 * la de descenso, contando el desempate (a igualdad de cXP gana quien llegó
 * antes, así que hace falta 1 más). null cuando no aplica.
 */
export function cxpGaps<T extends StandingPlayer>(ranked: Array<{ player: T; rank: number; zone: LeagueZone }>, me: T, division: number) {
  const total = ranked.length;
  const { promoCount, demoCount } = zoneSizes(total);
  const mine = ranked.find((entry) => entry.player === me);
  if (!mine) return { toPromotion: null, toSafety: null };

  let toPromotion: number | null = null;
  if (division < MAX_DIVISION && mine.zone !== "promotion") {
    const boundary = ranked[promoCount - 1];
    const needByRank = mine.rank <= promoCount ? 0 : boundary.player.cxpTotal - me.cxpTotal + 1;
    toPromotion = Math.max(needByRank, PROMO_MIN_CXP - me.cxpTotal, 0);
  }

  let toSafety: number | null = null;
  if (division > 1 && mine.zone === "demotion") {
    const lastSafe = ranked[total - demoCount - 1];
    const needByRank = demoCount > 0 && mine.rank > total - demoCount && lastSafe
      ? lastSafe.player.cxpTotal - me.cxpTotal + 1
      : 0;
    toSafety = Math.max(needByRank, SAFE_MIN_CXP - me.cxpTotal, 0);
  }
  return { toPromotion, toSafety };
}
