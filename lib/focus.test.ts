import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFocus } from "./focus.ts";

const near = (a: number[], b: number[]) =>
  a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-9, `${a} vs ${b}`));

test("parses percent pairs used in lib/content.ts", () => {
  near(parseFocus("18.5% 50%"), [0.185, 0.5]);
  near(parseFocus("50% 31.4%"), [0.5, 0.314]);
  near(parseFocus("0% 0%"), [0, 0]);
  near(parseFocus("100% 50%"), [1, 0.5]);
});

test("undefined and garbage fall back to centre", () => {
  near(parseFocus(undefined), [0.5, 0.5]);
  near(parseFocus("garbage"), [0.5, 0.5]);
  near(parseFocus("center top"), [0.5, 0.5]);
});

test("out-of-range values are clamped", () => {
  near(parseFocus("150% -10%"), [1, 0]);
});
