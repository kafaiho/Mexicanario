/**
 * Server-side identifiers used to validate persisted cultural metadata.
 * The client taxonomy remains the presentation source for names, icons, colors,
 * descriptions, aliases, and other visual metadata.
 */
export const CULTURAL_PATH_IDS = [
  "patio-recreo", "casa-abuela", "calle-barrio", "mercado-antojitos",
  "feria-verbena", "musica-une", "mexico-regional", "oficios-artesanias",
  "historias-leyendas", "mexico-profundo",
] as const;

export const CULTURAL_COLLECTION_IDS = [
  "juegos-ninez", "dulces-antojitos", "cocina-bebidas", "dichos-casa",
  "escuela-mexicana", "vida-barrio", "tele-cultura-popular", "musica-mexicana",
  "fiestas-tradiciones", "naturaleza-mexico", "pueblos-originarios-lenguas",
  "oficios-artesanias", "regiones-hablas", "historia-personajes",
  "lugares-mexico", "leyendas-relatos", "ciencia-inventos-deporte",
  "mexico-digital", "albures-picaresca",
] as const;

export const CULTURAL_PLACE_IDS = [
  "todo-mexico", "cdmx", "guadalajara", "jalisco", "monterrey", "nuevo-leon",
  "veracruz", "oaxaca", "puebla", "michoacan", "guerrero", "chiapas",
  "yucatan", "campeche", "quintana-roo", "tabasco", "sinaloa", "nayarit",
  "huasteca", "unclassified",
] as const;

export const CULTURAL_RATINGS = ["familiar", "adulto"] as const;
export const CULTURAL_GENERATIONS = ["tradicional", "80s", "90s", "2000s", "actual"] as const;

export type CulturalPathId = typeof CULTURAL_PATH_IDS[number];
export type CulturalCollectionId = typeof CULTURAL_COLLECTION_IDS[number];
export type CulturalPlaceId = typeof CULTURAL_PLACE_IDS[number];
export type CulturalRating = typeof CULTURAL_RATINGS[number];
export type CulturalGeneration = typeof CULTURAL_GENERATIONS[number];
