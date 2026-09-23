import { mutation, internalMutation } from "./_generated/server";

// ── Normaliza: UPPERCASE sin acentos ─────────────────────────────────────────
function norm(s: string) {
  return s.toUpperCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const PICARESCA = new Set([
  "CHINGON", "CHINGONA", "DESMADRE", "PISTEAR", "PEDA",
  "NO TENER MADRE", "ESTAR DE MALA LECHE", "HUEVON",
  "ECHAR LA HUEVA", "A HUEVO", "DARLE AL HIGADO",
  "ESTAR CUETE", "MAICEAR", "CABULA", "PELOS DE GATO",
  "ESTAR HASTA EL TOPE", "ESTAR EN CHINO",
].map(norm));

const TIPOS_SOCIALES = new Set([
  "FRESA", "NACO", "GANDALLA", "MORRO", "MORRA",
  "ANDAR DE LAMBISCON", "CHAFA", "SER UN COYOTE",
].map(norm));

const VERBOS_BARRIO = new Set([
  "COTORREAR", "APAPACHAR", "CHANTEAR", "JALE", "CHAMBA",
  "DAR EL ROL", "AVENTAR EL ROLLO", "ARMAR EL MITOTE",
  "IR DE PINTA", "QUEDARSE CON EL OJO CUADRADO",
  "QUEDARSE PLANTADO", "SACAR EL COBRE", "SACAR DE QUICIO",
  "TOMAR EL PELO", "TRAER ENTRE OJOS", "PONERSE TRUCHA",
  "TIRARSE A LA BARTOLA", "HACER EL OSO", "HACER SU AGOSTO",
  "HACER DE TRIPAS CORAZON", "DAR EL GATAZO",
  "DAR ATOLE CON EL DEDO", "DAR LATA", "DAR EN EL CLAVO",
  "DAR EN LA TORRE", "METER EL PIE", "LLEVAR EL GATO AL AGUA",
  "ECHAR RAICES", "ECHAR UN OJO", "ECHARSE UN TACO DE OJO",
  "ESTAR EN EL QUINTO SUENO", "ESTAR EN LAS ULTIMAS",
  "ESTAR COMO AGUA PARA CHOCOLATE", "ESTAR PATO",
  "AGARRAR DE BAJADA", "AGARRAR EL TORO POR LOS CUERNOS",
  "ANDAR CON EL JESUS EN LA BOCA", "ANDAR DE VOLADA",
  "AL AHI SE VA", "COSTAR UN OJO DE LA CARA", "A TODO MECATE",
  "TENER EL SARTEN POR EL MANGO", "NO DAR PIE CON BOLA",
  "HACERSE GUAJE", "HACERSE EL OCCISO", "QUE OSO",
  "MANDAR AL DIABLO", "PONER EL DEDO", "TENER MUCHA LABIA",
  "IR AL GRANO", "AGARRAR LA ONDA", "COTORREO",
].map(norm));

// Default → Expresiones
function getNewCategory(word: string): string {
  const n = norm(word);
  if (PICARESCA.has(n))      return "Picaresca";
  if (TIPOS_SOCIALES.has(n)) return "Tipos Sociales";
  if (VERBOS_BARRIO.has(n))  return "Verbos del Barrio";
  return "Expresiones";
}

/**
 * Reclasifica todas las palabras con category = "Modismos" en 4 sub-categorías.
 * Idempotente — puede ejecutarse varias veces sin efecto duplicado.
 *
 * Ejecutar desde Convex Dashboard: patchModismos:patchModismos
 */
export const patchModismos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const modismos = allWords.filter((w) => (w as any).category === "Modismos");

    const results: { word: string; newCat: string }[] = [];
    for (const w of modismos) {
      const newCat = getNewCategory(w.word);
      await ctx.db.patch(w._id, { category: newCat } as any);
      results.push({ word: w.word, newCat });
    }

    const summary: Record<string, number> = {};
    for (const r of results) {
      summary[r.newCat] = (summary[r.newCat] ?? 0) + 1;
    }

    return { patched: results.length, summary };
  },
});
