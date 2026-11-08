// Stars per level (GAME_DESIGN §3) — pure.
//  1 star  = reached the Golden Carrot
//  2 stars = 75%+ of challenges right on the first try
//  3 stars = 90%+ right on the first try AND found the hidden Star Carrot

export function firstTryRate({ challenges = 0, firstTry = 0 }) {
  return challenges > 0 ? firstTry / challenges : 1;
}

export function starsFor({ challenges = 0, firstTry = 0, starCarrot = false }) {
  const rate = firstTryRate({ challenges, firstTry });
  if (rate >= 0.9 && starCarrot) return 3;
  if (rate >= 0.75) return 2;
  return 1;
}

/** What the child could do for one more star next time (for a friendly hint), or null at 3 stars. */
export function nextStarHint({ challenges = 0, firstTry = 0, starCarrot = false }) {
  const stars = starsFor({ challenges, firstTry, starCarrot });
  if (stars === 3) return null;
  const rate = firstTryRate({ challenges, firstTry });
  if (stars === 2 && rate >= 0.9) return 'star';      // only the Star Carrot is missing
  return 'firstTry';
}
