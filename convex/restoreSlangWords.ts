import { mutation } from "./_generated/server";
import { NEW_WORDS } from "./seedWords1000";
import { sampleWords } from "./words";

const RECOVERED_WORDS = [
    "Pendejo", "Cabrón", "Ya valió madre", "Echar la hueva", "Hacerse güey",
    "Andar pedo", "Armarla de pedo", "A'huevo", "Puchador", "Estar en la movida",
    "Halcón", "Troca blindada", "Tirar barrio", "Clica",
    "Desmadre", "Chingón", "Chingona", "Pistear", "Peda", "A huevo",
    "Huevón", "No tener madre", "Estar de mala leche"
];

export const restoreSlangWords = mutation({
    args: {},
    handler: async (ctx) => {
        const restored: string[] = [];
        const normalizedTarget = RECOVERED_WORDS.map(w => w.toLowerCase().trim());

        // Find highest level number to append to
        const allLevels = await ctx.db.query("levels").collect();
        let nextLevel = allLevels.length > 0
            ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
            : 1;

        // Process from sampleWords
        for (const item of sampleWords) {
            const cleanWord = item.Palabra.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, "");
            const normalizedQuery = item.Palabra.toLowerCase().trim();

            if (normalizedTarget.includes(normalizedQuery)) {
                // Check if it exists
                const exists = await ctx.db.query("words").filter(q => q.eq(q.field("word"), cleanWord)).first() ||
                    await ctx.db.query("words").filter(q => q.eq(q.field("word"), item.Palabra)).first();
                if (!exists) {
                    const wordId = await ctx.db.insert("words", {
                        word: cleanWord,
                        meaning: item.Significado,
                        example: item.Ejemplo,
                        region: item.Region,
                    });
                    restored.push(item.Palabra);
                }
            }
        }

        // Process from NEW_WORDS
        for (const item of NEW_WORDS) {
            const normalizedQuery = item.word.toLowerCase().trim();
            if (normalizedTarget.includes(normalizedQuery)) {
                const exists = await ctx.db.query("words").filter(q => q.eq(q.field("word"), item.word)).first();
                if (!exists) {
                    const wordId = await ctx.db.insert("words", item);
                    restored.push(item.word);
                }
            }
        }

        return { message: `Restauradas ${restored.length} palabras.`, restored };
    },
});
