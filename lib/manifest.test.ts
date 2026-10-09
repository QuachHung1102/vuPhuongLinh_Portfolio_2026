import { test } from "node:test";
import assert from "node:assert/strict";
import { buildManifest, planFor, type ImageRef } from "./manifest.ts";

const ref = (src: string, sizes = "73vw"): ImageRef => ({ src, sizes });
const srcs = (r: ImageRef[]) => r.map((x) => x.src);

const m = buildManifest({
  home: [ref("h1", "90vw"), ref("h2", "90vw")],
  aboutHero: ref("hero", "100vw"),
  aboutGallery: [ref("g1", "35vw"), ref("g2", "35vw")],
  sections: [
    { slug: "competition", items: [{ images: ["c1a", "c1b"] }, { images: ["c2"] }, { images: [] }] },
    { slug: "performing", items: [{ images: ["p1"] }] },
  ],
  slideSizes: "73vw",
});

test("route order follows site navigation", () => {
  assert.deepEqual(m.order, ["/", "/about", "/competition", "/performing"]);
});

test("section critical = first image of each item; empty item skipped", () => {
  assert.deepEqual(srcs(m.routes["/competition"].critical), ["c1a", "c2"]);
  assert.deepEqual(srcs(m.routes["/competition"].all), ["c1a", "c1b", "c2"]);
});

test("landing on / : critical is home, rest walks the other routes in order", () => {
  const p = planFor(m, "/");
  assert.deepEqual(srcs(p.critical), ["h1", "h2"]);
  assert.deepEqual(srcs(p.rest), ["hero", "g1", "g2", "c1a", "c1b", "c2", "p1"]);
});

test("landing on a section : its own leftovers come first", () => {
  const p = planFor(m, "/competition");
  assert.deepEqual(srcs(p.critical), ["c1a", "c2"]);
  assert.deepEqual(srcs(p.rest), ["c1b", "h1", "h2", "hero", "g1", "g2", "p1"]);
});

test("critical + rest has no duplicates and covers everything", () => {
  const p = planFor(m, "/about");
  const keys = [...p.critical, ...p.rest].map((r) => `${r.src}|${r.sizes}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(keys.length, 9);
});

test("trailing slash is normalised", () => {
  assert.deepEqual(planFor(m, "/competition/"), planFor(m, "/competition"));
});

test("unknown path : nothing critical, everything in rest", () => {
  const p = planFor(m, "/nope");
  assert.deepEqual(p.critical, []);
  assert.equal(p.rest.length, 9);
});
