/**
 * seedAdultWords — inserta 50 palabras del vocabulario adulto mexicano:
 *   25 "Insultos Finos"          (pack: "insultos")
 *   25 "Diccionario de la Suegra" (pack: "suegra")
 *
 * Crea también sus registros en la tabla `levels` con levelNumbers
 * consecutivos a partir del mayor existente. Es idempotente.
 *
 * Ejecutar desde el dashboard de Convex: api.seedAdultWords.seedAdultWords
 */

import { mutation } from "./_generated/server";

// ── Palabras — Insultos Finos ─────────────────────────────────────────────────

const INSULTOS: { word: string; meaning: string; example: string; region: string }[] = [
  { word: "Cabrón",        meaning: "Sinvergüenza o astuto; también apelativo afectivo entre amigos según el tono", example: "Ese cabrón ganó la lotería y ni avisó", region: "Todo México" },
  { word: "Pinche",        meaning: "Adjetivo despectivo que denota pequeñez, mezquindad o mala calidad", example: "Este pinche coche no arranca ni a jalones", region: "Todo México" },
  { word: "Culero",        meaning: "Cobarde que evita el peligro; también persona mezquina o sin escrúpulos", example: "No seas culero y admite que tú lo rompiste", region: "Todo México" },
  { word: "Mamón",         meaning: "Persona presumida y engreída que se cree superior a los demás", example: "Llegó de la Ibero y ya se puso bien mamón", region: "Todo México" },
  { word: "Chingadera",    meaning: "Objeto, asunto o situación sin valor ni importancia alguna", example: "No me vengas con chingaderas a estas horas", region: "Todo México" },
  { word: "Pendejo",       meaning: "Persona ingenua, tonta o que actúa sin pensar las consecuencias", example: "Fui pendejo y firmé sin leer el contrato", region: "Todo México" },
  { word: "Güey",          meaning: "Término que puede significar amigo o tonto según el tono y el contexto", example: "Oye güey, ¿a qué hora llegamos?", region: "CDMX" },
  { word: "Verga",         meaning: "Interjección de asombro, rechazo o coraje; muy versátil en el español mexicano", example: "¡Verga! Se me olvidó el examen", region: "Todo México" },
  { word: "Putiza",        meaning: "Golpiza contundente y humillante; también derrota aplastante en cualquier ámbito", example: "Les dimos una putiza en el torneo de fútbol", region: "Todo México" },
  { word: "Chingón",       meaning: "Persona o cosa extraordinaria, de altísima calidad o habilidad", example: "Mi tío es un chingón para la cocina", region: "Todo México" },
  { word: "Ojete",         meaning: "Persona egoísta, desalmada o sin ningún escrúpulo moral", example: "Qué ojete, se fue sin pagar su parte", region: "Todo México" },
  { word: "Menso",         meaning: "Tonto, bobo, que no comprende cosas simples o actúa sin lógica", example: "No seas menso, la respuesta está en la primera página", region: "Todo México" },
  { word: "Tarado",        meaning: "Idiota o persona con actitud torpe y absolutamente sin sentido", example: "Eres un tarado, ¿quién hace eso?", region: "Todo México" },
  { word: "Fregón",        meaning: "Persona muy capaz y destacada; también mandón o difícil de tratar", example: "Es bien fregón para las matemáticas", region: "Todo México" },
  { word: "Encabronado",   meaning: "Estado de enojo intenso, indignación y coraje acumulado al límite", example: "Llegó encabronado porque le cerraron el paso en el Periférico", region: "Todo México" },
  { word: "Chingaquedito", meaning: "Persona que actúa con malicia aparentando inocencia y discreción", example: "Ese chingaquedito le contó todo al jefe sin que se notara", region: "Todo México" },
  { word: "Mamadas",       meaning: "Tonterías, mentiras o cosas completamente sin fundamento real", example: "No me vengas con mamadas, sé perfectamente lo que pasó", region: "Todo México" },
  { word: "Puto",          meaning: "Cobarde de la peor especie; insulto de alta intensidad en contextos de enojo", example: "Ese equipo está lleno de putos, nunca arriesgan", region: "Todo México" },
  { word: "Cabroneada",    meaning: "Traición o acción deshonesta propia de alguien sin palabra ni honor", example: "Fue una cabroneada prestarse para eso", region: "Todo México" },
  { word: "Desgraciado",   meaning: "Malvado o persona que actúa sin honor ni vergüenza alguna", example: "El desgraciado me debe tres meses de renta", region: "Todo México" },
  { word: "Buey sin cachos", meaning: "Persona extremadamente tonta y fácil de engañar sin darse cuenta", example: "Le vendieron el coche inundado, quedó como buey sin cachos", region: "Norte" },
  { word: "Sangrón",       meaning: "Persona antipática, presumida y desagradable en el trato cotidiano", example: "Su novio es un sangrón, no saluda a nadie", region: "Todo México" },
  { word: "Lambiscón",     meaning: "Adulador servil que hace todo para quedar bien con el superior", example: "El lambiscón del trabajo ya le llevó café tres veces hoy", region: "Todo México" },
  { word: "Mitotero",      meaning: "Persona chismosa que exagera y dramatiza todo lo que cuenta", example: "No le cuentes nada, es un mitotero de primer nivel", region: "Todo México" },
  { word: "Cagada",        meaning: "Error grave o situación vergonzosa producida por un descuido propio", example: "Fue una cagada mandar ese mensaje al grupo equivocado", region: "Todo México" },
];

// ── Palabras — Diccionario de la Suegra ──────────────────────────────────────

const SUEGRA: { word: string; meaning: string; example: string; region: string }[] = [
  { word: "Ni modo",              meaning: "Resignación pasivo-agresiva ante una situación que no se aprueba para nada", example: "Ni modo, ustedes ya decidieron… yo no digo nada", region: "Todo México" },
  { word: "En mi tiempo",         meaning: "Introducción a una comparación desfavorable con el presente inmediato", example: "En mi tiempo los hijos llegaban antes de las diez", region: "Todo México" },
  { word: "Así lo criaron",       meaning: "Crítica velada dirigida a la familia de origen de la pareja del hijo", example: "Así lo criaron, ¿qué le vamos a hacer?", region: "Todo México" },
  { word: "Como quieras",         meaning: "Desacuerdo radical disfrazado de falsa aceptación resignada y teatral", example: "Como quieras, tú eres el que manda… supuestamente", region: "Todo México" },
  { word: "Yo no me meto",        meaning: "Declaración previa a intervenir en absolutamente todo lo que ocurre", example: "Yo no me meto, pero eso que compraron no sirve para nada", region: "Todo México" },
  { word: "No digo nada",         meaning: "Prolegómeno inevitable de una crítica exhaustiva, detallada e implacable", example: "No digo nada, pero a mí nunca me queda tan salado el arroz", region: "Todo México" },
  { word: "Pobrecito mi hijo",    meaning: "Sobreprotección extrema que victimiza al hijo adulto ante toda la familia", example: "Pobrecito mi hijo, tanto que trabaja y llega a comer esto", region: "Todo México" },
  { word: "Así hacía yo",         meaning: "Estándar imposible que establece como única referencia válida de toda la historia", example: "Así hacía yo la sopa y nunca se le quemaba a nadie nunca", region: "Todo México" },
  { word: "Ya mero",              meaning: "Evasiva indefinida para aplazar o no dar jamás una respuesta directa", example: "Ya mero termino de opinar, un momentito más solamente", region: "Todo México" },
  { word: "Mi casa, mis reglas",  meaning: "Autoritarismo territorial ejercido sobre adultos casados con total impunidad", example: "Mientras estén en mi casa, mis reglas. Punto final", region: "Todo México" },
  { word: "Haz lo que quieras",   meaning: "Permiso condicionado cargado de enorme peso emocional implícito e invisible", example: "Haz lo que quieras… ya ni para qué opino si no me hacen caso", region: "Todo México" },
  { word: "Tan guapo que era",    meaning: "Comparación nostálgica del estado físico anterior del hijo antes del matrimonio", example: "Tan guapo que estaba mi hijo antes de casarse, qué tiempos", region: "Todo México" },
  { word: "Para eso son los hijos", meaning: "Frase que antecede una petición grande, urgente y emocionalmente incómoda", example: "Para eso son los hijos, ¿no? Necesito que me lleven al médico hoy", region: "Todo México" },
  { word: "Tú sabrás",            meaning: "Responsabilización del otro acompañada de desaprobación tácita e invisible", example: "Tú sabrás si comes eso a estas horas… tú sabrás lo que haces", region: "Todo México" },
  { word: "Con lo que yo sé",     meaning: "Amenaza velada de información comprometedora guardada cuidadosamente en reserva", example: "Con lo que yo sé, podría decir muchas cosas, pero me callo por ahora", region: "Todo México" },
  { word: "Algo se le olvidó decirme", meaning: "Ironía ante información que deliberadamente no fue compartida a propósito", example: "Algo se le olvidó decirme sobre la reunión de hoy, ¿verdad?", region: "Todo México" },
  { word: "¿Cuándo me dan nietos?", meaning: "Presión reproductiva repetitiva, inoportuna y absolutamente sin límites conocidos", example: "¿Y para cuándo me dan nietos? Ya van cinco años juntos", region: "Todo México" },
  { word: "Yo me ando calladita", meaning: "Declaración de silencio que inaugura un comentario extenso e imparable", example: "Yo me ando calladita, pero esa decoración está horrible la verdad", region: "Todo México" },
  { word: "Llámame cuando lleguen", meaning: "Control de horarios disfrazado de preocupación afectiva materna sin límites", example: "Llámame cuando lleguen, a cualquier hora que sea, no importa", region: "Todo México" },
  { word: "No está para niños",   meaning: "Exclusión de conversaciones importantes con adultos perfectamente presentes", example: "Esto no está para niños, vayan a jugar afuera un momento", region: "Todo México" },
  { word: "Qué bueno que viniste", meaning: "Bienvenida que en realidad es reproche sutil por no haber venido antes", example: "Qué bueno que viniste, ya teníamos tres semanas sin verte", region: "Todo México" },
  { word: "A mi hijo no le gustaba", meaning: "Recordatorio de preferencias antiguas del hijo que ya no aplican hoy", example: "A mi hijo no le gustaba el picante antes de conocerte a ti", region: "Todo México" },
  { word: "Yo no soy nadie aquí", meaning: "Victimización dramática para recuperar atención y control de la situación", example: "Yo no soy nadie aquí, hagan lo que quieran sin consultarme", region: "Todo México" },
  { word: "Bueno, me voy",        meaning: "Amago de retirada que espera súplicas entusiastas para quedarse más tiempo", example: "Bueno, me voy… no quiero estorbar… si me necesitan, aquí estoy", region: "Todo México" },
  { word: "No te lo tomes a mal", meaning: "Prefacio que anuncia un comentario que definitivamente se tomará muy mal", example: "No te lo tomes a mal, pero ese corte de pelo no te favorece nada", region: "Todo México" },
];

// ── Helper compartido: siembra palabras de un pack si no existen ─────────────

export async function ensureAdultPack(ctx: any, pack: "insultos" | "suegra") {
  const words = pack === "insultos" ? INSULTOS : SUEGRA;
  const existing = await ctx.db.query("words").collect();
  const existingSet = new Set(existing.map((w: any) => w.word.toLowerCase()));
  const allLevels = await ctx.db.query("levels").collect();
  let maxLevelNumber = allLevels.reduce((max: number, l: any) => Math.max(max, l.levelNumber), 0);

  let added = 0;
  for (const entry of words) {
    if (!existingSet.has(entry.word.toLowerCase())) {
      const wordId = await ctx.db.insert("words", { ...entry, category: "adulto", pack });
      existingSet.add(entry.word.toLowerCase());
      maxLevelNumber++;
      await ctx.db.insert("levels", { levelNumber: maxLevelNumber, wordId, reward: { coins: 60, diamonds: 0 } });
      added++;
    }
  }
  return added;
}

// ── Mutation principal ────────────────────────────────────────────────────────

export const seedAdultWords = mutation({
  handler: async (ctx) => {
    // Obtener palabras existentes para idempotencia
    const existingWords = await ctx.db.query("words").collect();
    const existingSet = new Set(existingWords.map((w) => w.word.toLowerCase()));

    // Obtener el mayor levelNumber actual para appendar después
    const allLevels = await ctx.db.query("levels").collect();
    let maxLevelNumber = allLevels.reduce((max, l) => Math.max(max, l.levelNumber), 0);

    let wordsAdded = 0;
    let levelsAdded = 0;

    // Insertar insultos
    for (const entry of INSULTOS) {
      if (!existingSet.has(entry.word.toLowerCase())) {
        const wordId = await ctx.db.insert("words", {
          ...entry,
          category: "adulto",
          pack: "insultos",
        } as any);
        existingSet.add(entry.word.toLowerCase());
        wordsAdded++;

        // Crear nivel correspondiente
        maxLevelNumber++;
        await ctx.db.insert("levels", {
          levelNumber: maxLevelNumber,
          wordId,
          reward: { coins: 60, diamonds: 0 },
        });
        levelsAdded++;
      }
    }

    // Insertar suegra
    for (const entry of SUEGRA) {
      if (!existingSet.has(entry.word.toLowerCase())) {
        const wordId = await ctx.db.insert("words", {
          ...entry,
          category: "adulto",
          pack: "suegra",
        } as any);
        existingSet.add(entry.word.toLowerCase());
        wordsAdded++;

        maxLevelNumber++;
        await ctx.db.insert("levels", {
          levelNumber: maxLevelNumber,
          wordId,
          reward: { coins: 60, diamonds: 0 },
        });
        levelsAdded++;
      }
    }

    return { wordsAdded, levelsAdded, finalMaxLevel: maxLevelNumber };
  },
});
