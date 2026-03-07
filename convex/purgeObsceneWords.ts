import { mutation } from "./_generated/server";

/**
 * Lista de palabras obscenas/vulgares que se deben eliminar de la base de datos.
 * Incluye variantes con y sin acento y en diferentes formas.
 */
const OBSCENE_WORDS = [
    // De sampleWords en words.ts
    "Pendejo",
    "Cabrón",
    "Ya valió madre",
    "Echar la hueva",
    "Hacerse güey",
    "Andar pedo",
    "Armarla de pedo",
    "A'huevo",
    "Puchador",
    "Estar en la movida",
    "Halcón",
    "Troca blindada",
    "Tirar barrio",
    "Clica",

    // De seedWords1000.ts
    "Desmadre",
    "Chingón",
    "Chingona",
    "Pistear",
    "Peda",
    "A huevo",
    "Huevón",
    "No tener madre",
    "Estar de mala leche",

    // Adicionales
    "Puto",
];

/**
 * Ejecutar desde Convex Dashboard para eliminar palabras obscenas
 * de la colección words y sus niveles asociados.
 */
export const purgeObsceneWords = mutation({
    args: {},
    handler: async (ctx) => {
        const removed: string[] = [];
        const notFound: string[] = [];

        // Normalizar la lista para comparar sin importar mayúsculas
        const normalizedList = OBSCENE_WORDS.map((w) => w.toLowerCase().trim());

        // Obtener todas las palabras
        const allWords = await ctx.db.query("words").collect();

        for (const word of allWords) {
            const normalized = word.word.toLowerCase().trim();
            if (normalizedList.includes(normalized)) {
                // Eliminar niveles asociados a esta palabra
                const levels = await ctx.db
                    .query("levels")
                    .collect();

                for (const level of levels) {
                    if (level.wordId === word._id) {
                        await ctx.db.delete(level._id);
                    }
                }

                // Eliminar la palabra
                await ctx.db.delete(word._id);
                removed.push(word.word);
            }
        }

        // Verificar cuáles no se encontraron
        const removedNormalized = new Set(removed.map((w) => w.toLowerCase().trim()));
        for (const target of OBSCENE_WORDS) {
            if (!removedNormalized.has(target.toLowerCase().trim())) {
                notFound.push(target);
            }
        }

        return {
            message: `Eliminadas ${removed.length} palabras obscenas de la base de datos.`,
            removed,
            notFound,
        };
    },
});
