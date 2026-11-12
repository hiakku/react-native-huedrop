import levels from "./levels.json";
import { Board, validBoard } from "./engine";
export { levels };
export type Session = {
  level: number;
  board: Board;
  history: Board[];
  moves: number;
  best: Record<string, number>;
  labels: boolean;
  motion: boolean;
  hintCredits: number;
};
export function fresh(
  level = 0,
  best: Record<string, number> = {},
  labels = false,
  motion = true,
  hintCredits = 3,
): Session {
  return {
    level,
    board: levels[level].board.map((t) => [...t]),
    history: [],
    moves: 0,
    best,
    labels,
    motion,
    hintCredits,
  };
}
export function parseSession(raw: string): Session {
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !data.game)
    throw new Error("Unsupported progress");
  const g = data.game;
  if (!Number.isInteger(g.level) || g.level < 0 || g.level >= levels.length)
    throw new Error("Invalid level");
  const colors = levels[g.level].colors;
  if (
    !validBoard(g.board, colors) ||
    !Array.isArray(g.history) ||
    g.history.length > 200 ||
    !g.history.every((b: unknown) => validBoard(b, colors)) ||
    !Number.isInteger(g.moves) ||
    g.moves < g.history.length ||
    g.moves > 100000 ||
    typeof g.labels !== "boolean" ||
    typeof g.motion !== "boolean" ||
    !g.best ||
    typeof g.best !== "object" ||
    Array.isArray(g.best)
  )
    throw new Error("Invalid game");
  if (
    !Object.entries(g.best).every(
      ([key, value]) =>
        /^\d+$/.test(key) &&
        Number(key) >= 0 &&
        Number(key) < levels.length &&
        Number.isInteger(value) &&
        Number(value) >= 0 &&
        Number(value) <= 100000,
    )
  )
    throw new Error("Invalid scores");
  // v1 saves from the ad-free prototype receive the same starter balance.
  if (g.hintCredits === undefined) g.hintCredits = 3;
  if (
    !Number.isInteger(g.hintCredits) ||
    g.hintCredits < 0 ||
    g.hintCredits > 10000
  )
    throw new Error("Invalid hint balance");
  return g;
}
export function stars(moves: number, minimum: number) {
  return moves <= minimum ? 3 : moves <= minimum + 3 ? 2 : 1;
}
