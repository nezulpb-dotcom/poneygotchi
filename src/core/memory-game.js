const SYMBOLS = ['🌸', '🌼', '🍀', '🌷'];
const DEFAULT_PAIR_COUNT = 3;
const MAX_PAIR_COUNT = 4;

const normalizePairCount = (value) => value === MAX_PAIR_COUNT ? MAX_PAIR_COUNT : DEFAULT_PAIR_COUNT;

export function createMemoryRound(random = Math.random, requestedPairCount = DEFAULT_PAIR_COUNT) {
  const pairCount = normalizePairCount(requestedPairCount);
  const symbols = SYMBOLS.slice(0, pairCount);
  const cards = [...symbols, ...symbols].map((symbol, id) => ({ id, symbol, revealed: false, matched: false }));
  for (let i = cards.length - 1; i > 0; i--) {
    const sample = Number(random());
    const safeSample = Number.isFinite(sample) ? Math.max(0, Math.min(0.999999, sample)) : 0;
    const j = Math.floor(safeSample * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return { cards, pairCount, firstCard: null, pendingHide: [], moves: 0, matches: 0, finished: false };
}

export function revealMemoryCard(round, index) {
  if (!round || round.finished || !Number.isInteger(index) || index < 0 || index >= round.cards.length) {
    return { round, result: 'ignored' };
  }
  const cards = round.cards.map((card) => ({ ...card }));
  for (const pending of round.pendingHide) {
    if (!cards[pending].matched) cards[pending].revealed = false;
  }
  const firstCard = round.pendingHide.length ? null : round.firstCard;
  const pendingHide = [];
  if (cards[index].matched || cards[index].revealed) {
    return { round: { ...round, cards, firstCard, pendingHide }, result: 'ignored' };
  }
  cards[index].revealed = true;
  if (firstCard === null) return { round: { ...round, cards, firstCard: index, pendingHide }, result: 'first' };
  const moves = round.moves + 1;
  if (cards[firstCard].symbol === cards[index].symbol) {
    cards[firstCard].matched = true;
    cards[index].matched = true;
    const matches = round.matches + 1;
    const pairCount = Number.isInteger(round.pairCount) ? round.pairCount : DEFAULT_PAIR_COUNT;
    const finished = matches === pairCount;
    return { round: { ...round, cards, firstCard: null, pendingHide: [], moves, matches, finished }, result: finished ? 'complete' : 'match' };
  }
  return { round: { ...round, cards, firstCard: null, pendingHide: [firstCard, index], moves }, result: 'mismatch' };
}

export function recordMemoryWin(daily, award) {
  if (daily.memoryRewarded) return { rewarded: false, reward: { stars: 0, xp: 0 } };
  const reward = { stars: 12, xp: 15 };
  daily.memoryRewarded = true;
  award(reward);
  return { rewarded: true, reward };
}
