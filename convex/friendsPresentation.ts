export function buildChallengeWordData(word: any) {
  return {
    word: word?.word ?? "???",
    meaning: word?.meaning ?? "",
    example: word?.example ?? "",
    region: word?.region ?? "",
    pathId: word?.pathId,
    placeId: word?.placeId,
    editorialOrder: word?.editorialOrder,
  };
}
