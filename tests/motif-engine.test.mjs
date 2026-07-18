import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SETTINGS,
  STARTER_MOTIFS,
  buildCompositionMotif,
  buildInstances,
  classifySvgPaintMode,
  createComposePartTransforms,
  exportFlattenedSvg,
  normalizeMotifGeometry,
  parseInlineSvgStyle,
  resolveComposePartTransforms,
} from "../app/apps/motif/motif-engine.ts";

const activeIds = ["bloom", "leaf", "sprig", "berries", "petal", "daisy"];

function layoutSettings(patch = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...patch };
  return {
    algorithmVersion: settings.algorithmVersion,
    columns: settings.columns,
    gridAssignment: settings.gridAssignment,
    gridOffset: settings.gridOffset,
    height: settings.height,
    layoutMode: settings.layoutMode,
    minDistance: settings.minDistance,
    motifWeights: settings.motifWeights,
    organicStrategy: settings.organicStrategy,
    rotation: settings.rotation,
    scaleMax: settings.scaleMax,
    scaleMin: settings.scaleMin,
    seed: settings.seed,
    surfaceMode: settings.surfaceMode,
    targetCount: settings.targetCount,
    width: settings.width,
  };
}

function toroidalDistance(a, b, width, height) {
  const dx = Math.min(Math.abs(a.x - b.x), width - Math.abs(a.x - b.x));
  const dy = Math.min(Math.abs(a.y - b.y), height - Math.abs(a.y - b.y));
  return Math.hypot(dx, dy);
}

function assertToroidalClearance(result, settings) {
  for (let left = 0; left < result.instances.length; left += 1) {
    for (let right = left + 1; right < result.instances.length; right += 1) {
      const a = result.instances[left];
      const b = result.instances[right];
      assert.ok(
        toroidalDistance(a, b, settings.width, settings.height)
          >= a.radius + b.radius + settings.minDistance - 1e-8,
        `collision leaked between ${a.id} and ${b.id}`,
      );
    }
  }
}

test("new projects default to the safer finite artboard surface", () => {
  assert.equal(DEFAULT_SETTINGS.surfaceMode, "artboard");
});

test("the starter project opens with a complete, warning-free layout", () => {
  const result = buildInstances(STARTER_MOTIFS, activeIds, layoutSettings());
  assert.equal(result.status, "complete");
  assert.equal(result.placedCount, DEFAULT_SETTINGS.targetCount);
});

test("safe inline SVG paint styles are preserved while effect references are rejected", () => {
  assert.deepEqual(
    parseInlineSvgStyle("fill:#f26f4b; stroke: currentColor; stroke-width:2; enable-background:new 0 0 24 24"),
    { fill: "#f26f4b", stroke: "currentColor", "stroke-width": "2" },
  );
  assert.throws(() => parseInlineSvgStyle("fill:url(#gradient)"), /渐变/);
  assert.throws(() => parseInlineSvgStyle("mix-blend-mode:multiply"), /暂不支持/);
});

test("unknown normalized motifs use a conservative corner radius", () => {
  const motif = {
    id: "legacy",
    name: "Legacy upload",
    category: "Project",
    source: "upload",
    body: '<rect width="100" height="100"/>',
  };
  const settings = layoutSettings({
    scaleMax: 0.5,
    scaleMin: 0.5,
    targetCount: 2,
  });
  const result = buildInstances([motif], [motif.id], settings);

  for (const item of result.instances) {
    assert.ok(Math.abs(item.radius - Math.hypot(50, 50) * 0.5) < 1e-10);
  }
});

test("dense organic is deterministic and never forces overlaps", () => {
  const settings = layoutSettings({ organicStrategy: "dense", surfaceMode: "repeat" });
  const first = buildInstances(STARTER_MOTIFS, activeIds, settings);
  const second = buildInstances(STARTER_MOTIFS, activeIds, settings);

  assert.deepEqual(first, second);
  assert.equal(first.status, "complete");
  assertToroidalClearance(first, settings);
});

test("repeat collision remains safe across dimensions and many seeds", () => {
  for (let seed = 1; seed <= 120; seed += 1) {
    const settings = layoutSettings({
      height: 241,
      minDistance: 3,
      organicStrategy: seed % 2 ? "dense" : "classic",
      scaleMax: 0.72,
      scaleMin: 0.28,
      seed,
      surfaceMode: "repeat",
      targetCount: 72,
      width: 377,
    });
    const result = buildInstances(STARTER_MOTIFS, activeIds, settings);
    assertToroidalClearance(result, settings);
  }
});

test("repeat rejects a motif that would collide with its own periodic copy", () => {
  const settings = layoutSettings({
    height: 75,
    minDistance: 4,
    scaleMax: 1,
    scaleMin: 1,
    surfaceMode: "repeat",
    targetCount: 1,
    width: 75,
  });
  const result = buildInstances(STARTER_MOTIFS, ["bloom"], settings);

  assert.equal(result.placedCount, 0);
  assert.equal(result.status, "capacity-limited");
});

test("organic placement reports real capacity instead of forcing overlap", () => {
  const settings = layoutSettings({
    targetCount: 96,
    minDistance: 28,
    scaleMin: 1.2,
    scaleMax: 1.4,
  });
  const result = buildInstances(STARTER_MOTIFS, activeIds, settings);

  assert.equal(result.status, "capacity-limited");
  assert.equal(result.unplacedCount, result.requestedCount - result.placedCount);
  assert.ok(result.placedCount > 0);
  assert.ok(result.placedCount < result.requestedCount);
});

test("finite organic placement keeps collision bounds inside the artboard", () => {
  const settings = layoutSettings({ surfaceMode: "artboard", targetCount: 48 });
  const result = buildInstances(STARTER_MOTIFS, activeIds, settings);

  for (const instance of result.instances) {
    assert.ok(instance.x - instance.radius >= 0);
    assert.ok(instance.y - instance.radius >= 0);
    assert.ok(instance.x + instance.radius <= settings.width);
    assert.ok(instance.y + instance.radius <= settings.height);
  }
});

test("grid supports half-cell offsets and alternate assignment", () => {
  const settings = layoutSettings({
    layoutMode: "grid",
    targetCount: 12,
    columns: 4,
    gridOffset: "row",
    gridAssignment: "alternate",
  });
  const result = buildInstances(STARTER_MOTIFS, ["bloom", "daisy"], settings);
  const firstRow = result.instances.slice(0, 4);
  const secondRow = result.instances.slice(4, 8);

  assert.deepEqual(firstRow.map((item) => item.motifId), ["bloom", "daisy", "bloom", "daisy"]);
  assert.deepEqual(secondRow.map((item) => item.motifId), ["daisy", "bloom", "daisy", "bloom"]);
  assert.notDeepEqual(firstRow.map((item) => item.x), secondRow.map((item) => item.x));
});

test("grid preserves activeIds order and alternate cycles every active motif", () => {
  const orderedIds = ["petal", "bloom", "leaf"];
  const sequence = buildInstances(STARTER_MOTIFS, orderedIds, layoutSettings({
    columns: 3,
    gridAssignment: "sequence",
    layoutMode: "grid",
    targetCount: 6,
  }));
  const alternate = buildInstances(STARTER_MOTIFS, orderedIds, layoutSettings({
    columns: 3,
    gridAssignment: "alternate",
    layoutMode: "grid",
    targetCount: 6,
  }));

  assert.deepEqual(sequence.instances.map((item) => item.motifId), [
    "petal", "bloom", "leaf", "petal", "bloom", "leaf",
  ]);
  assert.deepEqual(alternate.instances.map((item) => item.motifId), [
    "petal", "bloom", "leaf", "bloom", "leaf", "petal",
  ]);
});

test("grid scale uses the configured scale range", () => {
  const compactSettings = layoutSettings({
    columns: 2,
    height: 200,
    layoutMode: "grid",
    scaleMax: 0.5,
    scaleMin: 0.5,
    targetCount: 4,
    width: 400,
  });
  const largeSettings = { ...compactSettings, scaleMin: 1.2, scaleMax: 1.2 };
  const compact = buildInstances(STARTER_MOTIFS, ["bloom"], compactSettings);
  const large = buildInstances(STARTER_MOTIFS, ["bloom"], largeSettings);
  const baseScale = 100 / 82;

  for (const item of compact.instances) assert.ok(Math.abs(item.scale - baseScale * 0.5) < 1e-10);
  for (const item of large.instances) assert.ok(Math.abs(item.scale - baseScale * 1.2) < 1e-10);
  assert.ok(large.instances[0].scale > compact.instances[0].scale * 2);
});

test("weighted grid assignment follows motif weights deterministically", () => {
  const settings = layoutSettings({
    layoutMode: "grid",
    targetCount: 80,
    columns: 10,
    gridAssignment: "weighted",
    motifWeights: { bloom: 3, leaf: 0.25 },
  });
  const result = buildInstances(STARTER_MOTIFS, ["bloom", "leaf"], settings);
  const bloomCount = result.instances.filter((item) => item.motifId === "bloom").length;
  const leafCount = result.instances.length - bloomCount;

  assert.ok(bloomCount > leafCount * 4);
  assert.deepEqual(result, buildInstances(STARTER_MOTIFS, ["bloom", "leaf"], settings));
});

test("flattened SVG explicitly clips scene geometry to the artboard", () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    backgroundColor: "#ffffff",
    height: 80,
    surfaceMode: "artboard",
    width: 120,
  };
  const svg = exportFlattenedSvg(STARTER_MOTIFS, [{
    id: "outside",
    motifId: "bloom",
    x: 118,
    y: 40,
    scale: 1,
    rotation: 0,
    colorIndex: 0,
    radius: 43,
    color: "#123456",
  }], settings);

  assert.match(svg, /<clipPath id="loeme-artboard-clip" clipPathUnits="userSpaceOnUse">/);
  assert.match(svg, /<rect x="0" y="0" width="120" height="80"\/>/);
  assert.match(svg, /<g clip-path="url\(#loeme-artboard-clip\)">/);
});

test("Normalize centers measured SVG bounds and returns conservative collision metadata", () => {
  const normalized = normalizeMotifGeometry({ x: 20, y: -10, width: 200, height: 100 });

  assert.deepEqual(normalized.bounds, { x: 0, y: 25, width: 100, height: 50 });
  assert.equal(normalized.transform, "translate(-10.00000 30.00000) scale(0.5000000)");
  assert.ok(Math.abs(normalized.collisionRadius - Math.hypot(50, 25)) < 1e-10);
  assert.throws(
    () => normalizeMotifGeometry({ x: 0, y: 0, width: 0, height: 10 }),
    /没有可测量的矢量边界/,
  );
});

test("import paint metadata distinguishes remappable, mixed, and preserved paint", () => {
  assert.equal(classifySvgPaintMode('<path fill="currentColor" d="M0 0h1v1z"/>'), "remappable");
  assert.equal(classifySvgPaintMode('<g fill="currentColor"><path stroke="#fff"/></g>'), "mixed");
  assert.equal(classifySvgPaintMode('<path fill="#ff0066"/>'), "preserved");
  assert.equal(classifySvgPaintMode('<path/>'), "preserved");
});

test("Compose propagates paint remappability from all selected parts", () => {
  const motifs = [
    { id: "a", name: "A", category: "Project", source: "upload", body: '<path fill="currentColor"/>', paintMode: "remappable" },
    { id: "b", name: "B", category: "Project", source: "upload", body: '<circle fill="currentColor"/>', paintMode: "remappable" },
    { id: "c", name: "C", category: "Project", source: "upload", body: '<rect fill="#f00"/>', paintMode: "preserved" },
  ];

  assert.equal(buildCompositionMotif(motifs, ["a", "b"], "stack")?.paintMode, "remappable");
  assert.equal(buildCompositionMotif(motifs, ["a", "c"], "stack")?.paintMode, "mixed");
});

test("Compose presets initialize one transform per unique selected motif", () => {
  assert.deepEqual(
    createComposePartTransforms(["a", "a", "b", "c", "d"], "bouquet"),
    {
      a: { x: 50, y: 39, rotation: 0, scale: 0.62 },
      b: { x: 27, y: 70, rotation: -28, scale: 0.45 },
      c: { x: 73, y: 70, rotation: 28, scale: 0.45 },
    },
  );
  assert.notDeepEqual(
    createComposePartTransforms(["a", "b", "c"], "bouquet"),
    createComposePartTransforms(["a", "b", "c"], "orbit"),
  );
});

test("persisted Compose transforms are resolved over presets and bounded safely", () => {
  const resolved = resolveComposePartTransforms(["a", "b"], "bouquet", {
    a: { x: Number.POSITIVE_INFINITY, y: -20, rotation: 810, scale: 0 },
    b: { x: 120, y: Number.NaN, rotation: -540, scale: 99 },
    stale: { x: 50, y: 50, rotation: 0, scale: 1 },
  });

  assert.deepEqual(resolved, {
    a: { x: 50, y: 0, rotation: 90, scale: 0.05 },
    b: { x: 100, y: 70, rotation: -180, scale: 2 },
  });
  assert.equal("stale" in resolved, false);
});

test("Compose applies per-motif transforms and measures transformed source bounds", () => {
  const motifs = [
    {
      id: "a",
      name: "A",
      category: "Project",
      source: "upload",
      body: '<rect x="40" y="45" width="20" height="10" fill="currentColor"/>',
      bounds: { x: 40, y: 45, width: 20, height: 10 },
    },
    {
      id: "b",
      name: "B",
      category: "Project",
      source: "upload",
      body: '<rect x="45" y="40" width="10" height="20" fill="currentColor"/>',
      bounds: { x: 45, y: 40, width: 10, height: 20 },
    },
  ];
  const composition = buildCompositionMotif(motifs, ["a", "b"], "bouquet", {
    a: { x: 20, y: 30, rotation: 90, scale: 1 },
    b: { x: 80, y: 70, rotation: 0, scale: 0.5 },
  });

  assert.ok(composition);
  assert.match(composition.body, /translate\(20 30\) rotate\(90\) scale\(1\)/);
  assert.match(composition.body, /translate\(80 70\) rotate\(0\) scale\(0\.5\)/);
  assert.deepEqual(composition.bounds, { x: 15, y: 20, width: 67.5, height: 55 });
  assert.ok(Math.abs(composition.collisionRadius - Math.hypot(35, 30)) < 1e-10);
});

test("Compose collision radius includes declared paint outside measured bounds", () => {
  const motifs = [
    {
      id: "a",
      name: "A",
      category: "Project",
      source: "upload",
      body: '<circle cx="50" cy="50" r="10"/>',
      bounds: { x: 40, y: 40, width: 20, height: 20 },
      collisionRadius: 30,
    },
    {
      id: "b",
      name: "B",
      category: "Project",
      source: "upload",
      body: '<circle cx="50" cy="50" r="1"/>',
      bounds: { x: 49, y: 49, width: 2, height: 2 },
    },
  ];
  const composition = buildCompositionMotif(motifs, ["a", "b"], "stack", {
    a: { x: 0, y: 50, rotation: 0, scale: 1 },
    b: { x: 50, y: 50, rotation: 0, scale: 1 },
  });

  assert.equal(composition?.collisionRadius, 80);
});

test("Compose remains backward compatible when a stored project has no transforms", () => {
  const selectedIds = ["bloom", "leaf", "sprig"];
  assert.deepEqual(
    buildCompositionMotif(STARTER_MOTIFS, selectedIds, "orbit"),
    buildCompositionMotif(
      STARTER_MOTIFS,
      selectedIds,
      "orbit",
      createComposePartTransforms(selectedIds, "orbit"),
    ),
  );
});
