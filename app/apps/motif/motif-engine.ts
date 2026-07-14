export type MotifCategory = "Botanical" | "Organic" | "Symbols" | "Project";

export type Motif = {
  id: string;
  name: string;
  category: MotifCategory;
  body: string;
  source: "loeme" | "upload";
};

export type LayoutMode = "scatter" | "grid";
export type OutputMode = "artboard" | "repeat";
export type ComposeLayout = "bouquet" | "stack" | "orbit";
export type ComposeOutput = "append" | "only";

export type ComposeSettings = {
  enabled: boolean;
  selectedIds: string[];
  layout: ComposeLayout;
  output: ComposeOutput;
};

export type Palette = {
  id: string;
  name: string;
  background: string;
  colors: string[];
};

export type StudioSettings = {
  layoutMode: LayoutMode;
  outputMode: OutputMode;
  seed: number;
  targetCount: number;
  columns: number;
  minDistance: number;
  scaleMin: number;
  scaleMax: number;
  rotation: number;
  width: number;
  height: number;
  paletteId: string;
  showBoundary: boolean;
};

export type PatternInstance = {
  id: string;
  motifId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  radius: number;
  wrappedFrom?: string;
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
    body:
      '<g fill="currentColor"><ellipse cx="50" cy="23" rx="13" ry="23"/><ellipse cx="77" cy="50" rx="23" ry="13"/><ellipse cx="50" cy="77" rx="13" ry="23"/><ellipse cx="23" cy="50" rx="23" ry="13"/><circle cx="50" cy="50" r="11" fill="#19191d"/></g>',
  },
  {
    id: "daisy",
    name: "Daisy",
    category: "Botanical",
    source: "loeme",
    body:
      '<g fill="currentColor"><ellipse cx="50" cy="19" rx="8" ry="19"/><ellipse cx="50" cy="81" rx="8" ry="19"/><ellipse cx="19" cy="50" rx="19" ry="8"/><ellipse cx="81" cy="50" rx="19" ry="8"/><ellipse cx="28" cy="28" rx="8" ry="19" transform="rotate(-45 28 28)"/><ellipse cx="72" cy="72" rx="8" ry="19" transform="rotate(-45 72 72)"/><ellipse cx="72" cy="28" rx="8" ry="19" transform="rotate(45 72 28)"/><ellipse cx="28" cy="72" rx="8" ry="19" transform="rotate(45 28 72)"/><circle cx="50" cy="50" r="10" fill="#19191d"/></g>',
  },
  {
    id: "leaf",
    name: "Leaf",
    category: "Botanical",
    source: "loeme",
    body:
      '<path d="M18 86C16 48 35 16 82 12C84 54 64 83 18 86Z" fill="currentColor"/><path d="M22 80C38 62 53 44 78 18" fill="none" stroke="#ffffff" stroke-opacity=".62" stroke-width="4" stroke-linecap="round"/>',
  },
  {
    id: "sprig",
    name: "Sprig",
    category: "Botanical",
    source: "loeme",
    body:
      '<g fill="currentColor"><path d="M25 91C37 67 48 44 70 12" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><ellipse cx="38" cy="66" rx="10" ry="20" transform="rotate(-55 38 66)"/><ellipse cx="57" cy="52" rx="10" ry="20" transform="rotate(45 57 52)"/><ellipse cx="52" cy="39" rx="9" ry="18" transform="rotate(-48 52 39)"/><ellipse cx="72" cy="26" rx="9" ry="17" transform="rotate(43 72 26)"/></g>',
  },
  {
    id: "berries",
    name: "Berries",
    category: "Botanical",
    source: "loeme",
    body:
      '<g fill="currentColor" stroke="currentColor"><path d="M24 88C40 68 49 48 61 20M44 60L25 42M53 43L77 31" fill="none" stroke-width="4" stroke-linecap="round"/><circle cx="23" cy="39" r="11"/><circle cx="78" cy="29" r="12"/><circle cx="62" cy="18" r="10"/><circle cx="43" cy="61" r="9"/></g>',
  },
  {
    id: "petal",
    name: "Petal",
    category: "Organic",
    source: "loeme",
    body:
      '<path d="M50 7C82 27 90 61 50 93C10 61 18 27 50 7Z" fill="currentColor"/><path d="M50 20V77" stroke="#ffffff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>',
  },
  {
    id: "pebble",
    name: "Pebble",
    category: "Organic",
    source: "loeme",
    body:
      '<path d="M15 55C12 28 31 10 58 13C83 16 94 37 87 62C80 87 53 94 31 83C20 77 16 67 15 55Z" fill="currentColor"/>',
  },
  {
    id: "drop",
    name: "Drop",
    category: "Organic",
    source: "loeme",
    body: '<path d="M50 8C50 8 82 47 82 66C82 84 68 94 50 94C32 94 18 84 18 66C18 47 50 8 50 8Z" fill="currentColor"/>',
  },
  {
    id: "star",
    name: "Star",
    category: "Symbols",
    source: "loeme",
    body:
      '<path d="M50 6L61 37L94 39L68 59L76 91L50 72L24 91L32 59L6 39L39 37L50 6Z" fill="currentColor"/>',
  },
  {
    id: "spark",
    name: "Spark",
    category: "Symbols",
    source: "loeme",
    body:
      '<path d="M50 4C55 31 63 43 96 50C63 57 55 69 50 96C45 69 37 57 4 50C37 43 45 31 50 4Z" fill="currentColor"/>',
  },
  {
    id: "moon",
    name: "Moon",
    category: "Symbols",
    source: "loeme",
    body:
      '<path d="M76 14C43 18 29 54 50 79C59 90 73 92 86 87C70 101 43 98 27 80C7 57 15 22 42 10C54 5 66 7 76 14Z" fill="currentColor"/>',
  },
  {
    id: "ring",
    name: "Ring",
    category: "Symbols",
    source: "loeme",
    body:
      '<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="14"/><circle cx="50" cy="50" r="7" fill="currentColor"/>',
  },
];

const COMPOSE_TRANSFORMS: Record<ComposeLayout, Array<[number, number, number, number]>> = {
  bouquet: [
    [50, 39, 0, 0.62],
    [27, 70, -28, 0.45],
    [73, 70, 28, 0.45],
  ],
  stack: [
    [35, 34, -18, 0.54],
    [65, 55, 18, 0.52],
    [43, 77, -8, 0.38],
  ],
  orbit: [
    [50, 27, 0, 0.43],
    [27, 68, -22, 0.39],
    [73, 68, 22, 0.39],
  ],
};

export function buildCompositionMotif(
  motifs: Motif[],
  selectedIds: string[],
  layout: ComposeLayout,
): Motif | null {
  const selected = selectedIds
    .map((id) => motifs.find((motif) => motif.id === id))
    .filter((motif): motif is Motif => Boolean(motif))
    .slice(0, 3);

  if (selected.length < 2) return null;

  const transforms = COMPOSE_TRANSFORMS[layout];
  const body = selected
    .map((motif, index) => {
      const [x, y, rotation, scale] = transforms[index];
      return `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale}) translate(-50 -50)">${motif.body}</g>`;
    })
    .join("");

  return {
    id: "composition-live",
    name: "Composition",
    category: "Project",
    source: "loeme",
    body,
  };
}

export const DEFAULT_SETTINGS: StudioSettings = {
  layoutMode: "scatter",
  outputMode: "repeat",
  seed: 42719,
  targetCount: 34,
  columns: 7,
  minDistance: 4,
  scaleMin: 0.54,
  scaleMax: 1.05,
  rotation: 32,
  width: 720,
  height: 420,
  paletteId: "coastal",
  showBoundary: true,
};

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

export function buildInstances(
  motifs: Motif[],
  activeIds: string[],
  settings: StudioSettings,
): PatternInstance[] {
  const active = motifs.filter((motif) => activeIds.includes(motif.id));
  if (!active.length) return [];
  const palette = PALETTES.find((item) => item.id === settings.paletteId) ?? PALETTES[0];
  const random = createRandom(settings.seed);
  const result: PatternInstance[] = [];
  const toroidal = settings.outputMode === "repeat";

  if (settings.layoutMode === "grid") {
    const columns = Math.max(1, Math.min(settings.columns, settings.targetCount));
    const rows = Math.ceil(settings.targetCount / columns);
    const cellWidth = settings.width / columns;
    const cellHeight = settings.height / rows;
    const baseScale = Math.min(cellWidth, cellHeight) / 82;

    for (let index = 0; index < settings.targetCount; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const motif = active[index % active.length];
      const variation = 0.88 + random() * 0.2;
      const scale = Math.max(0.18, baseScale * variation);
      result.push({
        id: `grid-${index}`,
        motifId: motif.id,
        x: (column + 0.5) * cellWidth,
        y: (row + 0.5) * cellHeight,
        scale,
        rotation: settings.rotation ? (index % 2 ? settings.rotation * 0.35 : -settings.rotation * 0.35) : 0,
        color: palette.colors[index % palette.colors.length],
        radius: 43 * scale,
      });
    }
    return result;
  }

  const target = Math.max(1, Math.min(settings.targetCount, 160));
  for (let index = 0; index < target; index += 1) {
    let placed = false;
    for (let attempt = 0; attempt < 42 && !placed; attempt += 1) {
      const motif = active[Math.floor(random() * active.length) % active.length];
      const scale = settings.scaleMin + random() * Math.max(0, settings.scaleMax - settings.scaleMin);
      const radius = 37 * scale;
      const marginX = toroidal ? 0 : Math.min(radius, settings.width * 0.18);
      const marginY = toroidal ? 0 : Math.min(radius, settings.height * 0.18);
      const candidate = {
        x: marginX + random() * Math.max(1, settings.width - marginX * 2),
        y: marginY + random() * Math.max(1, settings.height - marginY * 2),
      };
      const overlaps = result.some((existing) => {
        const minimum = Math.max(settings.minDistance, 0) + (existing.radius + radius) * 0.5;
        return distance(candidate, existing, settings.width, settings.height, toroidal) < minimum;
      });

      if (!overlaps || attempt > 36) {
        result.push({
          id: `scatter-${index}`,
          motifId: motif.id,
          x: candidate.x,
          y: candidate.y,
          scale,
          rotation: (random() * 2 - 1) * settings.rotation,
          color: palette.colors[Math.floor(random() * palette.colors.length) % palette.colors.length],
          radius,
        });
        placed = true;
      }
    }
  }
  return result;
}

export function withWrapCopies(
  instances: PatternInstance[],
  width: number,
  height: number,
): PatternInstance[] {
  const result: PatternInstance[] = [...instances];
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
  const palette = PALETTES.find((item) => item.id === settings.paletteId) ?? PALETTES[0];
  const scene = settings.outputMode === "repeat"
    ? withWrapCopies(instances, settings.width, settings.height)
    : instances;
  const motifMap = new Map(motifs.map((motif) => [motif.id, motif]));
  const groups = scene
    .map((instance) => {
      const motif = motifMap.get(instance.motifId);
      if (!motif) return "";
      const transform = `translate(${instance.x.toFixed(3)} ${instance.y.toFixed(3)}) rotate(${instance.rotation.toFixed(3)}) scale(${instance.scale.toFixed(4)}) translate(-50 -50)`;
      return `<g color="${escapeXml(instance.color)}" transform="${transform}">${motif.body}</g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}">\n<title>Loeme Motif export</title>\n<metadata>Generated by Loeme Motif · /apps/motif</metadata>\n<rect width="100%" height="100%" fill="${escapeXml(palette.background)}"/>\n<g>${groups}</g>\n</svg>`;
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
  "opacity",
  "transform",
  "vector-effect",
]);

function parseLength(value: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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
    throw new Error("SVG 包含图片、滤镜、脚本、Mask 或其他 MVP 暂不支持的效果。");
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
  const safeChildren = Array.from(root.children)
    .filter((node) => ALLOWED_TAGS.has(node.tagName.toLowerCase()))
    .map((node) => new XMLSerializer().serializeToString(node))
    .join("");
  if (!safeChildren) throw new Error("SVG 中没有可使用的矢量图形。");

  const scale = 100 / Math.max(sourceWidth, sourceHeight);
  const offsetX = (100 - sourceWidth * scale) / 2 - sourceX * scale;
  const offsetY = (100 - sourceHeight * scale) / 2 - sourceY * scale;
  const body = `<g transform="translate(${offsetX.toFixed(5)} ${offsetY.toFixed(5)}) scale(${scale.toFixed(7)})">${safeChildren}</g>`;
  const baseName = file.name.replace(/\.svg$/i, "").trim() || "Imported motif";

  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: baseName.slice(0, 36),
    category: "Project",
    body,
    source: "upload",
  };
}
