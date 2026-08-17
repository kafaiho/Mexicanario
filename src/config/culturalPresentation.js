import { CULTURAL_PATHS, resolvePlace } from "./culturalTaxonomy";

const NEUTRAL_PHRASES = [
  "¡Eso mero, así se hace!",
  "¡Muy bien, le atinaste!",
  "¡Qué buena memoria!",
  "¡Sigue descubriendo México!",
];

const PATH_PHRASES = {
  "patio-recreo": "¡Como en el recreo: jugando se aprende!",
  "casa-abuela": "¡Ese recuerdo sí sabe a casa!",
  "calle-barrio": "¡La vida del barrio también cuenta historias!",
  "mercado-antojitos": "¡Ese saber se encuentra en el mercado!",
  "feria-verbena": "¡Que siga la fiesta y la tradición!",
  "musica-une": "¡Que suene México!",
  "mexico-regional": "¡Cada región le da una voz distinta a México!",
  "oficios-artesanias": "¡Reconocer el oficio también honra sus manos!",
  "historias-leyendas": "¡Una historia más que sigue viva!",
  "mexico-profundo": "¡Conocer nuestras raíces también es hacer memoria!",
};

export function getCulturalEmojis(placeIdOrAlias) {
  if (!placeIdOrAlias) return [];
  const place = resolvePlace(placeIdOrAlias);
  return place?.id && place.id !== "unclassified" ? [place.icon] : [];
}

export function getCulturalVictoryPhrase(level = 1, pathId, placeId) {
  const pathExists = CULTURAL_PATHS.some(({ id }) => id === pathId);
  const place = placeId ? resolvePlace(placeId) : null;
  if (pathId === "mexico-regional" && place && !["todo-mexico", "unclassified"].includes(place.id)) {
    return `${place.icon} ¡Una palabra con historia en ${place.name}!`;
  }
  if (pathExists && PATH_PHRASES[pathId]) return PATH_PHRASES[pathId];
  const index = Math.max(0, Number(level) - 1) % NEUTRAL_PHRASES.length;
  return NEUTRAL_PHRASES[index];
}
