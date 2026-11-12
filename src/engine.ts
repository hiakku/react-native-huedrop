export const CAPACITY = 4;
export type Board = number[][]; // Each bottle is stored bottom to top.
export type Move = { from: number; to: number; count: number; color: number };
export function isComplete(tube: number[]): boolean {
  return tube.length === CAPACITY && tube.every((c) => c === tube[0]);
}
export function isSolved(board: Board): boolean {
  return board.every((t) => t.length === 0 || isComplete(t));
}
export function topRun(tube: number[]): number {
  let n = 0;
  const color = tube[tube.length - 1];
  for (let i = tube.length - 1; i >= 0 && tube[i] === color; i--) n++;
  return n;
}
export function legalMove(board: Board, from: number, to: number): Move | null {
  if (from === to || !board[from] || !board[to]) return null;
  const src = board[from],
    dst = board[to];
  if (!src.length || dst.length >= CAPACITY) return null;
  const color = src[src.length - 1];
  if (dst.length && dst[dst.length - 1] !== color) return null;
  return {
    from,
    to,
    count: Math.min(topRun(src), CAPACITY - dst.length),
    color,
  };
}
export function pour(board: Board, from: number, to: number): Board | null {
  const move = legalMove(board, from, to);
  if (!move) return null;
  return board.map((tube, i) =>
    i === from
      ? tube.slice(0, -move.count)
      : i === to
        ? [...tube, ...Array(move.count).fill(move.color)]
        : [...tube],
  );
}
export function possibleMoves(board: Board): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < board.length; i++)
    for (let j = 0; j < board.length; j++) {
      if (isComplete(board[i])) continue;
      const m = legalMove(board, i, j);
      if (m) moves.push(m);
    }
  return moves;
}
export function canonical(board: Board): string {
  return board
    .map((t) => t.join(""))
    .sort()
    .join("|");
}
export type SearchResult =
  | { status: "solved"; moves: Move[]; visited: number }
  | { status: "unsolvable" | "limit"; moves: []; visited: number };
// Symmetry-aware breadth-first search. Canonicalisation only merges bottle
// permutations; retained nodes keep actual bottle indices for playable hints.
export function solve(board: Board, limit = 80000): SearchResult {
  if (isSolved(board)) return { status: "solved", moves: [], visited: 1 };
  const nodes: { board: Board; parent: number; move: Move | null }[] = [
    { board, parent: -1, move: null },
  ];
  const seen = new Set([canonical(board)]);
  for (let head = 0; head < nodes.length; head++) {
    const node = nodes[head];
    for (const move of possibleMoves(node.board)) {
      const next = pour(node.board, move.from, move.to)!;
      const key = canonical(next);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes.push({ board: next, parent: head, move });
      if (isSolved(next)) {
        const result: Move[] = [];
        let at = nodes.length - 1;
        while (nodes[at].parent >= 0) {
          result.push(nodes[at].move!);
          at = nodes[at].parent;
        }
        return {
          status: "solved",
          moves: result.reverse(),
          visited: seen.size,
        };
      }
      if (seen.size >= limit)
        return { status: "limit", moves: [], visited: seen.size };
    }
  }
  return { status: "unsolvable", moves: [], visited: seen.size };
}
export function validBoard(board: unknown, colors: number): board is Board {
  if (!Array.isArray(board) || board.length !== colors + 2) return false;
  const counts = Array(colors).fill(0);
  for (const tube of board) {
    if (!Array.isArray(tube) || tube.length > CAPACITY) return false;
    for (const c of tube) {
      if (!Number.isInteger(c) || c < 0 || c >= colors) return false;
      counts[c]++;
    }
  }
  return counts.every((n) => n === CAPACITY);
}
