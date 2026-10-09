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
  { id: 'daily', title: 'Daily puzzles', about: 'A mixed pool for homework.', any: [], rating: [500, 1400], size: 300, test: true },
];
