import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  legalMove,
  pour,
  solve,
  isSolved,
  validBoard,
  possibleMoves,
} from "../src/engine.ts";
const levels = JSON.parse(
  readFileSync(new URL("../src/levels.json", import.meta.url), "utf8"),
);
test("pour transfers the largest fitting same-colour run and does not mutate input", () => {
  const board = [[0, 1, 1], [1, 1, 1], []];
  const copy = structuredClone(board);
  assert.deepEqual(legalMove(board, 0, 1), {
    from: 0,
    to: 1,
    count: 1,
    color: 1,
  });
  assert.deepEqual(pour(board, 0, 1), [[0, 1], [1, 1, 1, 1], []]);
  assert.deepEqual(board, copy);
  assert.deepEqual(pour(board, 0, 2), [[0], [1, 1, 1], [1, 1]]);
});
test("rejects same-bottle, empty-source, full-destination and mismatched-top pours", () => {
  const b = [[0], [1], [0, 0, 0, 0], []];
  for (const [from, to] of [
    [0, 0],
    [3, 0],
    [0, 2],
    [0, 1],
    [-1, 0],
    [0, 99],
  ])
    assert.equal(pour(b, from, to), null);
});
test("every shipped puzzle preserves counts and its stored solution actually solves it", () => {
  assert.equal(levels.length, 100);
  for (const level of levels) {
    assert.equal(validBoard(level.board, level.colors), true);
    assert.equal(isSolved(level.board), false);
    let b = level.board;
    for (const move of level.solution) {
      const next = pour(b, move.from, move.to);
      assert.ok(next, `Invalid move in puzzle ${level.id}`);
      assert.equal(validBoard(next, level.colors), true);
      b = next;
    }
    assert.equal(isSolved(b), true);
    assert.equal(level.minMoves, level.solution.length);
  }
});
test("live hint search finds valid solutions after a player deviates from the stored path", () => {
  for (const level of [levels[0], levels[8], levels[17]]) {
    const stored = level.solution[0];
    const first = possibleMoves(level.board).find(
      (m) => m.from !== stored.from || m.to !== stored.to,
    );
    assert.ok(first);
    const start = pour(level.board, first.from, first.to);
    const result = solve(start);
    assert.equal(result.status, "solved");
    let b = start;
    for (const m of result.moves) {
      b = pour(b, m.from, m.to);
      assert.ok(b);
    }
    assert.equal(isSolved(b), true);
  }
});
test("solver distinguishes impossible positions and search limits", () => {
  assert.equal(
    solve([
      [0, 1, 0, 1],
      [1, 0, 1, 0],
    ]).status,
    "unsolvable",
  );
  assert.equal(solve(levels[0].board, 1).status, "limit");
  assert.deepEqual(solve([[0, 0, 0, 0], []]).moves, []);
});
test("partial uniform bottles do not count as a completed puzzle", () => {
  assert.equal(isSolved([[0, 0], [0, 0], []]), false);
  assert.equal(validBoard([[0, 0, 0, 0], [], []], 1), true);
  assert.equal(validBoard([[0, 0, 0, 0, 0], [], []], 1), false);
});

test("the original campaign is unchanged for existing saves", () => {
  const original = JSON.parse(
    readFileSync(
      new URL("./fixtures/original-levels.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(levels.slice(0, 18), original);
  assert.equal(
    new Set(
      levels.map((l) =>
        l.board
          .map((t) => t.join(""))
          .sort()
          .join("|"),
      ),
    ).size,
    100,
  );
});
