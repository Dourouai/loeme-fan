import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_VECTOR_SHAPE_SETTINGS,
  MORPH_ARTBOARD_SIZE,
  buildMorphFilename,
  buildMorphSvg,
  classifyRings,
  decodeVField,
  gaussianSmooth,
  halfToFloat,
  isSafeMorphPathData,
  marchingSquareSegmentsForCell,
  marchingSquaresRings,
  vectorizeVField,
} from "../app/apps/morph/morph-vector-engine.ts";

const noPostProcessing = {
  ...DEFAULT_VECTOR_SHAPE_SETTINGS,
  edgeSmoothing: 0,
  pathDetail: 100,
  removeSmallShapes: 0,
};

function vectorize(field, width, height, settings = {}) {
  return vectorizeVField({
    snapshotId: "test-snapshot",
    generationId: 7,
    width,
    height,
    field,
    settings: { ...noPostProcessing, ...settings },
  });
}

function fieldFrom(width, height, sample) {
  const field = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      field[y * width + x] = sample(x, y);
    }
  }
  return field;
}

function edgeForPoint(point) {
  if (Math.abs(point.y) < 1e-9) return 0;
  if (Math.abs(point.x - 1) < 1e-9) return 1;
  if (Math.abs(point.y - 1) < 1e-9) return 2;
  if (Math.abs(point.x) < 1e-9) return 3;
  throw new Error(`Point ${JSON.stringify(point)} is not on a unit-cell edge.`);
}

function edgePairs(segments) {
  return segments
    .map(({ a, b }) => [edgeForPoint(a.point), edgeForPoint(b.point)]
      .sort((left, right) => left - right)
      .join("-"))
    .sort();
}

function boundsFor(points) {
  return {
    minX: Math.min(...points.map(({ x }) => x)),
    minY: Math.min(...points.map(({ y }) => y)),
    maxX: Math.max(...points.map(({ x }) => x)),
    maxY: Math.max(...points.map(({ y }) => y)),
  };
}

test("half-float decoding covers signed zero, subnormals, normals, and non-finite values", () => {
  assert.equal(halfToFloat(0x0000), 0);
  assert.ok(Object.is(halfToFloat(0x8000), -0));
  assert.equal(halfToFloat(0x0001), 2 ** -24);
  assert.equal(halfToFloat(0x03ff), 1023 * 2 ** -24);
  assert.equal(halfToFloat(0x3c00), 1);
  assert.equal(halfToFloat(0xc000), -2);
  assert.equal(halfToFloat(0x7bff), 65504);
  assert.equal(halfToFloat(0x7c00), Infinity);
  assert.equal(halfToFloat(0xfc00), -Infinity);
  assert.ok(Number.isNaN(halfToFloat(0x7e00)));
});

test("RGBA16F decoding extracts and sanitizes the V channel", () => {
  const data = new Uint16Array(2 * 2 * 4);
  const encodedV = [0x3c00, 0x3800, 0xc000, 0x7c00];
  for (let index = 0; index < encodedV.length; index += 1) {
    data[index * 4] = 0x3c00;
    data[index * 4 + 1] = encodedV[index];
  }

  assert.deepEqual([...decodeVField(data, 2, 2)], [1, 0.5, 0, 0]);
  assert.throws(() => decodeVField(data.subarray(0, 12), 2, 2), /Expected 16/);
});

test("all 16 Marching Squares cases emit the expected edge topology", () => {
  const expected = [
    [], ["0-3"], ["0-1"], ["1-3"],
    ["1-2"], ["0-1", "2-3"], ["0-2"], ["2-3"],
    ["2-3"], ["0-2"], ["0-1", "2-3"], ["1-2"],
    ["1-3"], ["0-1"], ["0-3"], [],
  ];

  for (let cellCase = 0; cellCase < 16; cellCase += 1) {
    const values = [1, 2, 4, 8].map((bit) => cellCase & bit ? 1 : 0);
    const segments = marchingSquareSegmentsForCell(values, 0.5);
    assert.deepEqual(edgePairs(segments), expected[cellCase], `case ${cellCase}`);
    for (const { a, b } of segments) {
      assert.ok(Number.isFinite(a.point.x) && Number.isFinite(a.point.y));
      assert.ok(Number.isFinite(b.point.x) && Number.isFinite(b.point.y));
    }
  }
});

test("ambiguous cases 5 and 10 use a deterministic asymptotic decider", () => {
  assert.deepEqual(
    edgePairs(marchingSquareSegmentsForCell([0.9, 0.4, 0.9, 0.4], 0.5)),
    ["0-1", "2-3"],
  );
  assert.deepEqual(
    edgePairs(marchingSquareSegmentsForCell([0.6, 0, 0.6, 0], 0.5)),
    ["0-3", "1-2"],
  );
  assert.deepEqual(
    edgePairs(marchingSquareSegmentsForCell([0, 0.6, 0, 0.6], 0.5)),
    ["0-1", "2-3"],
  );
  assert.deepEqual(
    edgePairs(marchingSquareSegmentsForCell([0.4, 1, 0.4, 1], 0.5)),
    ["0-3", "1-2"],
  );
});

test("padding closes contours that touch the source boundary", () => {
  const width = 8;
  const height = 8;
  const touchesLeft = fieldFrom(
    width,
    height,
    (x, y) => x <= 3 && y >= 1 && y <= 6 ? 1 : 0,
  );
  const rings = marchingSquaresRings(touchesLeft, width, height, 0.5);

  assert.equal(rings.length, 1);
  const bounds = boundsFor(rings[0]);
  assert.equal(bounds.minX, 0);
  assert.ok(bounds.maxX > 0 && bounds.maxX < MORPH_ARTBOARD_SIZE);
  assert.ok(rings[0].every(({ x, y }) => Number.isFinite(x)
    && Number.isFinite(y)
    && x >= 0 && y >= 0
    && x <= MORPH_ARTBOARD_SIZE && y <= MORPH_ARTBOARD_SIZE));

  const fullBoard = marchingSquaresRings(
    new Float32Array(4 * 3).fill(1),
    4,
    3,
    0.5,
  );
  assert.equal(fullBoard.length, 1);
  assert.deepEqual(boundsFor(fullBoard[0]), {
    minX: 0,
    minY: 0,
    maxX: 1024,
    maxY: 1024,
  });
});

test("ring classification preserves outer rings, holes, islands, and nested holes", () => {
  const width = 31;
  const height = 31;
  const nested = fieldFrom(width, height, (x, y) => {
    if (x < 3 || x > 27 || y < 3 || y > 27) return 0;
    if (x >= 8 && x <= 22 && y >= 8 && y <= 22) {
      if (x >= 12 && x <= 18 && y >= 12 && y <= 18) {
        return x >= 14 && x <= 16 && y >= 14 && y <= 16 ? 0 : 1;
      }
      return 0;
    }
    return 1;
  });
  const classified = classifyRings(
    marchingSquaresRings(nested, width, height, 0.5),
  ).sort((left, right) => left.depth - right.depth);

  assert.equal(classified.length, 4);
  assert.deepEqual(classified.map(({ depth }) => depth), [0, 1, 2, 3]);
  assert.deepEqual(classified.map(({ isHole }) => isHole), [false, true, false, true]);
  assert.equal(classified[0].parentId, null);
  for (let index = 1; index < classified.length; index += 1) {
    assert.equal(classified[index].parentId, classified[index - 1].id);
    assert.ok(classified[index - 1].area > classified[index].area);
  }

  const result = vectorize(nested, width, height);
  assert.equal(result.pathCount, 4);
  assert.equal(result.shapeCount, 2);
});

test("fill level lowers the useful V threshold and grows a denser component", () => {
  const width = 16;
  const height = 16;
  const field = fieldFrom(
    width,
    height,
    (x, y) => x >= 5 && x <= 10 && y >= 5 && y <= 10 ? 0.2 : 0,
  );

  assert.equal(vectorize(field, width, height, { fillLevel: 0 }).shapeCount, 0);
  assert.equal(vectorize(field, width, height, { fillLevel: 100 }).shapeCount, 1);
});

test("edge smoothing applies a real Gaussian blur without mutating its input", () => {
  const width = 9;
  const height = 9;
  const impulse = new Float32Array(width * height);
  impulse[4 * width + 4] = 1;
  const original = impulse.slice();
  const blurred = gaussianSmooth(impulse, width, height, 2.5);

  assert.deepEqual(impulse, original);
  assert.ok(blurred[4 * width + 4] > 0 && blurred[4 * width + 4] < 1);
  assert.ok(blurred[4 * width + 3] > 0);
  assert.equal(vectorize(impulse, width, height, { edgeSmoothing: 0 }).pathCount, 1);
  assert.equal(vectorize(impulse, width, height, { edgeSmoothing: 100 }).pathCount, 0);
});

test("small-shape removal drops only components below its area threshold", () => {
  const width = 40;
  const height = 40;
  const field = fieldFrom(width, height, (x, y) => {
    const large = x >= 5 && x <= 20 && y >= 5 && y <= 20;
    const small = x >= 32 && x <= 33 && y >= 32 && y <= 33;
    return large || small ? 1 : 0;
  });

  const unfiltered = vectorize(field, width, height, { removeSmallShapes: 0 });
  const defaulted = vectorize(field, width, height, { removeSmallShapes: Number.NaN });
  const filtered = vectorize(field, width, height, { removeSmallShapes: 1 });
  assert.equal(unfiltered.shapeCount, 2);
  assert.equal(defaulted.pathData, unfiltered.pathData);
  assert.equal(filtered.shapeCount, 1);
  assert.ok(filtered.anchorCount < unfiltered.anchorCount);
});

test("path detail simplifies anchors while preserving component topology", () => {
  const width = 65;
  const height = 65;
  const radial = fieldFrom(
    width,
    height,
    (x, y) => Math.max(0, 1 - Math.hypot(x - 32, y - 32) / 20),
  );
  const simplified = vectorize(radial, width, height, { pathDetail: 0 });
  const detailed = vectorize(radial, width, height, { pathDetail: 100 });

  assert.equal(simplified.shapeCount, 1);
  assert.equal(simplified.pathCount, detailed.pathCount);
  assert.ok(simplified.anchorCount < detailed.anchorCount);
});

test("invert prepends the artboard compound path and keeps even-odd-ready counts", () => {
  const width = 12;
  const height = 12;
  const field = fieldFrom(
    width,
    height,
    (x, y) => x >= 3 && x <= 8 && y >= 3 && y <= 8 ? 1 : 0,
  );
  const regular = vectorize(field, width, height, { invertFill: false });
  const inverted = vectorize(field, width, height, { invertFill: true });

  assert.match(inverted.pathData, /^M 0 0 L 1024 0 L 1024 1024 L 0 1024 Z /);
  assert.equal(inverted.pathCount, regular.pathCount + 1);
  assert.equal(inverted.anchorCount, regular.anchorCount + 4);
  assert.ok(inverted.pathData.endsWith(regular.pathData));
});

test("vectorized paths contain only finite coordinates inside the 1024 viewBox", () => {
  const width = 33;
  const height = 27;
  const field = fieldFrom(width, height, (x, y) => {
    const wave = 13 + 5 * Math.sin(x / 3);
    return y > wave ? 0.8 : 0.1;
  });
  const result = vectorize(field, width, height, {
    fillLevel: Number.NaN,
    edgeSmoothing: Infinity,
    pathDetail: Number.NaN,
    removeSmallShapes: Number.NaN,
  });
  const coordinates = result.pathData.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? [];

  assert.equal(result.snapshotId, "test-snapshot");
  assert.equal(result.generationId, 7);
  assert.ok(result.pathData.length > 0);
  assert.ok(isSafeMorphPathData(result.pathData));
  assert.equal(isSafeMorphPathData("M 1e999 0 Z"), false);
  assert.doesNotMatch(result.pathData, /NaN|Infinity/);
  assert.ok(coordinates.every((value) => {
    const coordinate = Number(value);
    return Number.isFinite(coordinate)
      && coordinate >= 0
      && coordinate <= MORPH_ARTBOARD_SIZE;
  }));
});

test("SVG output is escaped, color-sanitized, even-odd, and element-whitelisted", () => {
  const svg = buildMorphSvg(
    { pathData: "M 0 0 L 1024 0 L 1024 1024 L 0 1024 Z" },
    {
      foreground: "url(#unsafe)",
      background: "#ABC",
      title: "</title><script>alert(1)</script>",
      metadata: "<foreignObject onload='bad'>",
    },
  );
  const elementNames = [...svg.matchAll(/<\/?([A-Za-z][\w:-]*)\b/g)]
    .map((match) => match[1]);

  assert.match(svg, /viewBox="0 0 1024 1024"/);
  assert.match(svg, /<rect [^>]*fill="#abc"/);
  assert.match(svg, /<g fill="#c8f45d" fill-rule="evenodd">/);
  assert.match(svg, /<path [^>]*fill-rule="evenodd"\/>/);
  assert.match(svg, /&lt;\/title&gt;&lt;script&gt;/);
  assert.doesNotMatch(svg, /<script|<foreignObject|<[^>]+\sonload=|url\(/i);
  assert.ok(elementNames.every((name) => [
    "svg", "title", "metadata", "rect", "g", "path",
  ].includes(name)));

  const transparent = buildMorphSvg(
    { pathData: "M 1 1 L 2 1 L 2 2 Z" },
    { includeBackground: false },
  );
  assert.doesNotMatch(transparent, /<rect\b/);
  assert.throws(
    () => buildMorphSvg({ pathData: "M 0 0 C 1 1 2 2 3 3 Z" }),
    /unsupported commands/,
  );
  assert.throws(
    () => buildMorphSvg({ pathData: "M NaN 0 Z" }),
    /unsupported commands/,
  );
});

test("SVG filenames are normalized and cannot carry path syntax", () => {
  assert.equal(buildMorphFilename("Coral"), "loeme-morph-coral.svg");
  assert.equal(
    buildMorphFilename("../Mäze <script>"),
    "loeme-morph-maze-script.svg",
  );
  assert.equal(buildMorphFilename("💚"), "loeme-morph-cells.svg");
});
