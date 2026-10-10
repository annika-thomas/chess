// Which puzzles go into which set. Ratings are Lichess puzzle ratings; sets are sorted easy → hard.
// Practice sets follow the Steps Method order; tests and mixed sets are unlabelled (no theme hint).
export const QUALITY = { maxRd: 90, minPopularity: 85, minPlays: 500 };

export const SETS = [
  // Level 1 — Foundations
  { id: 'hanging', title: 'Free pieces', about: 'Take what’s hanging, and only what’s really free.', any: ['hangingPiece'], rating: [400, 1000], size: 25 },
  { id: 'mate1', title: 'Mate in one', about: 'Find the one move that ends the game.', any: ['mateIn1'], rating: [400, 1000], size: 25 },
  { id: 'backrank', title: 'Back-rank mates', about: 'Kings trapped behind their own pawns.', any: ['backRankMate'], rating: [500, 1200], size: 25 },
  { id: 'fork-1', title: 'Forks I', about: 'One piece, two targets.', any: ['fork'], all: [], rating: [400, 900], size: 25 },
  { id: 'fork-2', title: 'Forks II', about: 'Harder forks, often with a check first.', any: ['fork'], rating: [900, 1300], size: 25 },
  { id: 'level1-test', title: 'Level 1 test', about: 'Mixed: free pieces, mates and forks. No hints.', any: ['hangingPiece', 'mateIn1', 'backRankMate', 'fork'], rating: [500, 1100], size: 30, test: true },
  { id: 'mix-1', title: 'Mix 1', about: 'Unlabelled review of Level 1, for Level 2 homework.', any: ['hangingPiece', 'mateIn1', 'backRankMate', 'fork'], rating: [500, 1200], size: 60, test: true },
  // Level 2 — Tactics & endgames
  { id: 'pin', title: 'Pins', about: 'Pieces that can’t move, and how to win them.', any: ['pin'], rating: [500, 1200], size: 25 },
  { id: 'skewer', title: 'Skewers', about: 'Attack the big piece; win the one behind it.', any: ['skewer'], rating: [500, 1200], size: 25 },
  { id: 'discovered', title: 'Discovered attacks', about: 'Move one piece, unleash another.', any: ['discoveredAttack'], rating: [500, 1200], size: 25 },
  { id: 'double-check', title: 'Double checks', about: 'Two checks at once: the king must run.', any: ['doubleCheck'], rating: [600, 1300], size: 25 },
  { id: 'defender', title: 'Removing the defender', about: 'Take away the piece that holds everything together.', any: ['capturingDefender'], rating: [600, 1300], size: 25 },
  { id: 'mate2', title: 'Mate in two', about: 'A forcing move, then mate.', any: ['mateIn2'], rating: [600, 1300], size: 25 },
  { id: 'f7', title: 'Attacking f7 and f2', about: 'The weak squares next to the king.', any: ['attackingF2F7'], rating: [600, 1300], size: 25 },
  { id: 'level2-test', title: 'Level 2 test', about: 'Mixed: everything so far. No hints.', any: ['pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'capturingDefender', 'mateIn2', 'fork'], rating: [700, 1300], size: 30, test: true },
  { id: 'mix-2', title: 'Mix 2', about: 'Unlabelled review of Level 2.', any: ['pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'capturingDefender', 'mateIn2', 'fork', 'hangingPiece'], rating: [700, 1400], size: 60, test: true },
  // Ongoing
  // Second sets: unlock once the first set of the theme is passed, for when the first is fluent.
  { id: 'hanging-2', after: 'hanging', title: 'Free pieces II', about: 'More free material, a little harder to spot.', any: ['hangingPiece'], rating: [700, 1300], size: 25 },
  { id: 'mate1-2', after: 'mate1', title: 'Mate in one II', about: 'Harder one-move mates.', any: ['mateIn1'], rating: [800, 1400], size: 25 },
  { id: 'backrank-2', after: 'backrank', title: 'Back-rank mates II', about: 'Back-rank ideas, a step harder.', any: ['backRankMate'], rating: [900, 1500], size: 25 },
  { id: 'fork-3', after: 'fork-2', title: 'Forks III', about: 'Forks that need a forcing move first.', any: ['fork'], rating: [1100, 1500], size: 25 },
  { id: 'pin-2', after: 'pin', title: 'Pins II', about: 'Harder pins.', any: ['pin'], rating: [900, 1500], size: 25 },
  { id: 'skewer-2', after: 'skewer', title: 'Skewers II', about: 'Harder skewers.', any: ['skewer'], rating: [900, 1500], size: 25 },
  { id: 'discovered-2', after: 'discovered', title: 'Discovered attacks II', about: 'Harder discoveries.', any: ['discoveredAttack'], rating: [900, 1500], size: 25 },
  { id: 'double-check-2', after: 'double-check', title: 'Double checks II', about: 'Harder double checks.', any: ['doubleCheck'], rating: [1000, 1600], size: 25 },
  { id: 'defender-2', after: 'defender', title: 'Removing the defender II', about: 'Harder defender removal.', any: ['capturingDefender'], rating: [1000, 1600], size: 25 },
  { id: 'mate2-2', after: 'mate2', title: 'Mate in two II', about: 'Harder two-move mates.', any: ['mateIn2'], rating: [1000, 1600], size: 25 },
  { id: 'f7-2', after: 'f7', title: 'Attacking f7 and f2 II', about: 'Harder attacks on the weak squares.', any: ['attackingF2F7'], rating: [1000, 1600], size: 25 },
  // Daily pool: 10 a day, so 3,000 lasts about ten months before repeating.
  { id: 'daily', title: 'Daily puzzles', about: 'A mixed pool for homework.', any: [], rating: [500, 1500], size: 3000, test: true },
];
