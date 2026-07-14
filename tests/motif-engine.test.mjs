import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SETTINGS,
  STARTER_MOTIFS,
  buildInstances,
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

test("dense organic is deterministic and never forces overlaps", () => {
  const settings = layoutSettings({ organicStrategy: "dense", surfaceMode: "repeat" });
  const first = buildInstances(STARTER_MOTIFS, activeIds, settings);
  const second = buildInstances(STARTER_MOTIFS, activeIds, settings);

  assert.deepEqual(first, second);
  assert.equal(first.status, "complete");
  for (let left = 0; left < first.instances.length; left += 1) {
    for (let right = left + 1; right < first.instances.length; right += 1) {
      const a = first.instances[left];
      const b = first.instances[right];
      assert.ok(
        toroidalDistance(a, b, settings.width, settings.height)
          >= a.radius + b.radius + settings.minDistance - 1e-8,
      );
    }
  }
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
