import assert from "node:assert/strict";
import { planDifficultyWaves } from "./difficultyWaves";

type Fixture = {
  id: string;
  difficulty: 1 | 2 | 3;
  rating: "familiar" | "adulto";
  pathId: string;
  editorialOrder: number;
};

const fixture = (count: number, pathId = "mercado-antojitos", offset = 50): Fixture[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${pathId}-${index}`,
    difficulty: ([2, 2, 1, 2, 1, 2, 2, 1, 2, 3, 2, 1, 2, 3, 2, 2, 1, 2, 2, 3] as const)[index % 20],
    rating: "familiar",
    pathId,
    editorialOrder: offset + index + 1,
  }));

{
  const planned = planDifficultyWaves(fixture(20), "usuaria-a", 2);
  const counts = planned.reduce<Record<string, number>>((result, item) => {
    result[item.difficultyRole] = (result[item.difficultyRole] ?? 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, { expected: 12, rest: 5, surprise: 3 });
  assert.deepEqual(planned.filter((item) => item.isChallenge).map((item) => item.position), [10, 20]);
  assert.ok(planned.filter((item) => item.isChallenge).every((item) => item.difficultyBand === "surprise"));
}

{
  const input = fixture(20);
  const first = planDifficultyWaves(input, "misma-persona", 2);
  const again = planDifficultyWaves(input, "misma-persona", 2);
  const another = planDifficultyWaves(input, "otra-persona", 2);
  assert.deepEqual(first, again, "la semilla debe ser estable");
  assert.notDeepEqual(first.map((item) => item.id), another.map((item) => item.id), "dos usuarios deben obtener variedad cuando hay candidatos");
}

{
  const early: Fixture[] = fixture(50, "patio-recreo", 0).map((item, index) => ({
    ...item,
    difficulty: index % 10 === 9 ? 2 : 1,
  }));
  const planned = planDifficultyWaves(early, "infancia", 2);
  assert.ok(planned.every((item) => item.difficulty !== 3));
  assert.ok(planned.every((item) => item.rating === "familiar"));
  assert.ok(planned.filter((item) => item.requestedRole === "expected").every((item) => item.difficulty === 1));
}

{
  const boundary: Fixture[] = Array.from({ length: 10 }, (_, index) => ({
    id: `frontera-${index}`,
    difficulty: index < 5 ? 1 : 3,
    rating: index < 5 ? "familiar" : "adulto",
    pathId: "calle-barrio",
    editorialOrder: 46 + index,
  }));
  const planned = planDifficultyWaves(boundary, "seguridad-frontera", 2);
  assert.ok(planned.slice(0, 5).every((item) => item.difficulty !== 3 && item.rating === "familiar"));
}

{
  const input = [...fixture(20, "patio-recreo"), ...fixture(20, "casa-abuela", 70)];
  const originalIndex = new Map(input.map((item, index) => [item.id, index]));
  const planned = planDifficultyWaves(input, "caminante", 2);
  assert.deepEqual([...new Set(planned.map((item) => item.pathId))], ["patio-recreo", "casa-abuela"]);
  assert.ok(planned.every((item, index) => Math.abs(index - originalIndex.get(item.id)!) <= 9));
  assert.equal(new Set(planned.map((item) => item.id)).size, input.length);
}

{
  const uneven = [...fixture(15, "patio-recreo"), ...fixture(15, "casa-abuela", 65)];
  const planned = planDifficultyWaves(uneven, "caminos-disparejos", 2);
  assert.deepEqual(planned.filter((item) => item.isChallenge).map((item) => item.position), [10, 20, 30]);
  assert.deepEqual([...new Set(planned.map((item) => item.pathId))], ["patio-recreo", "casa-abuela"]);
}

{
  const [legacyMetadata] = planDifficultyWaves([{
    id: "sin-camino",
    difficulty: 3 as const,
    rating: "familiar",
    editorialOrder: 60,
  }], "auditoria", 2);
  assert.equal(legacyMetadata.difficultyRole, "surprise");
  assert.equal(legacyMetadata.deviation, true);
}

{
  const scarce = fixture(13, "feria-verbena").map((item) => ({ ...item, difficulty: 2 as const }));
  const first = planDifficultyWaves(scarce, "sin-cubetas", 2);
  const again = planDifficultyWaves(scarce, "sin-cubetas", 2);
  assert.deepEqual(first, again, "la ventana parcial debe ser estable");
  assert.equal(first.length, scarce.length);
  assert.equal(new Set(first.map((item) => item.id)).size, scarce.length);
  assert.ok(first.some((item) => item.deviation && item.requestedRole !== item.difficultyRole));
  assert.equal(first[9].difficultyBand, "surprise", "el reto conserva su banda aunque reporte fallback real");
}

console.log("difficultyWaves: proporción, retos, seguridad, límites y fallback válidos");
