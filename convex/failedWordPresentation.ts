export function buildDueReviewWord(record: any, wordData: any) {
  return {
    recordId: record._id,
    wordId: record.wordId,
    wordText: wordData.word,
    meaning: wordData.meaning,
    example: wordData.example,
    region: wordData.region,
    pathId: wordData.pathId,
    placeId: wordData.placeId,
    editorialOrder: wordData.editorialOrder,
    failCount: record.failCount,
    failedAt: record.failedAt,
  };
}
