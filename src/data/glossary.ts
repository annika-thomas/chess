/**
 * Chess words the course uses. In lesson text, the first mention of each gets a dotted underline;
 * tapping it shows the definition, so no lesson assumes vocabulary you haven't met.
 */
export interface Term {
  key: string;
  title: string;
  def: string;
  /** Matches the word and its forms in running text (case-insensitive, whole words). */
  pattern: RegExp;
}

export const GLOSSARY: Term[] = [
  {
    key: 'fork',
    title: 'Fork',
    def: 'One piece attacking two (or more) enemy pieces at the same time. Your opponent can only save one. Knights are famous for it.',
    pattern: /\bfork(?:s|ed|ing)?\b/i,
  },
  {
    key: 'pin',
    title: 'Pin',
    def: 'A piece that can’t move without exposing a more valuable piece behind it. If the piece behind is the king, moving is illegal.',
    pattern: /\bpin(?:s|ned|ning)?\b/i,
  },
  {
    key: 'discovered',
    title: 'Discovered attack',
    def: 'Moving one piece out of the way so the piece behind it attacks. If the uncovered attack is a check, it’s a discovered check.',
    pattern: /\bdiscover(?:ed|y|ies)(?: (?:attack|check)s?)?\b/i,
  },
  {
    key: 'double-check',
    title: 'Double check',
    def: 'Two pieces giving check at once. Blocking or capturing can’t stop both, so the king must move.',
    pattern: /\bdouble checks?\b/i,
  },
  {
    key: 'hanging',
    title: 'Hanging piece',
    def: 'A piece that is attacked and not defended, so it can be taken for free.',
    pattern: /\bhanging\b/i,
  },
  {
    key: 'tempo',
    title: 'Tempo',
    def: 'One move’s worth of time. “Gaining a tempo” means making a useful move that also forces your opponent to react, like developing a piece while attacking their queen.',
    pattern: /\btemp(?:o|i)\b/i,
  },
  {
    key: 'development',
    title: 'Development',
    def: 'Moving your knights and bishops (and later queen and rooks) off the back rank to useful squares, so they can take part in the game.',
    pattern: /\bdevelop(?:ment|s|ed|ing)?\b/i,
  },
  {
    key: 'center',
    title: 'The center',
    def: 'The four middle squares, d4, e4, d5 and e5, and the area around them. Pieces there control more of the board.',
    pattern: /\bcent(?:er|re)\b/i,
  },
  {
    key: 'gambit',
    title: 'Gambit',
    def: 'An opening where one side offers a pawn (or more) to get faster development or an attack.',
    pattern: /\bgambits?\b/i,
  },
  {
    key: 'sacrifice',
    title: 'Sacrifice',
    def: 'Giving up material on purpose to get something better: an attack, a checkmate, or more material later.',
    pattern: /\bsacrific(?:e|es|ed|ing)\b/i,
  },
  {
    key: 'book',
    title: 'Book move',
    def: 'A move from your prepared opening lines (your repertoire). “Leaving book” means the game has moved past what you prepared.',
    pattern: /\bbook moves?\b|\bout of book\b|\bin book\b/i,
  },
  {
    key: 'repertoire',
    title: 'Repertoire',
    def: 'The set of openings you’ve chosen to play, as White and as Black. This app teaches you one.',
    pattern: /\brepertoire\b/i,
  },
  {
    key: 'transposition',
    title: 'Transposition',
    def: 'Reaching the same position by a different order of moves. Recognizing it means less to memorize.',
    pattern: /\btranspos(?:ition|itions|es|ed)\b/i,
  },
  {
    key: 'pawn-chain',
    title: 'Pawn chain',
    def: 'Pawns linked diagonally, each protecting the next (like d4–e5). Attack a chain at its base, the pawn at the back.',
    pattern: /\bpawn chains?\b/i,
  },
  {
    key: 'iqp',
    title: 'Isolated pawn',
    def: 'A pawn with no friendly pawns on the files next to it, so no pawn can protect it. An isolated d-pawn is called an IQP: it gives space and activity but can become a target.',
    pattern: /\bisolated (?:queen )?(?:d-)?pawns?\b|\bIQP\b/i,
  },
  {
    key: 'open-file',
    title: 'Open file',
    def: 'A file (column) with no pawns on it. Rooks love open files because nothing blocks them.',
    pattern: /\bopen (?:d-|e-|c-|f-|h-)?files?\b/i,
  },
  {
    key: 'minor',
    title: 'Minor pieces',
    def: 'Knights and bishops (worth about 3 each). Rooks and queens are the major pieces.',
    pattern: /\bminor pieces?\b/i,
  },
  {
    key: 'exchange',
    title: 'Trade / exchange',
    def: 'Capturing a piece and letting your opponent capture one back. “Winning the exchange” means getting a rook (5) for a knight or bishop (3).',
    pattern: /\bthe exchange\b/i,
  },
  {
    key: 'smothered',
    title: 'Smothered mate',
    def: 'Checkmate by a knight against a king that is boxed in by its own pieces.',
    pattern: /\bsmothered mate\b/i,
  },
  {
    key: 'initiative',
    title: 'Initiative',
    def: 'Being the one making threats, so your opponent has to keep reacting instead of carrying out their own plans.',
    pattern: /\binitiative\b/i,
  },
];

export const termByKey = new Map(GLOSSARY.map((t) => [t.key, t]));
