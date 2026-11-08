// Encouragement (pure: no Phaser, no DOM). Phrases rotate like a shuffled deck, so the child hears
// every one before any repeats, and never the same one twice in a row. Streaks of right-first-time
// answers get a special cheer.

export const FIRST_TRY = [
  'Hop-tastic!', 'Carrot power!', 'You did it!', 'Super-duper!', 'Bunny-brilliant!', 'Hooray!',
  'Amazing!', 'Fantastic!', 'Wow, you’re a star!', 'Brilliant thinking!', 'Hip hip hooray!', 'Yes! Spot on!',
];

// After a try or two: proud of the effort, never "wrong".
export const AFTER_HELP = [
  'You did it!', 'You got it!', 'Great trying!', 'Well done!', 'Yes! You worked it out!', 'Good job, keep going!',
];

export const STREAKS = {
  3: 'Three in a row!',
  5: 'Five in a row! Carrot power!',
  8: 'Eight in a row! You’re on fire!',
  10: 'Ten in a row! Super bunny!',
};

/** A shuffled-deck picker: every item once per round, and never the same item twice in a row. */
export function createDeck(items, rng = Math.random) {
  let deck = [];
  let last = null;
  const refill = () => {
    deck = [...items];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (deck.length > 1 && deck[deck.length - 1] === last) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
  };
  return {
    next() {
      if (!deck.length) refill();
      last = deck.pop();
      return last;
    },
  };
}

/**
 * next(firstTry) → { text, streak } where `text` is what to show and say.
 * The streak counts right-first-time answers in a row (any miss starts it again).
 */
export function createPraise(rng = Math.random) {
  const first = createDeck(FIRST_TRY, rng);
  const helped = createDeck(AFTER_HELP, rng);
  let streak = 0;
  return {
    next(firstTry) {
      if (!firstTry) { streak = 0; return { text: helped.next(), streak }; }
      streak++;
      const special = STREAKS[streak] || (streak > 10 && streak % 5 === 0 ? `${streak} in a row! Wow!` : null);
      return { text: special || first.next(), streak };
    },
    get streak() { return streak; },
    reset() { streak = 0; },
  };
}
