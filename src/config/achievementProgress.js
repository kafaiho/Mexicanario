function sumPlaceProgress(groups, ids) {
  const wanted = new Set(ids);
  return (groups || []).reduce((sum, group) => {
    if (!wanted.has(group.placeId || group.id)) return sum;
    sum.completed += group.completed || 0;
    sum.total += group.total || 0;
    return sum;
  }, { completed: 0, total: 0 });
}

module.exports = { sumPlaceProgress };
