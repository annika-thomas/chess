import { Chess } from 'chess.js';
import { REPERTOIRE } from '../data';
import type { RepertoireLine, Side } from '../types';
import { fenKey, parseLine, sameSan, tryMove } from './notation';
import type { GameDrill, ImportReport, OpeningStat, PlatformRating } from './store';

export interface Game {
  url: string;
  mySide: Side;
  opponent: string;
  result: 'win' | 'draw' | 'loss';
  moves: string[];
  opening: string;
  date: string;
  /** The learner's rating in this game and its time control, when the site reports it. */
  myRating?: number;
  speed?: string;
}

// ───────────── Fetching ─────────────

interface LichessGame {
  id: string;
  variant: string;
  speed?: string;
  createdAt: number;
  winner?: 'white' | 'black';
  moves: string;
  opening?: { name: string };
  players: { white: { user?: { name: string }; rating?: number }; black: { user?: { name: string }; rating?: number } };
}

export async function fetchLichess(username: string, max = 60): Promise<Game[]> {
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${max}&opening=true&moves=true`;
  const res = await fetch(url, { headers: { Accept: 'application/x-ndjson' } });
  if (res.status === 404) throw new Error(`No Lichess user "${username}"`);
  if (!res.ok) throw new Error(`Lichess returned ${res.status}`);
  const text = await res.text();
  const me = username.toLowerCase();
  return text
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as LichessGame)
    .filter((g) => g.variant === 'standard' && g.moves)
    .map((g) => {
      const mySide: Side = g.players.white.user?.name.toLowerCase() === me ? 'w' : 'b';
      const opp = (mySide === 'w' ? g.players.black : g.players.white).user?.name ?? 'Anonymous';
      const won = g.winner ? (g.winner === 'white') === (mySide === 'w') : undefined;
      return {
        url: `https://lichess.org/${g.id}`,
        mySide,
        opponent: opp,
        result: won === undefined ? 'draw' : won ? 'win' : 'loss',
        moves: g.moves.split(' '),
        opening: g.opening?.name ?? 'Unknown',
        date: new Date(g.createdAt).toISOString().slice(0, 10),
        myRating: (mySide === 'w' ? g.players.white : g.players.black).rating,
        speed: g.speed,
      } satisfies Game;
    });
}

interface ChessComGame {
  url: string;
  pgn?: string;
  rules: string;
  end_time: number;
  eco?: string;
  time_class?: string;
  white: { username: string; result: string; rating?: number };
  black: { username: string; result: string; rating?: number };
}

const DRAWS = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient']);

export async function fetchChessCom(username: string, max = 60): Promise<Game[]> {
  const base = `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}`;
  const res = await fetch(`${base}/games/archives`);
  if (res.status === 404) throw new Error(`No Chess.com user "${username}"`);
  if (!res.ok) throw new Error(`Chess.com returned ${res.status}`);
  const { archives } = (await res.json()) as { archives: string[] };
  const games: ChessComGame[] = [];
  for (const url of archives.slice().reverse()) {
    const r = await fetch(url);
    if (!r.ok) break;
    const { games: month } = (await r.json()) as { games: ChessComGame[] };
    games.push(...month.reverse());
    if (games.length >= max) break;
  }
  const me = username.toLowerCase();
  return games
    .filter((g) => g.rules === 'chess' && g.pgn)
    .slice(0, max)
    .flatMap((g): Game[] => {
      const chess = new Chess();
      try {
        chess.loadPgn(g.pgn!);
      } catch {
        return [];
      }
      const mySide: Side = g.white.username.toLowerCase() === me ? 'w' : 'b';
      const mine = mySide === 'w' ? g.white : g.black;
      const opp = mySide === 'w' ? g.black : g.white;
      const result = mine.result === 'win' ? 'win' : DRAWS.has(mine.result) ? 'draw' : 'loss';
      const opening = g.eco
        ? decodeURIComponent(g.eco.split('/').pop() ?? '')
            .replace(/-/g, ' ')
            .replace(/\s\d.*$/, '')
        : 'Unknown';
      return [
        {
          url: g.url,
          mySide,
          opponent: opp.username,
          result,
          moves: chess.history(),
          opening,
          date: new Date(g.end_time * 1000).toISOString().slice(0, 10),
          myRating: mine.rating,
          speed: g.time_class,
        },
      ];
    });
}

// ───────────── Grading against the repertoire ─────────────

interface BookEntry {
  /** Moves the repertoire plays (or knows for the opponent) from this position. */
  moves: Map<string, { note: string; line: RepertoireLine }>;
}

type Book = Map<string, BookEntry>;

/** Position → known continuations, built from every repertoire line for one side. */
export function buildBook(side: Side, lines: RepertoireLine[] = REPERTOIRE): Book {
  const book: Book = new Map();
  for (const line of lines.filter((l) => l.side === side)) {
    const { moves, notes } = parseLine(line.line);
    const chess = new Chess();
    moves.forEach((san, i) => {
      const key = fenKey(chess.fen());
      const entry = book.get(key) ?? { moves: new Map() };
      const played = chess.move(san).san;
      if (!entry.moves.has(played)) entry.moves.set(played, { note: notes[i], line });
      book.set(key, entry);
    });
  }
  return book;
}

export type GameVerdict =
  | { kind: 'followed'; plies: number }
  | { kind: 'opp-left'; plies: number }
  | { kind: 'outside' }
  | { kind: 'deviated'; ply: number; played: string; expected: string[]; note: string; line: RepertoireLine };

export function gradeGame(game: Game, book: Book): GameVerdict {
  const chess = new Chess();
  for (let i = 0; i < game.moves.length; i++) {
    const entry = book.get(fenKey(chess.fen()));
    const mine = chess.turn() === game.mySide;
    if (!entry) return i < 2 ? { kind: 'outside' } : { kind: 'followed', plies: i };
    const played = game.moves[i];
    const known = [...entry.moves.keys()].find((m) => sameSan(m, played));
    if (!known) {
      if (!mine) return i < 2 ? { kind: 'outside' } : { kind: 'opp-left', plies: i };
      // Leaving the repertoire on your very first move is a choice, not a memory slip.
      if (i < 2) return { kind: 'outside' };
      const [expected, info] = [...entry.moves.entries()][0];
      return {
        kind: 'deviated',
        ply: i,
        played,
        expected: [...entry.moves.keys()],
        note: info.note || `${expected} is your repertoire move here (${info.line.name}).`,
        line: info.line,
      };
    }
    if (!tryMove(chess, played)) return { kind: 'followed', plies: i };
  }
  return { kind: 'followed', plies: game.moves.length };
}

/** Turn a deviation into a "what does your repertoire play here?" drill. */
export function makeDrill(g: Game, v: Extract<GameVerdict, { kind: 'deviated' }>): GameDrill {
  const setup = g.moves.slice(0, v.ply).join(' ');
  return {
    type: 'find',
    id: hash(setup + '|' + v.played),
    side: g.mySide,
    setup,
    solution: [v.expected[0]],
    accept: v.expected.slice(1),
    prompt: `In your game vs ${g.opponent} you played ${moveLabel(v.ply, v.played)}. What does your repertoire play here?`,
    explain: `${moveLabel(v.ply, v.expected[0])}: ${v.note}`,
    tags: ['from-games'],
    gameUrl: g.url,
    played: v.played,
    opponent: g.opponent,
    date: g.date,
  };
}

/** Latest rating per site and time control. */
export function latestRatings(games: Game[], source: PlatformRating['source']): PlatformRating[] {
  const out = new Map<string, PlatformRating>();
  for (const g of games) {
    if (!g.myRating || !g.speed) continue;
    const prev = out.get(g.speed);
    if (!prev || g.date > prev.date) out.set(g.speed, { source, speed: g.speed, rating: g.myRating, date: g.date });
  }
  return [...out.values()];
}

function moveLabel(ply: number, san: string): string {
  const n = Math.floor(ply / 2) + 1;
  return ply % 2 === 0 ? `${n}.${san}` : `${n}...${san}`;
}

export interface Analysis {
  report: ImportReport;
  drills: GameDrill[];
}

export function analyzeGames(games: Game[], source: ImportReport['source'], username: string): Analysis {
  const books = { w: buildBook('w'), b: buildBook('b') };
  const report: ImportReport = {
    source,
    username,
    fetchedAt: Date.now(),
    games: games.length,
    openings: [],
    followed: 0,
    deviated: 0,
    oppDeviated: 0,
    outside: 0,
  };
  const stats = new Map<string, OpeningStat>();
  const drills = new Map<string, GameDrill>();

  for (const g of games) {
    const family = g.opening.split(':')[0].trim() || 'Unknown';
    const key = `${g.mySide}:${family}`;
    const s = stats.get(key) ?? { name: family, side: g.mySide, games: 0, wins: 0, draws: 0, losses: 0 };
    s.games++;
    if (g.result === 'win') s.wins++;
    else if (g.result === 'draw') s.draws++;
    else s.losses++;
    stats.set(key, s);

    const v = gradeGame(g, books[g.mySide]);
    if (v.kind === 'followed') report.followed++;
    else if (v.kind === 'opp-left') report.oppDeviated++;
    else if (v.kind === 'outside') report.outside++;
    else {
      report.deviated++;
      const drill = makeDrill(g, v);
      if (!drills.has(drill.id)) drills.set(drill.id, drill);
    }
  }
  report.openings = [...stats.values()].sort((a, b) => b.games - a.games);
  return { report, drills: [...drills.values()] };
}

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
