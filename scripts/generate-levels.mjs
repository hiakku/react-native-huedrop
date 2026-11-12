import { readFileSync, writeFileSync } from "node:fs";
import { CAPACITY, canonical, isSolved, solve, topRun } from "../src/engine.ts";
let seed = 984172;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
// Keep the original campaign stable so existing saves remain valid.
const levels = JSON.parse(
  readFileSync("tests/fixtures/original-levels.json", "utf8"),
);
const keys = new Set(levels.map((l) => canonical(l.board)));
for (let colors = 4; colors <= 5; colors++) {
  const candidates = [];
  for (let trial = 0; trial < 1200; trial++) {
    const board = Array.from({ length: colors + 2 }, (_, i) =>
      i < colors ? Array(CAPACITY).fill(i) : [],
    );
    for (let step = 0; step < 35 + colors * 12; step++) {
      const moves = [];
      for (let from = 0; from < board.length; from++)
        for (let to = 0; to < board.length; to++) {
          if (
            from === to ||
            !board[from].length ||
            board[to].length === CAPACITY
          )
            continue;
          const src = board[from],
            dst = board[to],
            color = src.at(-1),
            run = topRun(src);
          if (dst.at(-1) === color) continue;
          for (let n = 1; n <= Math.min(run, CAPACITY - dst.length); n++) {
            if (n === run && n < src.length) continue; // Reverse must leave a compatible source.
            moves.push({ from, to, n, color });
          }
        }
      if (!moves.length) break;
      const m = moves[Math.floor(random() * moves.length)];
      board[m.from].splice(-m.n);
      board[m.to].push(...Array(m.n).fill(m.color));
    }
    if (isSolved(board)) continue;
    const key = canonical(board);
    if (keys.has(key)) continue;
    const result = solve(board, 45000);
    if (
      result.status !== "solved" ||
      result.moves.length < (colors === 4 ? 9 : 11)
    )
      continue;
    keys.add(key);
    candidates.push({
      colors,
      board,
      solution: result.moves,
      minMoves: result.moves.length,
    });
  }
  candidates.sort((a, b) => a.minMoves - b.minMoves);
  const count = colors === 4 ? 22 : 60;
  if (candidates.length < count) throw new Error("Not enough verified puzzles");
  for (let i = 0; i < count; i++) {
    const c =
      candidates[Math.floor((i * (candidates.length - 1)) / (count - 1))];
    levels.push({ ...c, id: levels.length + 1 });
  }
}
writeFileSync("src/levels.json", JSON.stringify(levels, null, 2) + "\n");
console.log(
  levels.map((l) => ({ id: l.id, colors: l.colors, minMoves: l.minMoves })),
);
