import { test } from "node:test";
import assert from "node:assert/strict";
import { runPool } from "./preload-queue.ts";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

test("processes every item once and never exceeds the limit", async () => {
  let active = 0;
  let peak = 0;
  const seen: number[] = [];
  await runPool([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
    active++;
    peak = Math.max(peak, active);
    await sleep(5);
    seen.push(n);
    active--;
  });
  assert.deepEqual(seen.sort(), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(peak, 3);
});

test("stops taking new items once cancelled", async () => {
  const seen: number[] = [];
  let cancelled = false;
  await runPool([1, 2, 3, 4, 5, 6], 1, async (n) => {
    seen.push(n);
    if (n === 2) cancelled = true;
  }, () => cancelled);
  assert.deepEqual(seen, [1, 2]);
});

test("empty list resolves", async () => {
  await runPool([], 3, async () => {});
});
