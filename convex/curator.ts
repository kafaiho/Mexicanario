/**
 * 🤖 Curador de Contenido Cultural — Mexicanario
 *
 * Módulos:
 *  1. Scraper       — Google Trends MX (tendencias diarias, miércoles 08:05 UTC)
 *  1b. SEED_QUEUE   — términos culturales curados manualmente
 *  2. Validador IP  — blacklist de nombres problemáticos sin contexto cultural
 *  3. Generador IA  — Gemini Flash genera: meaning, example, region, category, difficulty
 *  4. Staging       — inserta en wordCandidates (status: "pending"), nunca directo a producción
 *
 * Flujos automáticos:
 *   Lunes 08:05 UTC   → processSeedQueue (términos curados del SEED_QUEUE)
 *   Miércoles 08:05 UTC → processTrends  (tendencias Google MX del día)
 *
 * Flujo de aprobación (tú, desde Convex Dashboard):
 *   listPending → approveCandidate | rejectCandidate
 *
 * Setup:
 *   En Convex Dashboard > Settings > Environment Variables:
 *   GEMINI_API_KEY = AIzaSyBs79QYjY-1bjXf0PA0HvycnFV1oDMNa0o
 */

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, mutation, query, internalMutation, internalAction } from "./_generated/server";
import { insertNewLevel } from "./levelWrites";

// ─── Módulo 1: Descubridor de Tendencias MX via Gemini ───────────────────────
// En lugar de scraping (APIs de Google/Twitter bloqueadas desde servidores),
// usamos Gemini para sugerir términos culturales mexicanos recientes/virales
// que no están aún en nuestra base de datos.

async function discoverTrendsMX(existingKeys: Set<string>): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  // Le pasamos una muestra de términos existentes para que no repita
  const sampleExisting = Array.from(existingKeys).slice(0, 30).join(", ");

  const prompt =
    `You are an expert in Mexican internet culture, slang, and viral content from 2023-2025. ` +
    `Suggest 12 Mexican cultural/slang terms that have gone viral or become popular recently. ` +
    `Focus on: viral memes, new slang, streamers/youtubers/tiktokers names, corridos tumbados artists, ` +
    `food trends, new expressions from CDMX barrios, Gen Z slang. ` +
    `Do NOT include: politics, news events, sports scores, prices, deaths. ` +
    `Terms already in our database (skip these): ${sampleExisting}. ` +
    `Reply ONLY with a JSON array of uppercase strings, max 3 words each. ` +
    `Example: ["ANDRÉS WIESE","PESO PLUMA","TACO DE CANASTA","CHALE GÜEY"]. ` +
    `JSON array only, no explanation.`;

  let data: any;
  // Retry up to 3 times on 503
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 5000 * attempt));
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
          }),
        }
      );
    } catch (e: any) {
      console.error("[Discover] fetch failed:", e.message);
      continue;
    }
    if (!response.ok && response.status !== 200) {
      console.error("[Discover] HTTP", response.status);
      if (response.status === 503 || response.status === 429) continue; // retry
      return [];
    }
    let parsed: any;
    try { parsed = await response.json(); } catch { return []; }
    // Gemini returns 200 with {"error":{code:503}} when overloaded
    if (parsed?.error?.code === 503 || parsed?.error?.code === 429) {
      console.warn("[Discover] Gemini body error", parsed.error.code, "reintentando...");
      continue;
    }
    data = parsed;
    break;
  }
  if (!data) return [];

  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!raw) return [];

  try {
    const cleaned = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t: any) => typeof t === "string" && t.length > 1)
      .map((t: string) => t.toUpperCase().trim())
      .filter((t: string) => !existingKeys.has(t))
      .slice(0, 12);
  } catch (e: any) {
    console.error("[Discover] parse failed:", e.message, "raw:", raw.slice(0, 100));
    return [];
  }
}

// ─── Módulo 1b: Seed Queue (curado manualmente) ──────────────────────────────
// Agrega aquí nuevos términos cada semana. El agente los procesa en orden,
// saltando los que ya existan en words o wordCandidates.
const SEED_QUEUE: string[] = [
  // ── Expresiones cotidianas
  "ÓRALE WERO", "A TODA MADRE", "NI MODO", "FERIA", "VARO",
  "ENCUERADO", "ACHICOPALADO", "CAÑERO", "ESTAR CAÑÓN", "SACAR EL QUITE",
  "QUEDAR A DEBER", "LIMOSNEAR", "CURADO", "JALAR PAREJO", "DAR EL AVIÓN",
  "PONERSE CHIDO", "ESTAR EN CHINGA", "AL CHILE", "A GÜEVO", "PURA PAJA",
  // ── Comida / Bebida
  "GORDITA DE CHICHARRÓN", "ENCHILADA SUIZA", "CEMITA POBLANA",
  "PICOSITO", "TOSTADA DE CEVICHE", "AGUA DE CHÍA", "AGUAS FRESCAS",
  "MICHELADA CON CLAMATO", "CURADO DE PULQUE", "TEPACHE DE PIÑA",
  "CHORREADA", "CHALUPA POBLANA", "TLACOYOS", "ENFRIJOLADA",
  // ── Cultura popular / Comedia
  // Nota: HOLA SOY GERMAN removido — Germán Garmendia es chileno (Copiapó), no mexicano
  "BROZO", "XAVIER LOPEZ",
  "NO ME HAGAS REIR", "MAMES WEY", "PARA EL CHISME",
  "ÑOÑO", "HACER SHOW", "ESTAR EN EL SHOW",
  // ── Refranes y dichos
  "EL QUE SE MUEVE NO SALE EN LA FOTO", "CHANGO VIEJO NO APRENDE MAROMA",
  "AL NOPAL LO VAN A VER SOLO CUANDO TIENE TUNAS",
  "QUERER ES PODER", "NO HAY PIOR LUCHA QUE LA QUE NO SE HACE",
  "AL QUE LE CAIGA EL GUANTE", "TANTO PEDO PARA CAGAR AGUADO",
  // ── Tradiciones y festividades
  "ALTAR DE MUERTOS", "FLOR DE CEMPASÚCHIL", "CALAVERA LITERARIA",
  "POSADA NAVIDEÑA", "PIÑATA DE SIETE PICOS", "QUEMA DE JUDAS",
  "NOCHE DE RÁBANOS", "FERIA DEL MOLE", "FESTIVAL DE LA LUZ",
  // ── Regionalismos mexicanos
  "POCHISMO", "POCHO",
  // Nota: CHILERO, PISTO CHAPÍN, CHIBOLA, CHERO, BOLO, CIPOTE son guatemaltecos/centroamericanos — no mexicanos
  // ── Música y entretenimiento
  "CORRIDO TUMBADO", "SAD SIERREÑO", "TRAP MEXICANO",
  "CUMBIA SONIDERA", "TECNO BANDA", "DURANGUENSE",
  "HUAPANGO ARRIBEÑO", "SON DE LA NEGRA",
  // ── Historia y civilizaciones
  "TOLTECA", "OLMECA", "ZAPOTECA", "MAYA YUCATECO",
  "HUICHOL", "TOTONACA", "OTOMÍ", "MIXTECO",
  // ── Jerga digital / memes mexicanos
  "MEME DE WHATSAPP", "FORWARD DE CADENA", "AUDIO DE VOZ",
  "LIKE DE MAMÁ", "ESTADO DE WHATSAPP", "GRUPO DE FAMILIA",
  "STICKER DE GATO", "MEME DEL NACO", "PLANTILLA MEME",
];

// ─── Módulo 2: Validador IP / Legal ──────────────────────────────────────────
// Patrones que disparan una alerta (ipFlag) — el candidato se crea como
// "pending" pero con la alerta visible para que decidas si aprobarlo.
const IP_PATTERNS: RegExp[] = [
  /^(EL |LA |LOS |LAS )?[A-ZÁÉÍÓÚÜÑ]+ [A-ZÁÉÍÓÚÜÑ]+$/u,  // Nombre Apellido solo
];
// Personas vivas con potencial endorsement risk si se usan sin contexto cultural
const IP_BLACKLIST = new Set([
  "ELON MUSK", "MARK ZUCKERBERG", "JEFF BEZOS", // no son cultura MX
]);

function validateIP(word: string): string | null {
  const upper = word.toUpperCase().trim();
  if (IP_BLACKLIST.has(upper)) return "En lista negra: no es cultura mexicana";
  if (IP_PATTERNS[0].test(upper) && upper.split(" ").length === 2) {
    return "Posible nombre de persona — verifica contexto cultural antes de aprobar";
  }
  return null;
}

// ─── Módulo 3: Generador IA (Gemini 1.5 Flash) ───────────────────────────────
const CATEGORIES = [
  "Expresiones y Modismos", "Comida Mexicana", "Juegos y Niñez",
  "Bebidas", "Refranes y Dichos", "Animales de México", "Flora Mexicana",
  "Tradiciones y Fiestas", "Música y Artistas", "Historia de México",
  "Albures y Picaresca", "Cultura Popular", "Monumentos y Lugares",
  "Leyendas y Mitos", "Mundo Digital",
];

type GeminiResult = {
  word: string; meaning: string; example: string;
  region: string; category: string; difficulty: number;
};
type GeminiError = { _error: string };

async function callGemini(term: string): Promise<GeminiResult | GeminiError> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { _error: "GEMINI_API_KEY no configurada" };

  const prompt =
    `Mexican slang expert. Term: "${term}". Reply ONLY valid JSON, no markdown:` +
    `{"word":"TERM","meaning":"short Spanish def max 15 words","example":"short example max 10 words","region":"Mexico region or Todo Mexico","category":"pick one: Expresiones y Modismos|Comida Mexicana|Juegos y Niñez|Bebidas|Refranes y Dichos|Animales de México|Flora Mexicana|Tradiciones y Fiestas|Música y Artistas|Historia de México|Albures y Picaresca|Cultura Popular|Monumentos y Lugares|Leyendas y Mitos|Mundo Digital","difficulty":1}` +
    `. If NOT Mexican culture: {"error":"not mexican"}. JSON only, no explanation.`;

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
        }),
      }
    );
  } catch (e: any) {
    return { _error: `fetch failed: ${e.message}` };
  }

  if (!response.ok) {
    return { _error: `HTTP ${response.status}` };
  }

  let data: any;
  try { data = await response.json(); } catch { return { _error: "invalid JSON from API" }; }

  // Safety block
  if (!data?.candidates?.length) {
    const block = data?.promptFeedback?.blockReason ?? "empty candidates";
    return { _error: `blocked: ${block}` };
  }

  const raw: string = data.candidates[0]?.content?.parts?.[0]?.text ?? "";
  if (!raw) return { _error: "empty text in response" };

  // Strip markdown fences
  const cleaned = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.error) return { _error: `AI rejected: ${parsed.error}` };
    if (!parsed.meaning) return { _error: "no meaning in response" };
    if (!CATEGORIES.includes(parsed.category)) parsed.category = "Expresiones y Modismos";
    return {
      word: (parsed.word || term).toUpperCase().trim(),
      meaning: parsed.meaning,
      example: parsed.example || `Ejemplo de uso de ${term} en México.`,
      region: parsed.region || "Todo México",
      category: parsed.category,
      difficulty: typeof parsed.difficulty === "number" ? parsed.difficulty : 1,
    };
  } catch (e: any) {
    return { _error: `JSON parse failed: ${e.message} | raw: ${cleaned.slice(0, 80)}` };
  }
}

// ─── Módulo 4: Staging mutations ─────────────────────────────────────────────

/** Inserta un candidato en wordCandidates (internal, llamado por el action) */
export const submitCandidate = internalMutation({
  args: {
    word: v.string(),
    meaning: v.string(),
    example: v.string(),
    region: v.string(),
    category: v.string(),
    difficulty: v.number(),
    source: v.string(),
    ipFlag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("wordCandidates", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/** Aprueba un candidato: lo mueve a words + crea su level entry */
export const approveCandidate = internalMutation({
  args: { candidateId: v.id("wordCandidates") },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidato no encontrado");
    if ((candidate as any).status !== "pending") throw new Error("No está pendiente");

    // Check duplicate
    const existing = await ctx.db.query("words").collect();
    const key = candidate.word.toUpperCase().trim();
    const dup = existing.find(w => w.word.toUpperCase().trim() === key);
    if (dup) {
      await ctx.db.patch(args.candidateId, { status: "rejected" } as any);
      return { ok: false, reason: "duplicado en words" };
    }

    // Insert into words
    const wordId = await ctx.db.insert("words", {
      word: candidate.word,
      meaning: candidate.meaning,
      example: candidate.example,
      region: candidate.region,
      category: candidate.category,
      difficulty: candidate.difficulty,
    });

    // Create level entry at the end of the level sequence
    const allLevels = await ctx.db.query("levels").collect();
    const nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    await insertNewLevel(ctx, {
      levelNumber: nextLevel,
      wordId,
      reward: {
        coins: 50 + (nextLevel - 1) * 10,
        diamonds: Math.floor((nextLevel - 1) / 5) + 1,
      },
    });

    await ctx.db.patch(args.candidateId, { status: "approved" } as any);
    return { ok: true, wordId, levelNumber: nextLevel };
  },
});

/** Rechaza un candidato */
export const rejectCandidate = internalMutation({
  args: { candidateId: v.id("wordCandidates") },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidato no encontrado");
    await ctx.db.patch(args.candidateId, { status: "rejected" } as any);
    return { ok: true };
  },
});

/** Lista candidatos pendientes para revisión en el dashboard */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("wordCandidates")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .order("asc")
      .collect();
  },
});

/** Lista últimos candidatos aprobados/rechazados (para auditoría) */
export const listRecent = query({
  args: { status: v.union(v.literal("approved"), v.literal("rejected")) },
  handler: async (ctx, { status }) => {
    return ctx.db
      .query("wordCandidates")
      .withIndex("by_status_created", q => q.eq("status", status))
      .order("desc")
      .take(50);
  },
});

// ─── Agente principal: procesa SEED_QUEUE ────────────────────────────────────

/**
 * Action principal del Curador.
 * Corre el pipeline completo: skip duplicados → validar IP → generar con IA → staging.
 * Procesa máximo `batchSize` términos nuevos por ejecución (default 10).
 */
export const processSeedQueue = internalAction({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.batchSize ?? 10;

    // Load existing words and pending candidates to skip duplicates
    const existing: { word: string }[] = await ctx.runQuery(api.words.getAllWords as any) ?? [];
    const pending: { word: string }[] = await ctx.runQuery(api.curator.listPending) ?? [];

    const existingKeys = new Set([
      ...existing.map((w: any) => w.word.toUpperCase().trim()),
      ...pending.map((w: any) => w.word.toUpperCase().trim()),
    ]);

    const toProcess = SEED_QUEUE
      .map(t => t.toUpperCase().trim())
      .filter(t => !existingKeys.has(t))
      .slice(0, limit);

    if (toProcess.length === 0) {
      return { processed: 0, message: "No hay términos nuevos en la cola. Agrega más a SEED_QUEUE." };
    }

    const results: Array<{ term: string; status: "ok" | "skip" | "error"; reason?: string }> = [];

    for (const term of toProcess) {
      // Módulo 2: Validar IP
      const ipFlag = validateIP(term) ?? undefined;

      // Módulo 3: Generar con IA
      const wordData = await callGemini(term);

      if ("_error" in wordData) {
        // Distinguish: AI intentionally rejected vs technical failure
        if (wordData._error.startsWith("AI rejected")) {
          results.push({ term, status: "skip", reason: wordData._error });
        } else {
          results.push({ term, status: "error", reason: wordData._error });
        }
        continue;
      }

      // Módulo 4: Staging
      await ctx.runMutation(internal.curator.submitCandidate, {
        word: wordData.word,
        meaning: wordData.meaning,
        example: wordData.example,
        region: wordData.region,
        category: wordData.category,
        difficulty: wordData.difficulty,
        source: "seed",
        ipFlag,
      });

      results.push({ term, status: "ok" });

      // Pequeña pausa para no saturar la API gratuita de Gemini (15 req/min)
      await new Promise(r => setTimeout(r, 4500));
    }

    const ok = results.filter(r => r.status === "ok").length;
    const skips = results.filter(r => r.status === "skip").length;
    const errs = results.filter(r => r.status === "error").length;

    return {
      processed: ok,
      skipped: skips,
      errors: errs,
      details: results,
      message: `✅ ${ok} candidatos en staging | ⏭ ${skips} descartados por IA | ❌ ${errs} errores`,
    };
  },
});

/**
 * Ejecuta el agente manualmente desde el dashboard de Convex:
 *   curator:runNow
 * Útil para testear antes del cron semanal.
 */
export const runNow = internalAction({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args): Promise<unknown> => {
    return ctx.runAction(internal.curator.processSeedQueue, { batchSize: args.batchSize ?? 5 });
  },
});

// ─── Módulo 1 Action: processTrends ──────────────────────────────────────────

/**
 * Descubridor de tendencias culturales MX usando Gemini.
 * Corre los miércoles 08:05 UTC automáticamente (ver crons.ts).
 * También ejecutable manualmente: curator:processTrends {}
 *
 * Pipeline: discoverTrendsMX → validateIP → callGemini → staging
 */
export const processTrends = internalAction({
  args: {},
  handler: async (ctx) => {
    // Load existing words/candidates (needed for dedup + Gemini context)
    const existing: { word: string }[] = await ctx.runQuery(api.words.getAllWords as any) ?? [];
    const pending: { word: string }[] = await ctx.runQuery(api.curator.listPending) ?? [];
    const existingKeys = new Set([
      ...existing.map((w: any) => w.word.toUpperCase().trim()),
      ...pending.map((w: any) => w.word.toUpperCase().trim()),
    ]);

    // Módulo 1: descubrir términos culturales nuevos con Gemini
    const toProcess = await discoverTrendsMX(existingKeys);
    if (toProcess.length === 0) {
      return { processed: 0, message: "Gemini no disponible ahora (503 sobrecarga o API key inválida) — el cron del miércoles reintentará automáticamente" };
    }

    const results: Array<{ term: string; status: "ok" | "skip" | "error"; reason?: string }> = [];

    for (const term of toProcess) {
      // Módulo 2: Validar IP
      const ipFlag = validateIP(term) ?? undefined;

      // Módulo 3: Generar con IA (valida que sea cultura MX real)
      const wordData = await callGemini(term);

      if ("_error" in wordData) {
        if (wordData._error.startsWith("AI rejected")) {
          results.push({ term, status: "skip", reason: wordData._error });
        } else {
          results.push({ term, status: "error", reason: wordData._error });
        }
        continue;
      }

      // Módulo 4: Staging
      await ctx.runMutation(internal.curator.submitCandidate, {
        word: wordData.word,
        meaning: wordData.meaning,
        example: wordData.example,
        region: wordData.region,
        category: wordData.category,
        difficulty: wordData.difficulty,
        source: "trend",
        ipFlag,
      });

      results.push({ term, status: "ok" });

      // Pausa para no saturar la API gratuita de Gemini (15 req/min)
      await new Promise(r => setTimeout(r, 4500));
    }

    const ok = results.filter(r => r.status === "ok").length;
    const skips = results.filter(r => r.status === "skip").length;
    const errs = results.filter(r => r.status === "error").length;

    return {
      scraped: toProcess.length,
      processed: ok,
      skipped: skips,
      errors: errs,
      details: results,
      message: `📈 ${toProcess.length} descubiertos | ✅ ${ok} en staging | ⏭ ${skips} no son cultura MX | ❌ ${errs} errores`,
    };
  },
});
