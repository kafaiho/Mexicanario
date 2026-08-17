import { v } from "convex/values";
import { internalQuery } from "./_generated/server.js";
import {
  CULTURAL_COLLECTION_IDS,
  CULTURAL_GENERATIONS,
  CULTURAL_PATH_IDS,
  CULTURAL_PLACE_IDS,
  CULTURAL_RATINGS,
} from "./culturalTaxonomy.ts";

type CulturalWordInput = {
  [key: string]: unknown;
  collectionId?: unknown;
  pathId?: unknown;
  placeId?: unknown;
  difficulty?: unknown;
  generation?: unknown;
  rating?: unknown;
  icon?: unknown;
  editorialOrder?: unknown;
};

type ValidationOptions = { requireCulturalMetadata?: boolean };
type AuditOptions = ValidationOptions & { limit?: number };
type StoredCulturalWord = CulturalWordInput & { _id: unknown; word: unknown };

const paths = new Set<unknown>(CULTURAL_PATH_IDS);
const collections = new Set<unknown>(CULTURAL_COLLECTION_IDS);
const places = new Set<unknown>(CULTURAL_PLACE_IDS);
const ratings = new Set<unknown>(CULTURAL_RATINGS);
const generations = new Set<unknown>(CULTURAL_GENERATIONS);
const latePaths = new Set<unknown>([
  "mexico-regional", "oficios-artesanias", "historias-leyendas", "mexico-profundo",
]);

const culturalFields: (keyof CulturalWordInput)[] = [
  "collectionId", "pathId", "placeId", "difficulty", "generation", "rating", "icon", "editorialOrder",
];

export function hasCulturalMetadata(input: CulturalWordInput): boolean {
  return culturalFields.some((field) => input[field] !== undefined);
}

export function validateCulturalWord(
  input: CulturalWordInput,
  options: ValidationOptions = {},
): string[] {
  if (!options.requireCulturalMetadata && !hasCulturalMetadata(input)) return [];

  const errors: string[] = [];
  if (!collections.has(input.collectionId)) errors.push("collectionId desconocido o ausente");
  if (!paths.has(input.pathId)) errors.push("pathId desconocido o ausente");
  if (!places.has(input.placeId)) errors.push("placeId desconocido o ausente");
  else if (input.placeId === "unclassified") errors.push("placeId no puede ser unclassified en contenido publicable");
  if (![1, 2, 3].includes(input.difficulty as number)) errors.push("difficulty debe ser 1, 2 o 3");
  if (!ratings.has(input.rating)) errors.push("rating debe ser familiar o adulto");

  if (!Array.isArray(input.generation) || input.generation.length === 0) {
    errors.push("generation debe incluir al menos un valor");
  } else if (input.generation.some((generation) => !generations.has(generation))) {
    errors.push("generation contiene un valor desconocido");
  }

  if (typeof input.icon !== "string" || input.icon.trim() === "") errors.push("icon no puede estar vacío");
  if (!Number.isInteger(input.editorialOrder) || (input.editorialOrder as number) <= 0) {
    errors.push("editorialOrder debe ser un entero positivo");
  }

  if (input.rating === "adulto") {
    if (input.collectionId !== "albures-picaresca") {
      errors.push("contenido adulto solo puede pertenecer a albures-picaresca");
    }
    if (!latePaths.has(input.pathId)) {
      errors.push("contenido adulto solo puede aparecer en un camino tardío");
    }
    if (typeof input.editorialOrder !== "number" || input.editorialOrder <= 150) {
      errors.push("contenido adulto requiere editorialOrder mayor que 150");
    }
  }

  return errors;
}

export function buildCulturalAudit(
  words: StoredCulturalWord[],
  options: AuditOptions = {},
) {
  const issues: Array<{ wordId: string; word: string; errors: string[] }> = [];
  const limit = options.limit ?? 200;
  let audited = 0;
  let invalid = 0;

  for (const word of words) {
    if (!options.requireCulturalMetadata && !hasCulturalMetadata(word)) continue;
    audited += 1;
    const errors = validateCulturalWord(word, {
      requireCulturalMetadata: options.requireCulturalMetadata,
    });
    if (errors.length > 0) {
      invalid += 1;
      if (issues.length < limit) {
        issues.push({ wordId: String(word._id), word: String(word.word), errors });
      }
    }
  }

  return {
    total: words.length,
    audited,
    valid: audited - invalid,
    invalid,
    issues,
    issueCount: invalid,
    truncated: invalid > issues.length,
  };
}

export const auditCulturalWords = internalQuery({
  args: { requireCulturalMetadata: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const words = await ctx.db.query("words").collect();
    return buildCulturalAudit(words, {
      requireCulturalMetadata: args.requireCulturalMetadata,
    });
  },
});
