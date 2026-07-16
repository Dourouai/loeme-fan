import type {
  GpuSnapshot,
  ShapeSettings,
  VectorizeResult,
} from "./morph-types";

export const MORPH_ARTBOARD_SIZE = 1024;

const EPSILON = 1e-9;
const ROUNDING_FACTOR = 1000;

export const DEFAULT_VECTOR_SHAPE_SETTINGS: Readonly<ShapeSettings> = {
  fillLevel: 50,
  edgeSmoothing: 20,
  pathDetail: 75,
  removeSmallShapes: 0,
  invertFill: false,
};

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface MarchingEndpoint {
  edgeId: number;
  point: Point;
}

export interface MarchingSegment {
  a: MarchingEndpoint;
  b: MarchingEndpoint;
}

export interface ClassifiedRing {
  id: number;
  points: Point[];
  area: number;
  bounds: BoundingBox;
  parentId: number | null;
  depth: number;
  isHole: boolean;
}

export interface VectorizeSnapshotInput {
  snapshotId: string;
  generationId: number;
  width: number;
  height: number;
  data: Uint16Array;
  settings: ShapeSettings;
}

export interface VectorizeFieldInput {
  snapshotId: string;
  generationId: number;
  width: number;
  height: number;
  field: Float32Array;
  settings: ShapeSettings;
}

export interface MorphSvgOptions {
  foreground?: string;
  background?: string;
  includeBackground?: boolean;
  title?: string;
  metadata?: string;
}

interface RingInput {
  id: number;
  points: Point[];
}

interface IndexedSegment {
  ringId: number;
  index: number;
  ringLength: number;
  a: Point;
  b: Point;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Decode one IEEE-754 binary16 value without relying on platform-specific views. */
export function halfToFloat(bits: number): number {
  const value = bits & 0xffff;
  const sign = (value & 0x8000) === 0 ? 1 : -1;
  const exponent = (value >>> 10) & 0x1f;
  const mantissa = value & 0x03ff;

  if (exponent === 0) {
    return sign * mantissa * 2 ** -24;
  }
  if (exponent === 0x1f) {
    return mantissa === 0 ? sign * Infinity : Number.NaN;
  }
  return sign * (1 + mantissa / 1024) * 2 ** (exponent - 15);
}

/** Extract the Gray-Scott V field from the G channel of a compact RGBA16F snapshot. */
export function decodeVField(
  data: Uint16Array,
  width: number,
  height: number,
): Float32Array {
  assertDimensions(width, height);
  const pixelCount = width * height;
  if (data.length !== pixelCount * 4) {
    throw new RangeError(
      `Expected ${pixelCount * 4} half-floats for ${width}x${height} RGBA16F, received ${data.length}.`,
    );
  }

  const field = new Float32Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    const decoded = halfToFloat(data[index * 4 + 1]);
    field[index] = Number.isFinite(decoded)
      ? clamp(decoded, 0, 1)
      : 0;
  }
  return field;
}

/** Separable Gaussian blur with clamp-to-edge sampling. */
export function gaussianSmooth(
  field: Float32Array,
  width: number,
  height: number,
  sigma: number,
): Float32Array {
  assertField(field, width, height);
  if (!Number.isFinite(sigma) || sigma <= 0.01) {
    return field.slice();
  }

  const safeSigma = clamp(sigma, 0, 2.5);
  const radius = Math.max(1, Math.ceil(safeSigma * 3));
  const kernel = new Float64Array(radius * 2 + 1);
  let kernelSum = 0;
  for (let offset = -radius; offset <= radius; offset += 1) {
    const weight = Math.exp(-(offset * offset) / (2 * safeSigma * safeSigma));
    kernel[offset + radius] = weight;
    kernelSum += weight;
  }
  for (let index = 0; index < kernel.length; index += 1) {
    kernel[index] /= kernelSum;
  }

  const horizontal = new Float32Array(field.length);
  const result = new Float32Array(field.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleX = clampInteger(x + offset, 0, width - 1);
        value += field[y * width + sampleX] * kernel[offset + radius];
      }
      horizontal[y * width + x] = value;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleY = clampInteger(y + offset, 0, height - 1);
        value += horizontal[sampleY * width + x] * kernel[offset + radius];
      }
      result[y * width + x] = value;
    }
  }

  return result;
}

/**
 * Return the line segments for one Marching Squares cell. Corner order is
 * top-left, top-right, bottom-right, bottom-left. Edge IDs are integer grid
 * edge IDs, so later stitching never depends on stringified float positions.
 */
export function marchingSquareSegmentsForCell(
  values: readonly [number, number, number, number],
  threshold: number,
  x = 0,
  y = 0,
  gridWidth = 2,
  gridHeight = 2,
): MarchingSegment[] {
  const [topLeft, topRight, bottomRight, bottomLeft] = values;
  const cellCase =
    (topLeft >= threshold ? 1 : 0)
    | (topRight >= threshold ? 2 : 0)
    | (bottomRight >= threshold ? 4 : 0)
    | (bottomLeft >= threshold ? 8 : 0);

  if (cellCase === 0 || cellCase === 15) return [];

  let pairs: ReadonlyArray<readonly [number, number]>;
  if (cellCase === 5 || cellCase === 10) {
    // Bilinear asymptotic decider. The exact-saddle tie consistently chooses
    // the same diagonal, which keeps repeated runs deterministic.
    const determinant =
      (topLeft - threshold) * (bottomRight - threshold)
      - (topRight - threshold) * (bottomLeft - threshold);
    pairs = determinant >= 0
      ? [[0, 1], [2, 3]]
      : [[3, 0], [1, 2]];
  } else {
    pairs = MARCHING_CASES[cellCase];
  }

  const edgeValues: ReadonlyArray<readonly [number, number]> = [
    [topLeft, topRight],
    [topRight, bottomRight],
    [bottomLeft, bottomRight],
    [topLeft, bottomLeft],
  ];
  const horizontalEdgeCount = gridHeight * (gridWidth - 1);

  const endpoint = (edge: number): MarchingEndpoint => {
    const [from, to] = edgeValues[edge];
    const amount = interpolateThreshold(from, to, threshold);
    if (edge === 0) {
      return {
        edgeId: y * (gridWidth - 1) + x,
        point: { x: x + amount, y },
      };
    }
    if (edge === 1) {
      return {
        edgeId: horizontalEdgeCount + y * gridWidth + x + 1,
        point: { x: x + 1, y: y + amount },
      };
    }
    if (edge === 2) {
      return {
        edgeId: (y + 1) * (gridWidth - 1) + x,
        point: { x: x + amount, y: y + 1 },
      };
    }
    return {
      edgeId: horizontalEdgeCount + y * gridWidth + x,
      point: { x, y: y + amount },
    };
  };

  return pairs.map(([first, second]) => ({
    a: endpoint(first),
    b: endpoint(second),
  }));
}

const MARCHING_CASES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [],
  [[3, 0]],
  [[0, 1]],
  [[3, 1]],
  [[1, 2]],
  [],
  [[0, 2]],
  [[2, 3]],
  [[2, 3]],
  [[0, 2]],
  [],
  [[1, 2]],
  [[3, 1]],
  [[0, 1]],
  [[3, 0]],
  [],
];

/** Extract closed, logical-1024 rings from a scalar field. */
export function marchingSquaresRings(
  field: Float32Array,
  width: number,
  height: number,
  threshold: number,
): Point[][] {
  assertField(field, width, height);
  const paddedWidth = width + 2;
  const paddedHeight = height + 2;
  const padded = new Float32Array(paddedWidth * paddedHeight);

  for (let y = 0; y < height; y += 1) {
    padded.set(
      field.subarray(y * width, (y + 1) * width),
      (y + 1) * paddedWidth + 1,
    );
  }

  const segments: MarchingSegment[] = [];
  for (let y = 0; y < paddedHeight - 1; y += 1) {
    for (let x = 0; x < paddedWidth - 1; x += 1) {
      const topLeft = padded[y * paddedWidth + x];
      const topRight = padded[y * paddedWidth + x + 1];
      const bottomRight = padded[(y + 1) * paddedWidth + x + 1];
      const bottomLeft = padded[(y + 1) * paddedWidth + x];
      segments.push(...marchingSquareSegmentsForCell(
        [topLeft, topRight, bottomRight, bottomLeft],
        threshold,
        x,
        y,
        paddedWidth,
        paddedHeight,
      ));
    }
  }

  const rawRings = stitchSegments(segments);
  const scaleX = MORPH_ARTBOARD_SIZE / (width - 1);
  const scaleY = MORPH_ARTBOARD_SIZE / (height - 1);
  const rings: Point[][] = [];

  for (const rawRing of rawRings) {
    const logical = dedupeRing(rawRing.map((point) => ({
      x: clamp((point.x - 1) * scaleX, 0, MORPH_ARTBOARD_SIZE),
      y: clamp((point.y - 1) * scaleY, 0, MORPH_ARTBOARD_SIZE),
    })));
    if (logical.length >= 3 && Math.abs(signedArea(logical)) > EPSILON) {
      rings.push(logical);
    }
  }
  return rings;
}

/** Classify rings by containment parity; path direction is intentionally ignored. */
export function classifyRings(ringPoints: Point[][] | RingInput[]): ClassifiedRing[] {
  const rings: ClassifiedRing[] = ringPoints.map((entry, index) => {
    const ring = Array.isArray(entry) ? { id: index, points: entry } : entry;
    return {
      id: ring.id,
      points: ring.points,
      area: Math.abs(signedArea(ring.points)),
      bounds: boundsFor(ring.points),
      parentId: null,
      depth: 0,
      isHole: false,
    };
  });

  for (const ring of rings) {
    const probe = containmentProbe(ring.points);
    let parent: ClassifiedRing | null = null;
    for (const candidate of rings) {
      if (candidate.id === ring.id || candidate.area <= ring.area + EPSILON) continue;
      if (!boundsContainPoint(candidate.bounds, probe)) continue;
      if (!pointInPolygon(probe, candidate.points)) continue;
      if (parent === null || candidate.area < parent.area) parent = candidate;
    }
    ring.parentId = parent?.id ?? null;
  }

  const byId = new Map(rings.map((ring) => [ring.id, ring]));
  const depthMemo = new Map<number, number>();
  const depthFor = (ring: ClassifiedRing, visiting = new Set<number>()): number => {
    const memoized = depthMemo.get(ring.id);
    if (memoized !== undefined) return memoized;
    if (ring.parentId === null || visiting.has(ring.id)) return 0;
    visiting.add(ring.id);
    const parent = byId.get(ring.parentId);
    const depth = parent ? depthFor(parent, visiting) + 1 : 0;
    visiting.delete(ring.id);
    depthMemo.set(ring.id, depth);
    return depth;
  };

  for (const ring of rings) {
    ring.depth = depthFor(ring);
    ring.isHole = ring.depth % 2 === 1;
  }
  return rings;
}

export function vectorizeSnapshot(input: VectorizeSnapshotInput): VectorizeResult;
export function vectorizeSnapshot(
  snapshot: GpuSnapshot,
  settings: ShapeSettings,
  snapshotId?: string,
  generationId?: number,
): VectorizeResult;
export function vectorizeSnapshot(
  input: VectorizeSnapshotInput | GpuSnapshot,
  settings?: ShapeSettings,
  snapshotId = "snapshot",
  generationId = 0,
): VectorizeResult {
  if ("snapshotId" in input) {
    return vectorizeVField({
      snapshotId: input.snapshotId,
      generationId: input.generationId,
      width: input.width,
      height: input.height,
      field: decodeVField(input.data, input.width, input.height),
      settings: input.settings,
    });
  }
  if (!settings) throw new TypeError("Shape settings are required.");
  return vectorizeVField({
    snapshotId,
    generationId,
    width: input.width,
    height: input.height,
    field: decodeVField(input.data, input.width, input.height),
    settings,
  });
}

/** Vectorize an already-decoded V field, which lets the Worker cache decode work. */
export function vectorizeVField(input: VectorizeFieldInput): VectorizeResult {
  assertField(input.field, input.width, input.height);
  const settings = normalizeSettings(input.settings);
  // Gray–Scott V normally lives in a much narrower useful range than 0–1.
  // A higher Fill level intentionally lowers the threshold, making the
  // compound shape denser in the same direction as the UI label.
  const threshold = 0.35 - 0.325 * settings.fillLevel / 100;
  const sigma = 2.5 * settings.edgeSmoothing / 100;
  const simplifyTolerance = 8 * (1 - settings.pathDetail / 100);
  const minimumArea =
    MORPH_ARTBOARD_SIZE * MORPH_ARTBOARD_SIZE
    * settings.removeSmallShapes / 100;

  const smoothed = gaussianSmooth(
    input.field,
    input.width,
    input.height,
    sigma,
  );
  const extracted = marchingSquaresRings(
    smoothed,
    input.width,
    input.height,
    threshold,
  );
  const classified = classifyRings(extracted);
  const areaFiltered = filterSmallComponents(classified, minimumArea);
  const simplified = simplifyTopologySafe(areaFiltered, simplifyTolerance);

  const outputRings = simplified;
  let prefix = "";
  let shapeCount: number;
  let pathCount: number;
  let anchorCount: number;

  if (settings.invertFill) {
    prefix = serializeRing([
      { x: 0, y: 0 },
      { x: MORPH_ARTBOARD_SIZE, y: 0 },
      { x: MORPH_ARTBOARD_SIZE, y: MORPH_ARTBOARD_SIZE },
      { x: 0, y: MORPH_ARTBOARD_SIZE },
    ]);
    shapeCount = 1 + outputRings.filter((ring) => ring.isHole).length;
    pathCount = outputRings.length + 1;
    anchorCount = outputRings.reduce(
      (total, ring) => total + ring.points.length,
      4,
    );
  } else {
    shapeCount = outputRings.filter((ring) => !ring.isHole).length;
    pathCount = outputRings.length;
    anchorCount = outputRings.reduce(
      (total, ring) => total + ring.points.length,
      0,
    );
  }

  const ringPath = outputRings.map((ring) => serializeRing(ring.points)).join(" ");
  const pathData = [prefix, ringPath].filter(Boolean).join(" ");

  if (!isSafeMorphPathData(pathData)) {
    throw new Error("Vectorization produced unsafe or non-finite SVG path data.");
  }

  return {
    snapshotId: input.snapshotId,
    generationId: input.generationId,
    pathData,
    shapeCount,
    pathCount,
    anchorCount,
  };
}

/** Build a static SVG containing only the Morph export element whitelist. */
export function buildMorphSvg(
  result: Pick<VectorizeResult, "pathData">,
  options: MorphSvgOptions = {},
): string {
  if (!isSafeMorphPathData(result.pathData)) {
    throw new TypeError("SVG path data contains unsupported commands or values.");
  }

  const foreground = safeSvgColor(options.foreground, "#c8f45d");
  const background = safeSvgColor(options.background, "#12211b");
  const title = escapeXml(options.title ?? "Loeme Morph organic shape");
  const metadata = escapeXml(
    options.metadata ?? "Generated locally with Loeme Morph.",
  );
  const backgroundElement = options.includeBackground === false
    ? ""
    : `  <rect x="0" y="0" width="1024" height="1024" fill="${background}"/>\n`;

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">',
    `  <title>${title}</title>`,
    `  <metadata>${metadata}</metadata>`,
    backgroundElement.trimEnd(),
    `  <g fill="${foreground}" fill-rule="evenodd">`,
    `    <path d="${result.pathData}" fill-rule="evenodd"/>`,
    "  </g>",
    "</svg>",
  ].filter(Boolean).join("\n");
}

export function buildMorphFilename(preset = "cells"): string {
  const safePreset = preset
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "cells";
  return `loeme-morph-${safePreset}.svg`;
}

export function isSafeMorphPathData(pathData: string): boolean {
  if (!/^[MLZ0-9+.,eE\-\s]*$/.test(pathData)) return false;
  const values = pathData.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi) ?? [];
  return values.every((value) => Number.isFinite(Number(value)));
}

function stitchSegments(segments: MarchingSegment[]): Point[][] {
  const links = new Map<number, Array<{ edgeId: number; segmentId: number }>>();
  const points = new Map<number, Point>();
  const used = new Uint8Array(segments.length);

  const addLink = (from: number, to: number, segmentId: number) => {
    const entries = links.get(from);
    const link = { edgeId: to, segmentId };
    if (entries) entries.push(link);
    else links.set(from, [link]);
  };

  segments.forEach((segment, segmentId) => {
    points.set(segment.a.edgeId, segment.a.point);
    points.set(segment.b.edgeId, segment.b.point);
    addLink(segment.a.edgeId, segment.b.edgeId, segmentId);
    addLink(segment.b.edgeId, segment.a.edgeId, segmentId);
  });

  const rings: Point[][] = [];
  for (let firstSegmentId = 0; firstSegmentId < segments.length; firstSegmentId += 1) {
    if (used[firstSegmentId]) continue;
    const first = segments[firstSegmentId];
    const startEdge = first.a.edgeId;
    let currentEdge = first.b.edgeId;
    let currentSegmentId = firstSegmentId;
    const ring = [first.a.point];
    let closed = false;

    for (let guard = 0; guard <= segments.length; guard += 1) {
      used[currentSegmentId] = 1;
      const point = points.get(currentEdge);
      if (!point) break;
      ring.push(point);
      if (currentEdge === startEdge) {
        closed = true;
        break;
      }

      const next = links.get(currentEdge)?.find((entry) => !used[entry.segmentId]);
      if (!next) break;
      currentEdge = next.edgeId;
      currentSegmentId = next.segmentId;
    }

    if (closed) {
      ring.pop();
      const deduped = dedupeRing(ring);
      if (deduped.length >= 3) rings.push(deduped);
    }
  }
  return rings;
}

function filterSmallComponents(
  rings: ClassifiedRing[],
  minimumArea: number,
): ClassifiedRing[] {
  if (minimumArea <= 0) return rings;
  const byId = new Map(rings.map((ring) => [ring.id, ring]));
  const removedRoots = new Set(
    rings
      .filter((ring) => !ring.isHole && ring.area < minimumArea)
      .map((ring) => ring.id),
  );
  if (removedRoots.size === 0) return rings;

  const hasRemovedAncestor = (ring: ClassifiedRing): boolean => {
    let current: ClassifiedRing | undefined = ring;
    const visited = new Set<number>();
    while (current && !visited.has(current.id)) {
      if (removedRoots.has(current.id)) return true;
      visited.add(current.id);
      current = current.parentId === null ? undefined : byId.get(current.parentId);
    }
    return false;
  };

  const retained = rings
    .filter((ring) => !hasRemovedAncestor(ring))
    .map((ring) => ({ id: ring.id, points: ring.points }));
  return classifyRings(retained);
}

function simplifyTopologySafe(
  rings: ClassifiedRing[],
  tolerance: number,
): ClassifiedRing[] {
  if (rings.length === 0) return [];
  const attempts = tolerance > 0
    ? [tolerance, tolerance / 2, tolerance / 4, tolerance / 8, 0]
    : [0];

  for (const attempt of attempts) {
    const candidates: RingInput[] = [];
    let basicValidity = true;
    for (const ring of rings) {
      const simplified = attempt > 0
        ? simplifyClosedRing(ring.points, attempt)
        : ring.points.slice();
      const rounded = roundAndDedupeRing(simplified);
      if (!isValidBasicRing(rounded)) {
        basicValidity = false;
        break;
      }
      candidates.push({ id: ring.id, points: rounded });
    }
    if (!basicValidity) continue;

    const candidateClassification = classifyRings(candidates);
    if (topologyMatches(rings, candidateClassification)
      && !ringsHaveIntersections(candidateClassification)) {
      return candidateClassification;
    }
  }

  // Rounding can theoretically collapse an extremely small ring. Preserve all
  // valid rings rather than failing the complete result; normal 512px fields do
  // not reach this fallback because one source pixel is > 3 logical decimals.
  const fallback = rings
    .map((ring) => ({ id: ring.id, points: roundAndDedupeRing(ring.points) }))
    .filter((ring) => isValidBasicRing(ring.points));
  return classifyRings(fallback);
}

function simplifyClosedRing(points: Point[], tolerance: number): Point[] {
  if (points.length <= 3 || tolerance <= 0) return points.slice();
  let splitIndex = 1;
  let farthestDistance = -1;
  for (let index = 1; index < points.length; index += 1) {
    const distance = squaredDistance(points[0], points[index]);
    if (distance > farthestDistance) {
      farthestDistance = distance;
      splitIndex = index;
    }
  }
  if (splitIndex === 0 || splitIndex === points.length - 1 && points.length <= 3) {
    return points.slice();
  }

  const firstArc = points.slice(0, splitIndex + 1);
  const secondArc = points.slice(splitIndex).concat(points[0]);
  const firstSimplified = simplifyOpenPolyline(firstArc, tolerance);
  const secondSimplified = simplifyOpenPolyline(secondArc, tolerance);
  return dedupeRing(firstSimplified.concat(secondSimplified.slice(1, -1)));
}

function simplifyOpenPolyline(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points.slice();
  const toleranceSquared = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    let maximum = toleranceSquared;
    let selected = -1;
    for (let index = start + 1; index < end; index += 1) {
      const distance = squaredDistanceToSegment(points[index], points[start], points[end]);
      if (distance > maximum) {
        maximum = distance;
        selected = index;
      }
    }
    if (selected >= 0) {
      keep[selected] = 1;
      stack.push([start, selected], [selected, end]);
    }
  }

  return points.filter((_, index) => keep[index] === 1);
}

function topologyMatches(
  original: ClassifiedRing[],
  candidate: ClassifiedRing[],
): boolean {
  if (original.length !== candidate.length) return false;
  const originalById = new Map(original.map((ring) => [ring.id, ring]));
  for (const ring of candidate) {
    const before = originalById.get(ring.id);
    if (!before
      || before.isHole !== ring.isHole
      || before.parentId !== ring.parentId) return false;
  }
  return true;
}

function ringsHaveIntersections(rings: ClassifiedRing[]): boolean {
  const segments: IndexedSegment[] = [];
  for (const ring of rings) {
    for (let index = 0; index < ring.points.length; index += 1) {
      const a = ring.points[index];
      const b = ring.points[(index + 1) % ring.points.length];
      segments.push({
        ringId: ring.id,
        index,
        ringLength: ring.points.length,
        a,
        b,
        minX: Math.min(a.x, b.x),
        minY: Math.min(a.y, b.y),
        maxX: Math.max(a.x, b.x),
        maxY: Math.max(a.y, b.y),
      });
    }
  }
  segments.sort((left, right) => left.minX - right.minX || left.minY - right.minY);

  let active: IndexedSegment[] = [];
  for (const segment of segments) {
    active = active.filter((candidate) => candidate.maxX >= segment.minX - EPSILON);
    for (const candidate of active) {
      if (candidate.maxY < segment.minY - EPSILON
        || candidate.minY > segment.maxY + EPSILON) continue;
      if (candidate.ringId === segment.ringId) {
        const difference = Math.abs(candidate.index - segment.index);
        if (difference === 1 || difference === segment.ringLength - 1) continue;
      }
      if (segmentsIntersect(candidate.a, candidate.b, segment.a, segment.b)) {
        return true;
      }
    }
    active.push(segment);
  }
  return false;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);

  if (((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON))
    && ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON))) {
    return true;
  }
  if (Math.abs(abC) <= EPSILON && pointOnSegment(c, a, b)) return true;
  if (Math.abs(abD) <= EPSILON && pointOnSegment(d, a, b)) return true;
  if (Math.abs(cdA) <= EPSILON && pointOnSegment(a, c, d)) return true;
  return Math.abs(cdB) <= EPSILON && pointOnSegment(b, c, d);
}

function isValidBasicRing(points: Point[]): boolean {
  if (points.length < 3 || Math.abs(signedArea(points)) <= EPSILON) return false;
  return points.every((point) => Number.isFinite(point.x)
    && Number.isFinite(point.y)
    && point.x >= 0
    && point.y >= 0
    && point.x <= MORPH_ARTBOARD_SIZE
    && point.y <= MORPH_ARTBOARD_SIZE);
}

function serializeRing(points: Point[]): string {
  if (points.length < 3) return "";
  const [first, ...rest] = points;
  return `M ${formatCoordinate(first.x)} ${formatCoordinate(first.y)} ${rest
    .map((point) => `L ${formatCoordinate(point.x)} ${formatCoordinate(point.y)}`)
    .join(" ")} Z`;
}

function normalizeSettings(settings: ShapeSettings): ShapeSettings {
  return {
    fillLevel: finiteClamp(settings.fillLevel, 0, 100, 50),
    edgeSmoothing: finiteClamp(settings.edgeSmoothing, 0, 100, 20),
    pathDetail: finiteClamp(settings.pathDetail, 0, 100, 75),
    removeSmallShapes: finiteClamp(settings.removeSmallShapes, 0, 1, 0),
    invertFill: settings.invertFill === true,
  };
}

function interpolateThreshold(from: number, to: number, threshold: number): number {
  const denominator = to - from;
  if (Math.abs(denominator) <= EPSILON) return 0.5;
  return clamp((threshold - from) / denominator, 0, 1);
}

function containmentProbe(points: Point[]): Point {
  const centroid = polygonCentroid(points);
  if (centroid && pointInPolygon(centroid, points)) return centroid;
  const average = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );
  const mean = { x: average.x / points.length, y: average.y / points.length };
  if (pointInPolygon(mean, points)) return mean;

  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length <= EPSILON) continue;
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
    for (const direction of [1, -1]) {
      const probe = {
        x: midpoint.x + normal.x * direction * 0.001,
        y: midpoint.y + normal.y * direction * 0.001,
      };
      if (pointInPolygon(probe, points)) return probe;
    }
  }
  return points[0];
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[previous];
    const b = polygon[index];
    if (pointOnSegment(point, a, b)) return true;
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointOnSegment(point: Point, a: Point, b: Point): boolean {
  if (Math.abs(orientation(a, b, point)) > EPSILON) return false;
  return point.x >= Math.min(a.x, b.x) - EPSILON
    && point.x <= Math.max(a.x, b.x) + EPSILON
    && point.y >= Math.min(a.y, b.y) - EPSILON
    && point.y <= Math.max(a.y, b.y) + EPSILON;
}

function polygonCentroid(points: Point[]): Point | null {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    twiceArea += cross;
    x += (current.x + next.x) * cross;
    y += (current.y + next.y) * cross;
  }
  if (Math.abs(twiceArea) <= EPSILON) return null;
  return { x: x / (3 * twiceArea), y: y / (3 * twiceArea) };
}

function signedArea(points: Point[]): number {
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    total += current.x * next.y - next.x * current.y;
  }
  return total / 2;
}

function boundsFor(points: Point[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
}

function boundsContainPoint(bounds: BoundingBox, point: Point): boolean {
  return point.x >= bounds.minX - EPSILON
    && point.x <= bounds.maxX + EPSILON
    && point.y >= bounds.minY - EPSILON
    && point.y <= bounds.maxY + EPSILON;
}

function roundAndDedupeRing(points: Point[]): Point[] {
  return dedupeRing(points.map((point) => ({
    x: roundCoordinate(point.x),
    y: roundCoordinate(point.y),
  })));
}

function dedupeRing(points: Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    if (!previous || squaredDistance(previous, point) > EPSILON * EPSILON) {
      result.push(point);
    }
  }
  if (result.length > 1
    && squaredDistance(result[0], result[result.length - 1]) <= EPSILON * EPSILON) {
    result.pop();
  }
  return result;
}

function squaredDistance(a: Point, b: Point): number {
  const x = a.x - b.x;
  const y = a.y - b.y;
  return x * x + y * y;
}

function squaredDistanceToSegment(point: Point, a: Point, b: Point): number {
  const lengthSquared = squaredDistance(a, b);
  if (lengthSquared <= EPSILON) return squaredDistance(point, a);
  const amount = clamp(
    ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y))
      / lengthSquared,
    0,
    1,
  );
  return squaredDistance(point, {
    x: a.x + (b.x - a.x) * amount,
    y: a.y + (b.y - a.y) * amount,
  });
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function safeSvgColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{3,8}$/i.test(value) ? value.toLowerCase() : fallback;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatCoordinate(value: number): string {
  const rounded = roundCoordinate(value);
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function roundCoordinate(value: number): number {
  const rounded = Math.round(value * ROUNDING_FACTOR) / ROUNDING_FACTOR;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function finiteClamp(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

function assertDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) {
    throw new RangeError("Morph vector fields must be at least 2x2 pixels.");
  }
}

function assertField(field: Float32Array, width: number, height: number): void {
  assertDimensions(width, height);
  if (field.length !== width * height) {
    throw new RangeError(
      `Expected ${width * height} scalar samples, received ${field.length}.`,
    );
  }
}
