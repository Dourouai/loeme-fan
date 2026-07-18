export type MotifCategory = "Botanical" | "Organic" | "Symbols" | "Project";

export type Motif = {
  id: string;
  name: string;
  category: MotifCategory;
  body: string;
  source: "loeme" | "upload";
  bounds?: MotifBounds;
  collisionRadius?: number;
  paintMode?: MotifPaintMode;
};

export type MotifBounds = { x: number; y: number; width: number; height: number };
export type MotifPaintMode = "remappable" | "mixed" | "preserved";

export type LayoutMode = "scatter" | "grid";
export type SurfaceMode = "artboard" | "repeat";
export type OrganicStrategy = "classic" | "dense";
export type GridOffset = "none" | "row" | "column";
export type GridAssignment = "sequence" | "alternate" | "weighted";
export type ComposeLayout = "bouquet" | "stack" | "orbit";
export type ComposeOutput = "replace" | "append" | "only";

export type ComposePartTransform = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export type ComposePartTransforms = Record<string, ComposePartTransform>;

export type ComposeSettings = {
  enabled: boolean;
  selectedIds: string[];
  layout: ComposeLayout;
  output: ComposeOutput;
  /** Optional so projects saved before direct manipulation continue to load. */
  transforms?: ComposePartTransforms;
};

export type Palette = {
  id: string;
  name: string;
  background: string;
  colors: string[];
};

export type StudioSettings = {
  algorithmVersion: number;
  layoutMode: LayoutMode;
  surfaceMode: SurfaceMode;
  seed: number;
  targetCount: number;
  columns: number;
  organicStrategy: OrganicStrategy;
  gridOffset: GridOffset;
  gridAssignment: GridAssignment;
  motifWeights: Record<string, number>;
  minDistance: number;
  scaleMin: number;
  scaleMax: number;
  rotation: number;
  width: number;
  height: number;
  paletteId: string;
  paletteColors: string[] | null;
  backgroundColor: string | null;
  showBoundary: boolean;
};

export type LayoutSettings = Pick<StudioSettings,
  | "algorithmVersion"
  | "layoutMode"
  | "surfaceMode"
  | "seed"
  | "targetCount"
  | "columns"
  | "organicStrategy"
  | "gridOffset"
  | "gridAssignment"
  | "motifWeights"
  | "minDistance"
  | "scaleMin"
  | "scaleMax"
  | "rotation"
  | "width"
  | "height"
>;

export type LayoutInstance = {
  id: string;
  motifId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  colorIndex: number;
  radius: number;
  wrappedFrom?: string;
};

export type PatternInstance = LayoutInstance & { color: string };

export type LayoutResult = {
  instances: LayoutInstance[];
  requestedCount: number;
  placedCount: number;
  unplacedCount: number;
  status: "complete" | "capacity-limited";
};

export const PALETTES: Palette[] = [
  {
    id: "coastal",
    name: "Coastal Bloom",
    background: "#fff4ee",
    colors: ["#f26f4b", "#1f4fbf", "#83aa9a", "#efad94", "#152f70"],
  },
  {
    id: "plum",
    name: "Plum Garden",
    background: "#fbf6ff",
    colors: ["#7d4cdb", "#ef78ad", "#3d256f", "#a8c889", "#f4b75f"],
  },
  {
    id: "forest",
    name: "Forest Paper",
    background: "#f1f0df",
    colors: ["#214f3d", "#789c65", "#cf6b48", "#d7b96f", "#537b72"],
  },
  {
    id: "mono",
    name: "Ink Study",
    background: "#f7f7f4",
    colors: ["#191a1d", "#4c4e55", "#757982", "#a9adb4", "#d7d9dc"],
  },
];

export const STARTER_MOTIFS: Motif[] = [
  {
    id: "bloom",
    name: "Bloom",
    category: "Botanical",
    source: "loeme",
    collisionRadius: 52,
    body:
      '<g fill="currentColor"><ellipse cx="50" cy="23" rx="13" ry="23"/><ellipse cx="77" cy="50" rx="23" ry="13"/><ellipse cx="50" cy="77" rx="13" ry="23"/><ellipse cx="23" cy="50" rx="23" ry="13"/><circle cx="50" cy="50" r="11" fill="#19191d"/></g>',
  },
  {
    id: "daisy",
    name: "Daisy",
    category: "Botanical",
    source: "loeme",
    collisionRadius: 52,
    body:
      '<g fill="currentColor"><ellipse cx="50" cy="19" rx="8" ry="19"/><ellipse cx="50" cy="81" rx="8" ry="19"/><ellipse cx="19" cy="50" rx="19" ry="8"/><ellipse cx="81" cy="50" rx="19" ry="8"/><ellipse cx="28" cy="28" rx="8" ry="19" transform="rotate(-45 28 28)"/><ellipse cx="72" cy="72" rx="8" ry="19" transform="rotate(-45 72 72)"/><ellipse cx="72" cy="28" rx="8" ry="19" transform="rotate(45 72 28)"/><ellipse cx="28" cy="72" rx="8" ry="19" transform="rotate(45 28 72)"/><circle cx="50" cy="50" r="10" fill="#19191d"/></g>',
  },
  {
    id: "leaf",
    name: "Leaf",
    category: "Botanical",
    source: "loeme",
    collisionRadius: 51,
    body:
      '<path d="M18 86C16 48 35 16 82 12C84 54 64 83 18 86Z" fill="currentColor"/><path d="M22 80C38 62 53 44 78 18" fill="none" stroke="#ffffff" stroke-opacity=".62" stroke-width="4" stroke-linecap="round"/>',
  },
  {
    id: "sprig",
    name: "Sprig",
    category: "Botanical",
    source: "loeme",
    collisionRadius: 52,
    body:
      '<g fill="currentColor"><path d="M25 91C37 67 48 44 70 12" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><ellipse cx="38" cy="66" rx="10" ry="20" transform="rotate(-55 38 66)"/><ellipse cx="57" cy="52" rx="10" ry="20" transform="rotate(45 57 52)"/><ellipse cx="52" cy="39" rx="9" ry="18" transform="rotate(-48 52 39)"/><ellipse cx="72" cy="26" rx="9" ry="17" transform="rotate(43 72 26)"/></g>',
  },
  {
    id: "berries",
    name: "Berries",
    category: "Botanical",
    source: "loeme",
    collisionRadius: 49,
    body:
      '<g fill="currentColor" stroke="currentColor"><path d="M24 88C40 68 49 48 61 20M44 60L25 42M53 43L77 31" fill="none" stroke-width="4" stroke-linecap="round"/><circle cx="23" cy="39" r="11"/><circle cx="78" cy="29" r="12"/><circle cx="62" cy="18" r="10"/><circle cx="43" cy="61" r="9"/></g>',
  },
  {
    id: "petal",
    name: "Petal",
    category: "Organic",
    source: "loeme",
    collisionRadius: 45,
    body:
      '<path d="M50 7C82 27 90 61 50 93C10 61 18 27 50 7Z" fill="currentColor"/><path d="M50 20V77" stroke="#ffffff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>',
  },
  {
    id: "pebble",
    name: "Pebble",
    category: "Organic",
    source: "loeme",
    collisionRadius: 47,
    body:
      '<path d="M15 55C12 28 31 10 58 13C83 16 94 37 87 62C80 87 53 94 31 83C20 77 16 67 15 55Z" fill="currentColor"/>',
  },
  {
    id: "drop",
    name: "Drop",
    category: "Organic",
    source: "loeme",
    collisionRadius: 45,
    body: '<path d="M50 8C50 8 82 47 82 66C82 84 68 94 50 94C32 94 18 84 18 66C18 47 50 8 50 8Z" fill="currentColor"/>',
  },
  {
    id: "star",
    name: "Star",
    category: "Symbols",
    source: "loeme",
    collisionRadius: 49,
    body:
      '<path d="M50 6L61 37L94 39L68 59L76 91L50 72L24 91L32 59L6 39L39 37L50 6Z" fill="currentColor"/>',
  },
  {
    id: "spark",
    name: "Spark",
    category: "Symbols",
    source: "loeme",
    collisionRadius: 47,
    body:
      '<path d="M50 4C55 31 63 43 96 50C63 57 55 69 50 96C45 69 37 57 4 50C37 43 45 31 50 4Z" fill="currentColor"/>',
  },
  {
    id: "moon",
    name: "Moon",
    category: "Symbols",
    source: "loeme",
    collisionRadius: 56,
    body:
      '<path d="M76 14C43 18 29 54 50 79C59 90 73 92 86 87C70 101 43 98 27 80C7 57 15 22 42 10C54 5 66 7 76 14Z" fill="currentColor"/>',
  },
  {
    id: "ring",
    name: "Ring",
    category: "Symbols",
    source: "loeme",
    collisionRadius: 43,
    body:
      '<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="14"/><circle cx="50" cy="50" r="7" fill="currentColor"/>',
  },
];

const COMPOSE_TRANSFORMS: Record<ComposeLayout, ComposePartTransform[]> = {
  bouquet: [
    { x: 50, y: 39, rotation: 0, scale: 0.62 },
    { x: 27, y: 70, rotation: -28, scale: 0.45 },
    { x: 73, y: 70, rotation: 28, scale: 0.45 },
  ],
  stack: [
    { x: 35, y: 34, rotation: -18, scale: 0.54 },
    { x: 65, y: 55, rotation: 18, scale: 0.52 },
    { x: 43, y: 77, rotation: -8, scale: 0.38 },
  ],
  orbit: [
    { x: 50, y: 27, rotation: 0, scale: 0.43 },
    { x: 27, y: 68, rotation: -22, scale: 0.39 },
    { x: 73, y: 68, rotation: 22, scale: 0.39 },
  ],
};

export const COMPOSE_TRANSFORM_LIMITS = {
  x: { min: 0, max: 100 },
  y: { min: 0, max: 100 },
  rotation: { min: -180, max: 180 },
  scale: { min: 0.05, max: 2 },
} as const;

function uniqueComposeIds(selectedIds: string[]) {
  return Array.from(new Set(selectedIds)).slice(0, 3);
}

function finiteOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeRotation(value: number) {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return Object.is(normalized, -0) ? 0 : normalized;
}

function sanitizeComposePartTransform(
  candidate: Partial<ComposePartTransform> | null | undefined,
  fallback: ComposePartTransform,
): ComposePartTransform {
  const x = finiteOr(candidate?.x, fallback.x);
  const y = finiteOr(candidate?.y, fallback.y);
  const rotation = finiteOr(candidate?.rotation, fallback.rotation);
  const scale = finiteOr(candidate?.scale, fallback.scale);
  return {
    x: clamp(x, COMPOSE_TRANSFORM_LIMITS.x.min, COMPOSE_TRANSFORM_LIMITS.x.max),
    y: clamp(y, COMPOSE_TRANSFORM_LIMITS.y.min, COMPOSE_TRANSFORM_LIMITS.y.max),
    rotation: normalizeRotation(rotation),
    scale: clamp(scale, COMPOSE_TRANSFORM_LIMITS.scale.min, COMPOSE_TRANSFORM_LIMITS.scale.max),
  };
}

/** Start (or reset) direct-manipulation state from a named composition preset. */
export function createComposePartTransforms(
  selectedIds: string[],
  layout: ComposeLayout,
): ComposePartTransforms {
  const preset = COMPOSE_TRANSFORMS[layout] ?? COMPOSE_TRANSFORMS.bouquet;
  return Object.fromEntries(
    uniqueComposeIds(selectedIds).map((id, index) => [id, { ...preset[index] }]),
  );
}

/**
 * Resolve persisted edits over the preset while dropping stale motif entries and
 * making every numeric field finite and bounded. Missing legacy data simply uses
 * the preset.
 */
export function resolveComposePartTransforms(
  selectedIds: string[],
  layout: ComposeLayout,
  overrides?: Record<string, Partial<ComposePartTransform>> | null,
): ComposePartTransforms {
  const initial = createComposePartTransforms(selectedIds, layout);
  return Object.fromEntries(Object.entries(initial).map(([id, fallback]) => {
    const candidate = overrides && Object.prototype.hasOwnProperty.call(overrides, id)
      ? overrides[id]
      : undefined;
    return [
      id,
      sanitizeComposePartTransform(
        candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : undefined,
        fallback,
      ),
    ];
  }));
}

function composeSourceBounds(motif: Motif): MotifBounds {
  const bounds = motif.bounds;
  if (
    bounds
    && Number.isFinite(bounds.x)
    && Number.isFinite(bounds.y)
    && Number.isFinite(bounds.width)
    && Number.isFinite(bounds.height)
    && bounds.width > 0
    && bounds.height > 0
  ) return bounds;
  return { x: 0, y: 0, width: 100, height: 100 };
}

export function buildCompositionMotif(
  motifs: Motif[],
  selectedIds: string[],
  layout: ComposeLayout,
  transformOverrides?: Record<string, Partial<ComposePartTransform>> | null,
): Motif | null {
  const selected = uniqueComposeIds(selectedIds)
    .map((id) => motifs.find((motif) => motif.id === id))
    .filter((motif): motif is Motif => Boolean(motif))
    .slice(0, 3);

  if (selected.length < 2) return null;

  const transforms = resolveComposePartTransforms(
    selected.map((motif) => motif.id),
    layout,
    transformOverrides,
  );
  const body = selected
    .map((motif, index) => {
      const { x, y, rotation, scale } = transforms[motif.id];
      return `<g color="__LOEME_SLOT_${index}__" transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale}) translate(-50 -50)">${motif.body}</g>`;
    })
    .join("");

  const points = selected.flatMap((motif) => {
    const { x, y, rotation, scale } = transforms[motif.id];
    const radians = rotation * Math.PI / 180;
    const bounds = composeSourceBounds(motif);
    return [
      [bounds.x, bounds.y],
      [bounds.x + bounds.width, bounds.y],
      [bounds.x + bounds.width, bounds.y + bounds.height],
      [bounds.x, bounds.y + bounds.height],
    ].map(([sourceX, sourceY]) => {
      const localX = (sourceX - 50) * scale;
      const localY = (sourceY - 50) * scale;
      return {
        x: x + localX * Math.cos(radians) - localY * Math.sin(radians),
        y: y + localX * Math.sin(radians) + localY * Math.cos(radians),
      };
    });
  });
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const transformedCornerRadius = Math.max(
    ...points.map((point) => Math.hypot(point.x - 50, point.y - 50)),
  );
  const transformedDeclaredRadius = Math.max(0, ...selected.map((motif) => {
    const transform = transforms[motif.id];
    const bounds = composeSourceBounds(motif);
    const boundsRadius = Math.max(
      Math.hypot(bounds.x - 50, bounds.y - 50),
      Math.hypot(bounds.x + bounds.width - 50, bounds.y - 50),
      Math.hypot(bounds.x + bounds.width - 50, bounds.y + bounds.height - 50),
      Math.hypot(bounds.x - 50, bounds.y + bounds.height - 50),
    );
    if (
      typeof motif.collisionRadius !== "number"
      || !Number.isFinite(motif.collisionRadius)
      || motif.collisionRadius <= boundsRadius
    ) return 0;
    return Math.hypot(transform.x - 50, transform.y - 50)
      + motif.collisionRadius * transform.scale;
  }));
  const collisionRadius = Math.max(transformedCornerRadius, transformedDeclaredRadius);

  return {
    id: "composition-live",
    name: "Composition",
    category: "Project",
    source: "loeme",
    body,
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    collisionRadius,
    paintMode: compositionPaintMode(selected),
  };
}

function compositionPaintMode(motifs: Motif[]): MotifPaintMode {
  const modes = motifs.map((motif) => motif.paintMode ?? classifySvgPaintMode(motif.body));
  if (modes.every((mode) => mode === "remappable")) return "remappable";
  if (modes.every((mode) => mode === "preserved")) return "preserved";
  return "mixed";
}

export const DEFAULT_SETTINGS: StudioSettings = {
  algorithmVersion: 2,
  layoutMode: "scatter",
  surfaceMode: "artboard",
  seed: 42719,
  targetCount: 30,
  columns: 7,
  organicStrategy: "dense",
  gridOffset: "none",
  gridAssignment: "sequence",
  motifWeights: {},
  minDistance: 4,
  scaleMin: 0.54,
  scaleMax: 1.05,
  rotation: 32,
  width: 720,
  height: 420,
  paletteId: "coastal",
  paletteColors: null,
  backgroundColor: null,
  showBoundary: true,
};

export function resolvePalette(settings: StudioSettings): Palette {
  const preset = PALETTES.find((item) => item.id === settings.paletteId) ?? PALETTES[0];
  return {
    ...preset,
    background: settings.backgroundColor ?? preset.background,
    colors: settings.paletteColors?.length ? settings.paletteColors : preset.colors,
  };
}

export function resolveMotifBody(motif: Motif, colors: string[], colorIndex = 0) {
  if (!colors.length) return motif.body;
  return motif.body.replace(/__LOEME_SLOT_(\d+)__/g, (_, slot: string) => {
    return colors[(colorIndex + Number(slot)) % colors.length];
  });
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
  width: number,
  height: number,
  toroidal: boolean,
) {
  let dx = Math.abs(a.x - b.x);
  let dy = Math.abs(a.y - b.y);
  if (toroidal) {
    dx = Math.min(dx, width - dx);
    dy = Math.min(dy, height - dy);
  }
  return Math.hypot(dx, dy);
}

class SpatialHash {
  private readonly buckets = new Map<string, LayoutInstance[]>();
  private readonly columns: number;
  private readonly rows: number;
  private readonly cellSize: number;
  private readonly width: number;
  private readonly height: number;
  private readonly toroidal: boolean;

  constructor(
    cellSize: number,
    width: number,
    height: number,
    toroidal: boolean,
  ) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.toroidal = toroidal;
    this.columns = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
  }

  private key(column: number, row: number) {
    return `${column}:${row}`;
  }

  insert(instance: LayoutInstance) {
    const column = Math.min(this.columns - 1, Math.max(0, Math.floor(instance.x / this.cellSize)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor(instance.y / this.cellSize)));
    const key = this.key(column, row);
    const bucket = this.buckets.get(key) ?? [];
    bucket.push(instance);
    this.buckets.set(key, bucket);
  }

  query(x: number, y: number, radius: number) {
    const seen = new Set<string>();
    const result: LayoutInstance[] = [];

    // Query the candidate and its nearest periodic images. Scanning exact bucket
    // intervals avoids assuming that the final bucket is a full cell wide when
    // the artboard dimensions are not divisible by cellSize.
    const xCenters = this.toroidal ? [x - this.width, x, x + this.width] : [x];
    const yCenters = this.toroidal ? [y - this.height, y, y + this.height] : [y];
    for (const centerX of xCenters) {
      const minimumColumn = Math.max(0, Math.floor((centerX - radius) / this.cellSize));
      const maximumColumn = Math.min(this.columns - 1, Math.floor((centerX + radius) / this.cellSize));
      if (minimumColumn > maximumColumn) continue;
      for (const centerY of yCenters) {
        const minimumRow = Math.max(0, Math.floor((centerY - radius) / this.cellSize));
        const maximumRow = Math.min(this.rows - 1, Math.floor((centerY + radius) / this.cellSize));
        if (minimumRow > maximumRow) continue;
        for (let column = minimumColumn; column <= maximumColumn; column += 1) {
          for (let row = minimumRow; row <= maximumRow; row += 1) {
            for (const instance of this.buckets.get(this.key(column, row)) ?? []) {
              if (seen.has(instance.id)) continue;
              seen.add(instance.id);
              result.push(instance);
            }
          }
        }
      }
    }
    return result;
  }
}

type PlacementRequest = {
  sourceIndex: number;
  motif: Motif;
  scale: number;
  radius: number;
  rotation: number;
  colorIndex: number;
};

const CONSERVATIVE_NORMALIZED_RADIUS = Math.hypot(50, 50);

function collisionRadiusFor(motif: Motif) {
  if (motif.collisionRadius && motif.collisionRadius > 0) return motif.collisionRadius;
  if (motif.bounds && motif.bounds.width > 0 && motif.bounds.height > 0) {
    const corners = [
      [motif.bounds.x, motif.bounds.y],
      [motif.bounds.x + motif.bounds.width, motif.bounds.y],
      [motif.bounds.x + motif.bounds.width, motif.bounds.y + motif.bounds.height],
      [motif.bounds.x, motif.bounds.y + motif.bounds.height],
    ];
    return Math.max(...corners.map(([x, y]) => Math.hypot(x - 50, y - 50)));
  }
  // Unknown legacy/custom motifs are normalized into a 100×100 coordinate
  // space, so the farthest possible painted corner is the safe fallback.
  return CONSERVATIVE_NORMALIZED_RADIUS;
}

function weightedMotif(motifs: Motif[], weights: Record<string, number>, random: () => number) {
  const resolved = motifs.map((motif) => Math.max(0.01, weights[motif.id] ?? 1));
  const total = resolved.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * total;
  for (let index = 0; index < motifs.length; index += 1) {
    cursor -= resolved[index];
    if (cursor <= 0) return motifs[index];
  }
  return motifs.at(-1) ?? motifs[0];
}

function layoutResult(instances: LayoutInstance[], requestedCount: number): LayoutResult {
  const unplacedCount = Math.max(0, requestedCount - instances.length);
  return {
    instances,
    requestedCount,
    placedCount: instances.length,
    unplacedCount,
    status: unplacedCount ? "capacity-limited" : "complete",
  };
}

function positiveModulo(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus;
}

export function buildInstances(
  motifs: Motif[],
  activeIds: string[],
  settings: LayoutSettings,
): LayoutResult {
  const motifById = new Map<string, Motif>();
  for (const motif of motifs) {
    if (!motifById.has(motif.id)) motifById.set(motif.id, motif);
  }
  const seenActiveIds = new Set<string>();
  const active = activeIds.flatMap((id) => {
    if (seenActiveIds.has(id)) return [];
    seenActiveIds.add(id);
    const motif = motifById.get(id);
    return motif ? [motif] : [];
  });
  const target = Math.max(1, Math.min(settings.targetCount, 160));
  if (!active.length) return layoutResult([], target);
  const versionSalt = Math.imul(settings.algorithmVersion, 0x9e3779b1);
  const assignmentRandom = createRandom(settings.seed ^ versionSalt ^ 0x51f15e);
  const scaleRandom = createRandom(settings.seed ^ versionSalt ^ 0x91e10d);
  const positionRandom = createRandom(settings.seed ^ versionSalt ^ 0x7214ab);
  const rotationRandom = createRandom(settings.seed ^ versionSalt ^ 0x3c6ef3);
  const result: LayoutInstance[] = [];
  const toroidal = settings.surfaceMode === "repeat";

  if (settings.layoutMode === "grid") {
    const columns = Math.max(1, Math.min(settings.columns, target));
    const rows = Math.ceil(target / columns);
    const cellWidth = settings.width / columns;
    const cellHeight = settings.height / rows;
    const baseScale = Math.min(cellWidth, cellHeight) / 82;

    for (let index = 0; index < target; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const motif = settings.gridAssignment === "weighted"
        ? weightedMotif(active, settings.motifWeights, assignmentRandom)
        : settings.gridAssignment === "alternate"
          ? active[(row + column) % active.length]
          : active[index % active.length];
      const minimumScale = Math.min(settings.scaleMin, settings.scaleMax);
      const maximumScale = Math.max(settings.scaleMin, settings.scaleMax);
      const variation = minimumScale + scaleRandom() * (maximumScale - minimumScale);
      const scale = Math.max(0.02, baseScale * variation);
      const rowShift = settings.gridOffset === "row" && row % 2 ? cellWidth * 0.5 : 0;
      const columnShift = settings.gridOffset === "column" && column % 2 ? cellHeight * 0.5 : 0;
      result.push({
        id: `grid-${index}`,
        motifId: motif.id,
        x: positiveModulo((column + 0.5) * cellWidth + rowShift, settings.width),
        y: positiveModulo((row + 0.5) * cellHeight + columnShift, settings.height),
        scale,
        rotation: settings.rotation ? (index % 2 ? settings.rotation * 0.35 : -settings.rotation * 0.35) : 0,
        colorIndex: index,
        radius: collisionRadiusFor(motif) * scale,
      });
    }
    return layoutResult(result, target);
  }

  const requests: PlacementRequest[] = [];
  for (let index = 0; index < target; index += 1) {
    const motif = weightedMotif(active, settings.motifWeights, assignmentRandom);
    const scale = settings.scaleMin + scaleRandom() * Math.max(0, settings.scaleMax - settings.scaleMin);
    requests.push({
      sourceIndex: index,
      motif,
      scale,
      radius: collisionRadiusFor(motif) * scale,
      rotation: (rotationRandom() * 2 - 1) * settings.rotation,
      colorIndex: Math.floor(assignmentRandom() * 100000),
    });
  }

  const orderedRequests = settings.organicStrategy === "dense"
    ? [...requests].sort((a, b) => b.radius - a.radius || a.sourceIndex - b.sourceIndex)
    : requests;
  const maximumRadius = Math.max(...orderedRequests.map((request) => request.radius));
  const hash = new SpatialHash(
    Math.max(24, Math.min(96, maximumRadius + Math.max(0, settings.minDistance))),
    settings.width,
    settings.height,
    toroidal,
  );

  const clearanceAt = (x: number, y: number, radius: number) => {
    if (!toroidal && (x - radius < 0 || x + radius > settings.width || y - radius < 0 || y + radius > settings.height)) {
      return Number.NEGATIVE_INFINITY;
    }
    if (toroidal && (
      radius * 2 + Math.max(0, settings.minDistance) > settings.width
      || radius * 2 + Math.max(0, settings.minDistance) > settings.height
    )) {
      return Number.NEGATIVE_INFINITY;
    }
    const neighbors = hash.query(x, y, radius + maximumRadius + Math.max(0, settings.minDistance));
    let clearance = Number.POSITIVE_INFINITY;
    for (const existing of neighbors) {
      const gap = distance({ x, y }, existing, settings.width, settings.height, toroidal)
        - radius - existing.radius - Math.max(0, settings.minDistance);
      clearance = Math.min(clearance, gap);
      if (clearance < 0) return clearance;
    }
    return clearance;
  };

  const samplePosition = (radius: number) => {
    const marginX = toroidal ? 0 : Math.min(radius, settings.width * 0.5);
    const marginY = toroidal ? 0 : Math.min(radius, settings.height * 0.5);
    return {
      x: marginX + positionRandom() * Math.max(1, settings.width - marginX * 2),
      y: marginY + positionRandom() * Math.max(1, settings.height - marginY * 2),
    };
  };

  const accept = (request: PlacementRequest, position: { x: number; y: number }, id: string) => {
    const instance: LayoutInstance = {
      id,
      motifId: request.motif.id,
      x: position.x,
      y: position.y,
      scale: request.scale,
      rotation: request.rotation,
      colorIndex: request.colorIndex,
      radius: request.radius,
    };
    result.push(instance);
    hash.insert(instance);
  };

  let missed = 0;
  for (const request of orderedRequests) {
    const candidateCount = settings.organicStrategy === "dense" ? 32 : 48;
    let bestPosition: { x: number; y: number } | null = null;
    let bestClearance = Number.NEGATIVE_INFINITY;
    for (let attempt = 0; attempt < candidateCount; attempt += 1) {
      const candidate = samplePosition(request.radius);
      const clearance = clearanceAt(candidate.x, candidate.y, request.radius);
      if (clearance < 0) continue;
      if (settings.organicStrategy === "classic") {
        bestPosition = candidate;
        break;
      }
      const score = Number.isFinite(clearance) ? clearance : maximumRadius * 4;
      if (score > bestClearance) {
        bestClearance = score;
        bestPosition = candidate;
      }
    }
    if (bestPosition) accept(request, bestPosition, `scatter-${request.sourceIndex}`);
    else missed += 1;
  }

  if (settings.organicStrategy === "dense" && missed > 0) {
    const smallestMotif = [...active].sort(
      (a, b) => collisionRadiusFor(a) - collisionRadiusFor(b),
    )[0];
    for (let index = 0; index < missed; index += 1) {
      const scale = settings.scaleMin;
      const radius = collisionRadiusFor(smallestMotif) * scale;
      let bestPosition: { x: number; y: number } | null = null;
      let tightestClearance = Number.POSITIVE_INFINITY;
      for (let attempt = 0; attempt < 96; attempt += 1) {
        const candidate = samplePosition(radius);
        const clearance = clearanceAt(candidate.x, candidate.y, radius);
        if (clearance < 0) continue;
        const score = Number.isFinite(clearance) ? clearance : maximumRadius * 4;
        if (score < tightestClearance) {
          tightestClearance = score;
          bestPosition = candidate;
        }
      }
      if (!bestPosition) continue;
      accept({
        sourceIndex: target + index,
        motif: smallestMotif,
        scale,
        radius,
        rotation: (rotationRandom() * 2 - 1) * settings.rotation,
        colorIndex: Math.floor(assignmentRandom() * 100000),
      }, bestPosition, `scatter-filler-${index}`);
    }
  }
  return layoutResult(result, target);
}

export function colorizeInstances(
  instances: LayoutInstance[],
  colors: string[],
): PatternInstance[] {
  return instances.map((instance) => ({
    ...instance,
    color: colors[instance.colorIndex % colors.length],
  }));
}

export function withWrapCopies<T extends LayoutInstance>(
  instances: T[],
  width: number,
  height: number,
): T[] {
  const result: T[] = [...instances];
  for (const instance of instances) {
    const xOffsets = [0];
    const yOffsets = [0];
    if (instance.x - instance.radius < 0) xOffsets.push(width);
    if (instance.x + instance.radius > width) xOffsets.push(-width);
    if (instance.y - instance.radius < 0) yOffsets.push(height);
    if (instance.y + instance.radius > height) yOffsets.push(-height);

    for (const dx of xOffsets) {
      for (const dy of yOffsets) {
        if (dx === 0 && dy === 0) continue;
        result.push({
          ...instance,
          id: `${instance.id}-wrap-${dx}-${dy}`,
          x: instance.x + dx,
          y: instance.y + dy,
          wrappedFrom: instance.id,
        });
      }
    }
  }
  return result;
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

export function exportFlattenedSvg(
  motifs: Motif[],
  instances: PatternInstance[],
  settings: StudioSettings,
) {
  const palette = resolvePalette(settings);
  const scene = settings.surfaceMode === "repeat"
    ? withWrapCopies(instances, settings.width, settings.height)
    : instances;
  const motifMap = new Map(motifs.map((motif) => [motif.id, motif]));
  const groups = scene
    .map((instance) => {
      const motif = motifMap.get(instance.motifId);
      if (!motif) return "";
      const transform = `translate(${instance.x.toFixed(3)} ${instance.y.toFixed(3)}) rotate(${instance.rotation.toFixed(3)}) scale(${instance.scale.toFixed(4)}) translate(-50 -50)`;
      const body = resolveMotifBody(motif, palette.colors, instance.colorIndex);
      return `<g color="${escapeXml(instance.color)}" transform="${transform}">${body}</g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}">\n<title>Loeme Motif export</title>\n<metadata>Generated by Loeme Motif · /apps/motif</metadata>\n<defs><clipPath id="loeme-artboard-clip" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="${settings.width}" height="${settings.height}"/></clipPath></defs>\n<rect width="100%" height="100%" fill="${escapeXml(palette.background)}"/>\n<g clip-path="url(#loeme-artboard-clip)">${groups}</g>\n</svg>`;
}

const FORBIDDEN_TAGS = new Set([
  "script",
  "foreignobject",
  "image",
  "use",
  "style",
  "filter",
  "mask",
  "clippath",
  "pattern",
  "defs",
  "lineargradient",
  "radialgradient",
  "stop",
  "marker",
  "animate",
  "animatetransform",
]);

const ALLOWED_TAGS = new Set([
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "d",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "points",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "color",
  "paint-order",
  "transform",
  "vector-effect",
]);

const PRESENTATION_ATTRIBUTES = new Set([
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "color",
  "paint-order",
  "vector-effect",
]);

const UNSUPPORTED_VISUAL_ATTRIBUTES = new Set([
  "clip-path",
  "display",
  "filter",
  "mask",
  "marker-end",
  "marker-mid",
  "marker-start",
  "vector-effect",
  "visibility",
]);

export function parseInlineSvgStyle(style: string) {
  const attributes: Record<string, string> = {};
  for (const rawDeclaration of style.split(";")) {
    const declaration = rawDeclaration.trim();
    if (!declaration) continue;
    const separator = declaration.indexOf(":");
    if (separator <= 0) {
      throw new Error("SVG 包含无法解析的内联样式。请先展开样式后再导入。");
    }
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    if (property === "enable-background") continue;
    if (!PRESENTATION_ATTRIBUTES.has(property)) {
      throw new Error(`SVG 使用了暂不支持的样式 ${property}。请先展开为基础填充和描边。`);
    }
    if (/url\s*\(|var\s*\(|javascript:|data:|https?:|@import/i.test(value)) {
      throw new Error("SVG 使用了渐变、外部引用或动态样式，MVP 暂不支持。");
    }
    attributes[property] = value;
  }
  return attributes;
}

function applySafeInlineStyle(node: Element) {
  const style = node.getAttribute("style");
  if (!style) return;
  Object.entries(parseInlineSvgStyle(style)).forEach(([property, value]) => {
    node.setAttribute(property, value);
  });
  node.removeAttribute("style");
}

function parseLength(value: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function classifySvgPaintMode(svgBody: string): MotifPaintMode {
  const paints = Array.from(svgBody.matchAll(/\b(?:fill|stroke)\s*=\s*["']([^"']+)["']/gi))
    .map((match) => match[1].trim().toLowerCase())
    .filter((paint) => paint !== "none" && paint !== "transparent");
  const usesCurrentColor = paints.some((paint) => paint === "currentcolor");
  const usesPreservedPaint = paints.some((paint) => paint !== "currentcolor" && paint !== "inherit");
  if (usesCurrentColor && !usesPreservedPaint) return "remappable";
  if (usesCurrentColor) return "mixed";
  return "preserved";
}

export function normalizeMotifGeometry(sourceBounds: MotifBounds) {
  if (
    !Number.isFinite(sourceBounds.x)
    || !Number.isFinite(sourceBounds.y)
    || !Number.isFinite(sourceBounds.width)
    || !Number.isFinite(sourceBounds.height)
    || sourceBounds.width <= 0
    || sourceBounds.height <= 0
  ) {
    throw new Error("SVG 中没有可测量的矢量边界。");
  }
  const scale = 100 / Math.max(sourceBounds.width, sourceBounds.height);
  const width = sourceBounds.width * scale;
  const height = sourceBounds.height * scale;
  const x = (100 - width) / 2;
  const y = (100 - height) / 2;
  const offsetX = x - sourceBounds.x * scale;
  const offsetY = y - sourceBounds.y * scale;
  return {
    transform: `translate(${offsetX.toFixed(5)} ${offsetY.toFixed(5)}) scale(${scale.toFixed(7)})`,
    bounds: { x, y, width, height },
    collisionRadius: Math.hypot(width / 2, height / 2),
  };
}

function measureSvgBounds(svgBody: string): MotifBounds | null {
  if (typeof document === "undefined" || !document.body) return null;
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  const group = document.createElementNS(namespace, "g");
  svg.setAttribute("width", "1");
  svg.setAttribute("height", "1");
  svg.setAttribute("overflow", "visible");
  svg.style.position = "absolute";
  svg.style.left = "-10000px";
  svg.style.top = "-10000px";
  svg.style.visibility = "hidden";
  svg.style.pointerEvents = "none";
  group.innerHTML = svgBody;
  svg.append(group);
  document.body.append(svg);
  try {
    let measured: DOMRect;
    try {
      measured = (group.getBBox as (options: {
        fill: boolean;
        markers: boolean;
        stroke: boolean;
      }) => DOMRect)({ fill: true, markers: true, stroke: true });
    } catch {
      measured = group.getBBox();
    }
    if (
      !Number.isFinite(measured.x)
      || !Number.isFinite(measured.y)
      || !Number.isFinite(measured.width)
      || !Number.isFinite(measured.height)
      || measured.width <= 0
      || measured.height <= 0
    ) return null;
    return { x: measured.x, y: measured.y, width: measured.width, height: measured.height };
  } catch {
    return null;
  } finally {
    svg.remove();
  }
}

export async function importSvgFile(file: File): Promise<Motif> {
  if (file.size > 300_000) {
    throw new Error("SVG 超过 300 KB。MVP 暂时只接受轻量图形素材。");
  }
  const source = await file.text();
  if (/<!doctype|<!entity|<\?xml-stylesheet/i.test(source)) {
    throw new Error("SVG 包含不受支持的文档声明或外部样式。");
  }
  const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
  if (documentNode.querySelector("parsererror")) {
    throw new Error("无法解析这个 SVG 文件。");
  }
  const root = documentNode.documentElement;
  if (root.tagName.toLowerCase() !== "svg") {
    throw new Error("文件不是有效的 SVG。");
  }
  const allNodes = Array.from(root.querySelectorAll("*"));
  if (allNodes.length > 1200) {
    throw new Error("SVG 节点过多。请先在矢量软件中简化图形。");
  }
  if (allNodes.some((node) => FORBIDDEN_TAGS.has(node.tagName.toLowerCase()))) {
    throw new Error("SVG 包含图片、渐变、滤镜、脚本、Mask 或其他 MVP 暂不支持的效果。");
  }
  const sourceElements = [root, ...allNodes];
  if (sourceElements.some((node) => Array.from(node.attributes).some((attribute) => /url\s*\(/i.test(attribute.value)))) {
    throw new Error("SVG 使用了渐变、Pattern 或外部引用，MVP 暂不支持。");
  }
  sourceElements.forEach(applySafeInlineStyle);
  for (const attribute of Array.from(root.attributes)) {
    const name = attribute.name.toLowerCase();
    if (UNSUPPORTED_VISUAL_ATTRIBUTES.has(name)) {
      throw new Error(`SVG 使用了暂不支持的视觉属性 ${name}。请先展开或移除该效果。`);
    }
    if ((PRESENTATION_ATTRIBUTES.has(name) || name === "transform") && /javascript:|data:|https?:|@import/i.test(attribute.value)) {
      throw new Error("SVG 包含不安全的样式引用。");
    }
  }
  let pathBudget = 0;
  for (const node of allNodes) {
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      node.remove();
      continue;
    }
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;
      const unsafeValue = /url\s*\(|javascript:|data:|https?:|@import/i.test(value);
      if (UNSUPPORTED_VISUAL_ATTRIBUTES.has(name)) {
        throw new Error(`SVG 使用了暂不支持的视觉属性 ${name}。请先展开或移除该效果。`);
      }
      if (!ALLOWED_ATTRIBUTES.has(name) || name.startsWith("on") || unsafeValue) {
        node.removeAttribute(attribute.name);
      }
    }
    if (tag === "path") pathBudget += node.getAttribute("d")?.length ?? 0;
  }
  if (pathBudget > 100_000) {
    throw new Error("SVG 路径过于复杂。请先减少锚点后再导入。");
  }

  const viewBoxValues = (root.getAttribute("viewBox") ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const hasViewBox = viewBoxValues.length === 4 && viewBoxValues.every(Number.isFinite) && viewBoxValues[2] > 0 && viewBoxValues[3] > 0;
  const sourceX = hasViewBox ? viewBoxValues[0] : 0;
  const sourceY = hasViewBox ? viewBoxValues[1] : 0;
  const sourceWidth = hasViewBox ? viewBoxValues[2] : parseLength(root.getAttribute("width"));
  const sourceHeight = hasViewBox ? viewBoxValues[3] : parseLength(root.getAttribute("height"));
  if (!sourceWidth || !sourceHeight) {
    throw new Error("SVG 缺少有效的 viewBox 或宽高。");
  }
  const safeNodes = Array.from(root.children)
    .filter((node) => ALLOWED_TAGS.has(node.tagName.toLowerCase()));
  const serializer = new XMLSerializer();
  const rootWrapperAttributes = Array.from(root.attributes)
    .filter((attribute) => PRESENTATION_ATTRIBUTES.has(attribute.name.toLowerCase()) || attribute.name.toLowerCase() === "transform");
  let safeChildren: string;
  if (rootWrapperAttributes.length) {
    const wrapper = documentNode.createElementNS("http://www.w3.org/2000/svg", "g");
    rootWrapperAttributes.forEach((attribute) => wrapper.setAttribute(attribute.name, attribute.value));
    safeNodes.forEach((node) => wrapper.appendChild(node.cloneNode(true)));
    safeChildren = serializer.serializeToString(wrapper);
  } else {
    safeChildren = safeNodes.map((node) => serializer.serializeToString(node)).join("");
  }
  if (!safeChildren) throw new Error("SVG 中没有可使用的矢量图形。");

  const measuredBounds = measureSvgBounds(safeChildren) ?? {
    x: sourceX,
    y: sourceY,
    width: sourceWidth,
    height: sourceHeight,
  };
  const strokePadding = sourceElements.reduce((maximum, node) => {
    const parsed = Number.parseFloat(node.getAttribute("stroke-width") ?? "0");
    return Number.isFinite(parsed) ? Math.max(maximum, parsed / 2) : maximum;
  }, 0);
  const sourceBounds = strokePadding > 0
    ? {
      x: measuredBounds.x - strokePadding,
      y: measuredBounds.y - strokePadding,
      width: measuredBounds.width + strokePadding * 2,
      height: measuredBounds.height + strokePadding * 2,
    }
    : measuredBounds;
  const normalized = normalizeMotifGeometry(sourceBounds);
  const normalizedStrokeMargin = strokePadding > 0
    ? Math.min(8, strokePadding * 100 / Math.max(sourceBounds.width, sourceBounds.height))
    : 0;
  const body = `<g transform="${normalized.transform}">${safeChildren}</g>`;
  const baseName = file.name.replace(/\.svg$/i, "").trim() || "Imported motif";

  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: baseName.slice(0, 36),
    category: "Project",
    body,
    source: "upload",
    bounds: normalized.bounds,
    collisionRadius: normalized.collisionRadius + normalizedStrokeMargin,
    paintMode: classifySvgPaintMode(safeChildren),
  };
}
