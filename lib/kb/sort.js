const DIFFICULTY_RANK = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

const rankOf = difficulty => DIFFICULTY_RANK[difficulty] ?? 99;
const orderOf = order => order ?? Number.MAX_SAFE_INTEGER;

export const sortArticles = articles =>
  [...articles].sort((a, b) => {
    // 1. Prioritize manually set orders. Those without orders are put at the end.
    const byOrder = orderOf(a.fields.order) - orderOf(b.fields.order);
    if (byOrder !== 0) return byOrder;

    // 2. In case of same order, those with lower level of difficulty are put first.
    const byDifficulty =
      rankOf(a.fields.difficulty) - rankOf(b.fields.difficulty);
    if (byDifficulty !== 0) return byDifficulty;

    // 3. If the orders and difficulty levels are the same, sort by title.
    return a.fields.title.localeCompare(b.fields.title);
  });
