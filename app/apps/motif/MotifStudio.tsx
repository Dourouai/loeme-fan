"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_SETTINGS,
  ComposeSettings,
  Motif,
  PALETTES,
  PatternInstance,
  STARTER_MOTIFS,
  StudioSettings,
  buildCompositionMotif,
  buildInstances,
  colorizeInstances,
  exportFlattenedSvg,
  importSvgFile,
  resolveMotifBody,
  resolvePalette,
  withWrapCopies,
} from "./motif-engine";
import "./motif.css";

type NodeId = "input" | "compose" | "arrange" | "colorway" | "output";

type ProjectState = {
  name: string;
  activeIds: string[];
  importedMotifs: Motif[];
  compose: ComposeSettings;
  settings: StudioSettings;
};

type HistoryState = {
  past: ProjectState[];
  present: ProjectState;
  future: ProjectState[];
};

type HistoryAction =
  | { type: "commit"; next: ProjectState }
  | { type: "load"; next: ProjectState }
  | { type: "undo" }
  | { type: "redo" };

const STORAGE_KEY = "loeme-motif-mvp-v2";
const LEGACY_STORAGE_KEY = "loeme-motif-mvp-v1";

const DEFAULT_COMPOSE: ComposeSettings = {
  enabled: false,
  selectedIds: ["bloom", "leaf", "sprig"],
  layout: "bouquet",
  output: "replace",
};

const initialProject: ProjectState = {
  name: "Coastal Bloom",
  activeIds: ["bloom", "leaf", "sprig", "berries", "petal", "daisy"],
  importedMotifs: [],
  compose: DEFAULT_COMPOSE,
  settings: DEFAULT_SETTINGS,
};

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "load") {
    return { past: [], present: action.next, future: [] };
  }
  if (action.type === "commit") {
    return {
      past: [...state.past.slice(-39), state.present],
      present: action.next,
      future: [],
    };
  }
  if (action.type === "undo") {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }
  const next = state.future[0];
  if (!next) return state;
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1),
  };
}

function MotifGlyph({
  motif,
  instance,
  colors,
  offsetX = 0,
  offsetY = 0,
}: {
  motif: Motif;
  instance: PatternInstance;
  colors: string[];
  offsetX?: number;
  offsetY?: number;
}) {
  const transform = `translate(${instance.x + offsetX} ${instance.y + offsetY}) rotate(${instance.rotation}) scale(${instance.scale}) translate(-50 -50)`;
  return (
    <g
      transform={transform}
      color={instance.color}
      dangerouslySetInnerHTML={{ __html: resolveMotifBody(motif, colors, instance.colorIndex) }}
    />
  );
}

function MiniMotif({ motif, color = "#7c58e8", colors = [color] }: { motif: Motif; color?: string; colors?: string[] }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <g color={color} dangerouslySetInnerHTML={{ __html: resolveMotifBody(motif, colors) }} />
    </svg>
  );
}

function PalettePreview({ motifs, colors, background }: { motifs: Motif[]; colors: string[]; background: string }) {
  return (
    <span className="motif-palette-preview" style={{ background }} aria-hidden="true">
      {motifs.slice(0, 5).map((motif, index) => (
        <span key={motif.id}>
          <MiniMotif motif={motif} color={colors[index % colors.length]} colors={colors} />
        </span>
      ))}
    </span>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="motif-field">
      <span>{label}</span>
      <div className="motif-range-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <output>
          {Number.isInteger(step) ? value : value.toFixed(2)}{suffix}
        </output>
      </div>
    </label>
  );
}

export default function MotifStudio({ startFresh = false }: { startFresh?: boolean }) {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialProject,
    future: [],
  });
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"Saved" | "Saving">("Saved");
  const [libraryMode, setLibraryMode] = useState<"starter" | "project">("starter");
  const [selectedNode, setSelectedNode] = useState<NodeId>("arrange");
  const [viewedNode, setViewedNode] = useState<NodeId>("arrange");
  const [notice, setNotice] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const project = history.present;
  const settings = project.settings;

  const motifs = useMemo(
    () => [...STARTER_MOTIFS, ...project.importedMotifs],
    [project.importedMotifs],
  );
  const resolvedComposeIds = useMemo(() => {
    const active = new Set(project.activeIds);
    return project.compose.selectedIds.filter((id) => active.has(id)).slice(0, 3);
  }, [project.activeIds, project.compose.selectedIds]);
  const compositionPreview = useMemo(
    () => buildCompositionMotif(motifs, resolvedComposeIds, project.compose.layout),
    [motifs, project.compose.layout, resolvedComposeIds],
  );
  const arrangementMotifs = useMemo(
    () => project.compose.enabled && compositionPreview ? [...motifs, compositionPreview] : motifs,
    [compositionPreview, motifs, project.compose.enabled],
  );
  const arrangementActiveIds = useMemo(() => {
    if (!project.compose.enabled || !compositionPreview) return project.activeIds;
    if (project.compose.output === "only") return [compositionPreview.id];
    if (project.compose.output === "append") return [...project.activeIds, compositionPreview.id];
    return [
      ...project.activeIds.filter((id) => !resolvedComposeIds.includes(id)),
      compositionPreview.id,
    ];
  }, [compositionPreview, project.activeIds, project.compose.enabled, project.compose.output, resolvedComposeIds]);
  const motifMap = useMemo(
    () => new Map(arrangementMotifs.map((motif) => [motif.id, motif])),
    [arrangementMotifs],
  );
  const arrangeInputMotifs = useMemo(
    () => arrangementActiveIds
      .map((id) => motifMap.get(id))
      .filter((motif): motif is Motif => Boolean(motif)),
    [arrangementActiveIds, motifMap],
  );
  const palette = resolvePalette(settings);
  const layoutResult = useMemo(
    () => buildInstances(arrangementMotifs, arrangementActiveIds, {
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
    }),
    [
      arrangementActiveIds,
      arrangementMotifs,
      settings.algorithmVersion,
      settings.columns,
      settings.gridAssignment,
      settings.gridOffset,
      settings.height,
      settings.layoutMode,
      settings.minDistance,
      settings.motifWeights,
      settings.organicStrategy,
      settings.rotation,
      settings.scaleMax,
      settings.scaleMin,
      settings.seed,
      settings.surfaceMode,
      settings.targetCount,
      settings.width,
    ],
  );
  const layoutInstances = layoutResult.instances;
  const instances = useMemo(
    () => colorizeInstances(layoutInstances, palette.colors),
    [layoutInstances, palette.colors],
  );
  const displayedInstances = useMemo(
    () => settings.surfaceMode === "repeat"
      ? withWrapCopies(instances, settings.width, settings.height)
      : instances,
    [instances, settings.surfaceMode, settings.width, settings.height],
  );

  useEffect(() => {
    if (startFresh) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      dispatch({ type: "load", next: initialProject });
      const freshTimer = window.setTimeout(() => setHydrated(true), 0);
      return () => window.clearTimeout(freshTimer);
    }
    let loadNotice = "";
    try {
      const currentStored = window.localStorage.getItem(STORAGE_KEY);
      const legacyStored = currentStored ? null : window.localStorage.getItem(LEGACY_STORAGE_KEY);
      const stored = currentStored ?? legacyStored;
      if (stored) {
        const parsed = JSON.parse(stored) as ProjectState;
        if (parsed?.settings && Array.isArray(parsed.activeIds)) {
          const legacySettings = parsed.settings as StudioSettings & { outputMode?: "artboard" | "repeat" };
          const upgradedArrange = typeof legacySettings.algorithmVersion !== "number";
          const { outputMode: legacyOutputMode, ...currentSettings } = legacySettings;
          dispatch({
            type: "load",
            next: {
              ...initialProject,
              ...parsed,
              settings: {
                ...DEFAULT_SETTINGS,
                ...currentSettings,
                algorithmVersion: legacySettings.algorithmVersion ?? DEFAULT_SETTINGS.algorithmVersion,
                surfaceMode: legacySettings.surfaceMode ?? legacyOutputMode ?? DEFAULT_SETTINGS.surfaceMode,
              },
              compose: {
                ...DEFAULT_COMPOSE,
                ...(parsed.compose ?? {}),
                output: legacyStored ? "replace" : (parsed.compose?.output ?? "replace"),
              },
              importedMotifs: Array.isArray(parsed.importedMotifs) ? parsed.importedMotifs : [],
            },
          });
          if (upgradedArrange) loadNotice = "Arrange Engine 已升级到 v2；旧项目会使用新的无强制重叠布局重新计算。";
        }
      }
    } catch {
      loadNotice = "本地项目无法恢复，已打开一个新项目。";
    }
    const hydrationTimer = window.setTimeout(() => {
      if (loadNotice) setNotice(loadNotice);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [startFresh]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        setSaveState("Saved");
      } catch {
        setSaveState("Saved");
        setNotice("本地存储空间不足，请先导出 SVG 或重置项目。");
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [hydrated, project]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function commit(next: ProjectState) {
    setSaveState("Saving");
    dispatch({ type: "commit", next });
  }

  function moveHistory(type: "undo" | "redo") {
    setSaveState("Saving");
    dispatch({ type });
  }

  function updateSettings(patch: Partial<StudioSettings>) {
    commit({ ...project, settings: { ...settings, ...patch } });
  }

  function updateCompose(patch: Partial<ComposeSettings>) {
    if (patch.enabled && resolvedComposeIds.length < 2) {
      setNotice("Compose 至少需要两个 Input motif。");
      return;
    }
    commit({ ...project, compose: { ...project.compose, ...patch } });
  }

  function toggleComposeMotif(id: string) {
    const selected = resolvedComposeIds.includes(id);
    if (selected && resolvedComposeIds.length <= 2) {
      setNotice("组合至少需要两个 motif。");
      return;
    }
    if (!selected && resolvedComposeIds.length >= 3) {
      setNotice("首版组合最多使用三个 motif。");
      return;
    }
    updateCompose({
      selectedIds: selected
        ? resolvedComposeIds.filter((selectedId) => selectedId !== id)
        : [...resolvedComposeIds, id],
    });
  }

  function toggleMotif(motif: Motif) {
    const isActive = project.activeIds.includes(motif.id);
    if (
      isActive
      && project.compose.enabled
      && resolvedComposeIds.includes(motif.id)
      && resolvedComposeIds.length <= 2
    ) {
      setNotice("这个 motif 正在 Compose 中使用。请先在 Compose 节点更换或关闭组合。");
      return;
    }
    const nextIds = isActive
      ? project.activeIds.filter((id) => id !== motif.id)
      : [...project.activeIds, motif.id];
    if (!nextIds.length) {
      setNotice("至少保留一个 Motif 参与布局。");
      return;
    }
    const selectedIds = project.compose.selectedIds.filter((id) => nextIds.includes(id));
    commit({
      ...project,
      activeIds: nextIds,
      compose: {
        ...project.compose,
        selectedIds: selectedIds.slice(0, 3),
      },
    });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const motif = await importSvgFile(file);
      commit({
        ...project,
        importedMotifs: [...project.importedMotifs, motif],
        activeIds: [...project.activeIds, motif.id],
      });
      setLibraryMode("project");
      setNotice(`${motif.name} 已安全导入并加入当前布局。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "导入失败，请换一个 SVG 再试。");
    }
  }

  function shuffleSeed() {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    updateSettings({ seed: values[0] || 1 });
  }

  function updateScaleVariation(value: number) {
    const center = (settings.scaleMin + settings.scaleMax) / 2;
    const halfRange = value / 200;
    updateSettings({
      scaleMin: Math.max(0.2, Number((center - halfRange).toFixed(2))),
      scaleMax: Math.min(1.8, Number((center + halfRange).toFixed(2))),
    });
  }

  function updatePaletteColor(index: number, color: string) {
    const colors = [...palette.colors];
    colors[index] = color;
    updateSettings({ paletteColors: colors });
  }

  function updateMotifWeight(id: string, weight: number) {
    updateSettings({
      motifWeights: {
        ...settings.motifWeights,
        [id]: Number(Math.max(0.25, Math.min(3, weight)).toFixed(2)),
      },
    });
  }

  function downloadSvg() {
    if (!instances.length) {
      setNotice("当前没有可导出的图形。");
      return;
    }
    const svg = exportFlattenedSvg(arrangementMotifs, instances, settings);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "loeme-motif"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${settings.surfaceMode === "repeat" ? "Repeat" : "Artboard"} SVG 已导出。`);
  }

  function resetProject() {
    if (!window.confirm("重置当前项目？本地修改和导入素材都会被清除。")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    dispatch({ type: "load", next: initialProject });
    setNotice("项目已重置。");
  }

  const visibleLibrary = libraryMode === "starter" ? STARTER_MOTIFS : project.importedMotifs;
  const inputOutputMotifs = project.activeIds
    .map((id) => motifs.find((motif) => motif.id === id))
    .filter((motif): motif is Motif => Boolean(motif));
  const isSetPreview = viewedNode === "input" || viewedNode === "compose";
  const previewMotifs = viewedNode === "input" ? inputOutputMotifs : arrangeInputMotifs;
  const tiles = viewedNode === "output" && settings.surfaceMode === "repeat" ? 3 : 1;
  const canvasWidth = settings.width * tiles;
  const canvasHeight = settings.height * tiles;
  const tileEntries = Array.from({ length: tiles * tiles }, (_, index) => ({
    x: (index % tiles) * settings.width,
    y: Math.floor(index / tiles) * settings.height,
    id: index,
  }));
  const scaleVariation = Math.round((settings.scaleMax - settings.scaleMin) * 100);
  const canvasTitle = viewedNode === "input"
    ? "Input · Motif Set Output"
    : viewedNode === "compose"
      ? project.compose.enabled ? "Compose · Motif Set Output" : "Compose Bypassed · Input Passed Through"
      : viewedNode === "arrange"
        ? "Arrangement Preview"
        : viewedNode === "colorway"
          ? "Colorway Preview"
          : settings.surfaceMode === "repeat" ? "Seamless Preview" : "Artboard Preview";
  const nodeContracts: Record<NodeId, { input: string; output: string; summary: string }> = {
    input: { input: "Asset Library", output: "Motif Set", summary: `${inputOutputMotifs.length} motifs out` },
    compose: { input: "Motif Set", output: "Motif Set", summary: `${inputOutputMotifs.length} in · ${arrangeInputMotifs.length} out` },
    arrange: { input: "Motif Set", output: "Layout Scene", summary: `${arrangeInputMotifs.length} motifs · ${layoutInstances.length} transforms` },
    colorway: { input: "Layout Scene", output: "Styled Scene", summary: `${instances.length} instances mapped` },
    output: { input: "Styled Scene", output: "SVG", summary: `${settings.width} × ${settings.height} SVG` },
  };
  const recipeNodes: Array<{ id: NodeId; type: string; name: string; summary: string; optional?: boolean }> = [
    { id: "input", type: "SET", name: "Input", summary: `${inputOutputMotifs.length} motifs out` },
    { id: "compose", type: "SET", name: project.compose.enabled ? "Compose" : "+ Compose", summary: project.compose.enabled ? `${inputOutputMotifs.length} → ${arrangeInputMotifs.length}` : "Optional · bypassed", optional: true },
    { id: "arrange", type: "LAYOUT", name: "Arrange", summary: `${arrangeInputMotifs.length} motifs → ${layoutInstances.length}` },
    { id: "colorway", type: "SCENE", name: "Colorway", summary: palette.name },
    { id: "output", type: "FILE", name: "Output", summary: settings.surfaceMode === "repeat" ? "Repeat SVG" : "Artboard SVG" },
  ];

  return (
    <main className="motif-app">
      <header className="motif-topbar">
        <div className="motif-brand" aria-label="Motif application">
          <img className="motif-brand-app-icon" src="/brand/motif-app-icon.svg" alt="" />
          <strong>Motif</strong>
        </div>

        <div className="motif-project-title">
          <span className="motif-back">←</span>
          <input
            aria-label="Project name"
            value={project.name}
            onChange={(event) => commit({ ...project, name: event.target.value })}
          />
          <span className={`motif-save-dot ${saveState === "Saving" ? "is-saving" : ""}`} />
          <span>{saveState}</span>
        </div>

        <nav className="motif-view-tabs" aria-label="Workspace views">
          <button className="is-active">Canvas</button>
          <button disabled title="Network will follow after MVP validation">Network <small>Soon</small></button>
          <button
            className="motif-surface-tab"
            onClick={() => updateSettings({ surfaceMode: settings.surfaceMode === "repeat" ? "artboard" : "repeat" })}
            title="Global surface context · affects Arrange edge behavior"
          >
            <small>Surface</small> {settings.surfaceMode === "repeat" ? "Tile" : "Artboard"}
          </button>
        </nav>

        <div className="motif-top-actions">
          <button
            className="motif-icon-button"
            aria-label="Undo"
            disabled={!history.past.length}
            onClick={() => moveHistory("undo")}
          >↶</button>
          <button
            className="motif-icon-button"
            aria-label="Redo"
            disabled={!history.future.length}
            onClick={() => moveHistory("redo")}
          >↷</button>
          <button className="motif-export-top" onClick={downloadSvg}>Export Final SVG <span>↗</span></button>
        </div>
      </header>

      <section className="motif-workspace">
        <aside className="motif-library-panel motif-panel">
          <div className="motif-panel-heading">
            <div>
              <span className="motif-eyebrow">INPUT</span>
              <h2>Motifs</h2>
            </div>
            <button className="motif-icon-button" aria-label="Import SVG" onClick={() => fileInputRef.current?.click()}>＋</button>
          </div>

          <div className="motif-library-tabs">
            <button className={libraryMode === "starter" ? "is-active" : ""} onClick={() => setLibraryMode("starter")}>Starter</button>
            <button className={libraryMode === "project" ? "is-active" : ""} onClick={() => setLibraryMode("project")}>Project <span>{project.importedMotifs.length}</span></button>
          </div>

          <div className="motif-library-meta">
            <span>{visibleLibrary.length} vector motifs</span>
            <span>{project.activeIds.length} active</span>
          </div>

          <div className="motif-grid">
            {visibleLibrary.map((motif, index) => {
              const active = project.activeIds.includes(motif.id);
              return (
                <button
                  key={motif.id}
                  className={`motif-card ${active ? "is-active" : ""}`}
                  onClick={() => toggleMotif(motif)}
                  aria-pressed={active}
                  title={`${active ? "Remove" : "Add"} ${motif.name}`}
                >
                  <span className="motif-card-preview">
                    <MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} colors={palette.colors} />
                  </span>
                  <span className="motif-card-name">{motif.name}</span>
                  <span className="motif-card-check">{active ? "✓" : "+"}</span>
                </button>
              );
            })}
            {libraryMode === "project" && !visibleLibrary.length && (
              <button className="motif-empty-library" onClick={() => fileInputRef.current?.click()}>
                <span>＋</span>
                Import your first SVG
                <small>Path, shapes and solid colors</small>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/svg+xml,.svg"
            onChange={handleImport}
            hidden
          />
          <button className="motif-import-button" onClick={() => fileInputRef.current?.click()}>
            <span>＋</span> Import SVG
          </button>
          <p className="motif-library-note">Files stay on this device. Filters, images and scripts are rejected.</p>
        </aside>

        <section className="motif-center-column">
          <div className="motif-canvas-panel motif-panel">
            <div className="motif-canvas-header">
              <div>
                <span className="motif-eyebrow">VIEWING {viewedNode.toUpperCase()} · LIVE OUTPUT</span>
                <h1>{canvasTitle}</h1>
              </div>
              <div className="motif-canvas-status">
                <span className="motif-live-dot" /> Live
                {selectedNode !== viewedNode && (
                  <button onClick={() => setViewedNode(selectedNode)}>View selected</button>
                )}
                {!isSetPreview && (
                  <button onClick={() => updateSettings({ showBoundary: !settings.showBoundary })}>
                    {settings.showBoundary ? "Hide grid" : "Show grid"}
                  </button>
                )}
              </div>
            </div>

            <div className="motif-canvas-stage" style={{ background: palette.background }}>
              {isSetPreview ? (
                <div className="motif-set-preview" role="img" aria-label={`${viewedNode} output with ${previewMotifs.length} motifs`}>
                  <div className="motif-set-preview-grid">
                    {previewMotifs.map((motif, index) => (
                      <div key={motif.id} className={motif.id === "composition-live" ? "is-composition" : ""}>
                        <MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} colors={palette.colors} />
                        <span>{motif.name}</span>
                        {motif.id === "composition-live" && <b>COMPOSED</b>}
                      </div>
                    ))}
                  </div>
                  <div className="motif-set-output-label">
                    <span>{nodeContracts[viewedNode].output}</span>
                    <strong>{previewMotifs.length} motifs</strong>
                  </div>
                </div>
              ) : (
              <svg
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                role="img"
                aria-label={`${settings.surfaceMode} preview with ${instances.length} vector instances`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <clipPath id="motif-tile-clip">
                    <rect width={settings.width} height={settings.height} />
                  </clipPath>
                </defs>
                {tileEntries.map((tile) => (
                  <g key={tile.id} transform={`translate(${tile.x} ${tile.y})`}>
                    <rect width={settings.width} height={settings.height} fill={palette.background} />
                    <g clipPath="url(#motif-tile-clip)">
                      {displayedInstances.map((instance) => {
                        const motif = motifMap.get(instance.motifId);
                        return motif ? <MotifGlyph key={`${tile.id}-${instance.id}`} motif={motif} instance={instance} colors={palette.colors} /> : null;
                      })}
                    </g>
                    {settings.showBoundary && (
                      <rect
                        x="0.75"
                        y="0.75"
                        width={Math.max(0, settings.width - 1.5)}
                        height={Math.max(0, settings.height - 1.5)}
                        fill="none"
                        stroke="#7c58e8"
                        strokeOpacity={settings.surfaceMode === "repeat" ? 0.2 : 0.42}
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                ))}
              </svg>
              )}

              <div className="motif-canvas-toolbar">
                {isSetPreview ? (
                  <>
                    <span>{nodeContracts[viewedNode].input}</span>
                    <span>→ {nodeContracts[viewedNode].output}</span>
                    <span>{previewMotifs.length} motifs</span>
                  </>
                ) : (
                  <>
                    <span>{tiles} × {tiles}</span>
                    <span>{settings.width} × {settings.height}</span>
                    <span>{instances.length} instances</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="motif-recipe-panel motif-panel">
            <div className="motif-recipe-heading">
              <div>
                <span className="motif-eyebrow">LIVE DATA FLOW</span>
                <h2>Node outputs</h2>
              </div>
              <span>Click a node to inspect its output</span>
            </div>
            <div className="motif-recipe-flow">
              {recipeNodes.map((node, index) => (
                <div className="motif-node-wrap" key={node.id}>
                  <button
                    className={`motif-node-card ${selectedNode === node.id ? "is-selected" : ""} ${viewedNode === node.id ? "is-viewed" : ""} ${node.id === "compose" && !project.compose.enabled ? "is-bypassed is-optional" : ""}`}
                    onClick={() => { setSelectedNode(node.id); setViewedNode(node.id); }}
                    aria-pressed={selectedNode === node.id}
                    aria-label={`${node.name} node, ${node.summary}`}
                  >
                    <span>{node.type}</span>
                    <strong>{node.name}</strong>
                    <small>{node.summary}</small>
                    <em>{nodeContracts[node.id].input} → {nodeContracts[node.id].output}</em>
                    {viewedNode === node.id && <b className="motif-viewer-flag" title="Shown on canvas">VIEW</b>}
                    <i />
                  </button>
                  {index < 4 && <span className="motif-node-link" aria-hidden="true">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="motif-inspector motif-panel">
          <div className="motif-inspector-title">
            <div>
              <span className={`motif-node-status ${selectedNode === "compose" && !project.compose.enabled ? "is-bypassed" : ""}`} />
              <span className="motif-eyebrow">{selectedNode.toUpperCase()}</span>
              <h2>{selectedNode === "input" ? "Input set" : selectedNode === "compose" ? "Compose" : selectedNode === "arrange" ? "Arrange" : selectedNode === "colorway" ? "Colorway" : "Output"}</h2>
            </div>
            <button className="motif-reset-button" aria-label="Reset project" title="Reset project" onClick={resetProject}>Reset</button>
          </div>

          <div className="motif-node-contract">
            <div><span>INPUT</span><strong>{nodeContracts[selectedNode].input}</strong></div>
            <i aria-hidden="true">→</i>
            <div><span>OUTPUT</span><strong>{nodeContracts[selectedNode].output}</strong></div>
          </div>

          <div className="motif-inspector-body">
          {selectedNode === "input" && (
            <div className="motif-inspector-section">
              <p className="motif-section-copy">Choose Starter motifs or import a simple SVG. This exact set flows into the next active node.</p>
              <div className="motif-active-stack">
                {project.activeIds.slice(0, 8).map((id, index) => {
                  const motif = motifMap.get(id);
                  return motif ? (
                    <div key={id}>
                      <MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} colors={palette.colors} />
                      <span>{motif.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
              <button className="motif-primary-light" onClick={() => fileInputRef.current?.click()}>＋ Add SVG motif</button>
            </div>
          )}

          {selectedNode === "compose" && (
            <>
              <div className="motif-inspector-section">
                <div className="motif-config-intro">
                  <span>OPTIONAL STEP</span>
                  <strong>Build one reusable motif</strong>
                  <p>Choose a few parts, pick a starting composition, then send the result into Arrange.</p>
                </div>
                <div className="motif-compose-preview" aria-label="Composition preview">
                  {compositionPreview ? <MiniMotif motif={compositionPreview} color={palette.colors[0]} colors={palette.colors} /> : <span>Select two motifs</span>}
                  <div>
                    <strong>{project.compose.layout[0].toUpperCase() + project.compose.layout.slice(1)}</strong>
                    <small>{resolvedComposeIds.length} motifs · paths preserved</small>
                  </div>
                </div>
                <div className="motif-compose-toggle">
                  <div>
                    <strong>Use this composition</strong>
                    <small>{project.compose.enabled ? "Included in Arrange" : "Currently bypassed"}</small>
                  </div>
                  <button
                    role="switch"
                    aria-checked={project.compose.enabled}
                    className={project.compose.enabled ? "is-active" : ""}
                    onClick={() => updateCompose({ enabled: !project.compose.enabled })}
                  >
                    <span />{project.compose.enabled ? "On" : "Bypass"}
                  </button>
                </div>
              </div>

              <div className="motif-inspector-section">
                <span className="motif-step-label"><b>1</b> Choose 2–3 parts</span>
                <div className="motif-compose-motifs">
                  {project.activeIds.map((id, index) => {
                    const motif = motifMap.get(id);
                    const selected = resolvedComposeIds.includes(id);
                    return motif ? (
                      <button
                        key={id}
                        className={selected ? "is-active" : ""}
                        aria-pressed={selected}
                        onClick={() => toggleComposeMotif(id)}
                        title={`${selected ? "Remove" : "Add"} ${motif.name} ${selected ? "from" : "to"} composition`}
                      >
                        <MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} colors={palette.colors} />
                        <span>{motif.name}</span>
                        <i>{selected ? "✓" : "+"}</i>
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="motif-inspector-section">
                <span className="motif-step-label"><b>2</b> Choose a starting layout</span>
                <div className="motif-layout-options">
                  {(["bouquet", "stack", "orbit"] as const).map((layout) => (
                    <button
                      key={layout}
                      className={project.compose.layout === layout ? "is-active" : ""}
                      aria-pressed={project.compose.layout === layout}
                      onClick={() => updateCompose({ layout })}
                    >
                      <span className={`motif-layout-icon is-${layout}`}><i /><i /><i /></span>
                      {layout[0].toUpperCase() + layout.slice(1)}
                    </button>
                  ))}
                </div>
                <span className="motif-step-label motif-compose-output-label"><b>3</b> Send to Arrange</span>
                <div className="motif-output-strategy">
                  <button aria-pressed={project.compose.output === "replace"} className={project.compose.output === "replace" ? "is-active" : ""} onClick={() => updateCompose({ output: "replace" })}>
                    <strong>Replace selected</strong><small>Recommended · selected parts become one</small><i>✓</i>
                  </button>
                  <button aria-pressed={project.compose.output === "append"} className={project.compose.output === "append" ? "is-active" : ""} onClick={() => updateCompose({ output: "append" })}>
                    <strong>Keep source parts</strong><small>Add composition without removing parts</small><i>✓</i>
                  </button>
                  <button aria-pressed={project.compose.output === "only"} className={project.compose.output === "only" ? "is-active" : ""} onClick={() => updateCompose({ output: "only" })}>
                    <strong>Composition only</strong><small>Send only the new combined motif</small><i>✓</i>
                  </button>
                </div>
                <div className="motif-node-output-tray">
                  <div>
                    <span>OUTPUT TO ARRANGE</span>
                    <small>{project.compose.enabled ? `${arrangeInputMotifs.length} motifs` : "Bypassed · Input passes through"}</small>
                  </div>
                  <div className="motif-output-thumbnails">
                    {arrangeInputMotifs.slice(0, 6).map((motif, index) => (
                      <span key={motif.id} title={motif.name}><MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} colors={palette.colors} /></span>
                    ))}
                    {arrangeInputMotifs.length > 6 && <b>+{arrangeInputMotifs.length - 6}</b>}
                    <i aria-hidden="true">→</i>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedNode === "arrange" && (
            <>
              <div className="motif-inspector-section">
                <div className="motif-config-intro">
                  <span>PLACEMENT</span>
                  <strong>How should motifs fill the canvas?</strong>
                  <p>Arrange uses the exact motif set produced by the previous node.</p>
                </div>
                <div className="motif-arrange-input">
                  <div>
                    <span>INPUT FROM {project.compose.enabled ? "COMPOSE" : "INPUT"}</span>
                    <strong>{arrangeInputMotifs.length} motifs ready</strong>
                  </div>
                  <div>
                    {arrangeInputMotifs.slice(0, 5).map((motif, index) => (
                      <span key={motif.id}><MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} colors={palette.colors} /></span>
                    ))}
                    {arrangeInputMotifs.length > 5 && <b>+{arrangeInputMotifs.length - 5}</b>}
                  </div>
                </div>
                <div className="motif-mode-grid">
                  <button aria-pressed={settings.layoutMode === "scatter"} className={settings.layoutMode === "scatter" ? "is-active" : ""} onClick={() => updateSettings({ layoutMode: "scatter" })}>
                    <span className="motif-mode-preview is-scatter"><i /><i /><i /><i /><i /><i /><i /></span>
                    <strong>Organic</strong>
                    <small>Collision-aware fill</small>
                    <b>✓</b>
                  </button>
                  <button aria-pressed={settings.layoutMode === "grid"} className={settings.layoutMode === "grid" ? "is-active" : ""} onClick={() => updateSettings({ layoutMode: "grid" })}>
                    <span className="motif-mode-preview is-grid"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
                    <strong>Grid</strong>
                    <small>Ordered array</small>
                    <b>✓</b>
                  </button>
                </div>
                {settings.layoutMode === "scatter" ? (
                  <div className="motif-arrange-choice">
                    <span>ORGANIC FILL</span>
                    <div>
                      <button className={settings.organicStrategy === "classic" ? "is-active" : ""} aria-pressed={settings.organicStrategy === "classic"} onClick={() => updateSettings({ organicStrategy: "classic" })}>
                        <strong>Classic</strong><small>First valid position</small>
                      </button>
                      <button className={settings.organicStrategy === "dense" ? "is-active" : ""} aria-pressed={settings.organicStrategy === "dense"} onClick={() => updateSettings({ organicStrategy: "dense" })}>
                        <strong>Dense</strong><small>Score candidates + fillers</small>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="motif-arrange-choice">
                      <span>GRID OFFSET</span>
                      <div className="is-three">
                        {(["none", "row", "column"] as const).map((offset) => (
                          <button key={offset} className={settings.gridOffset === offset ? "is-active" : ""} aria-pressed={settings.gridOffset === offset} onClick={() => updateSettings({ gridOffset: offset })}>
                            <strong>{offset === "none" ? "None" : offset === "row" ? "Rows ½" : "Columns ½"}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="motif-arrange-choice">
                      <span>ASSIGNMENT</span>
                      <div className="is-three">
                        {(["sequence", "alternate", "weighted"] as const).map((assignment) => (
                          <button key={assignment} className={settings.gridAssignment === assignment ? "is-active" : ""} aria-pressed={settings.gridAssignment === assignment} onClick={() => updateSettings({ gridAssignment: assignment })}>
                            <strong>{assignment[0].toUpperCase() + assignment.slice(1)}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div className={`motif-placement-feedback ${layoutResult.status === "capacity-limited" ? "is-warning" : ""}`}>
                  <span><b>{layoutResult.placedCount}</b> / {layoutResult.requestedCount} placed</span>
                  <small>{layoutResult.status === "capacity-limited"
                    ? `${layoutResult.unplacedCount} could not fit`
                    : settings.layoutMode === "scatter" ? "No forced overlaps" : `${settings.columns} column grid`}</small>
                </div>
                {layoutResult.status === "capacity-limited" && (
                  <div className="motif-capacity-warning" role="status">
                    <b>Canvas capacity reached</b>
                    <span>Reduce Density, Spacing or motif size. Existing placements remain collision-safe.</span>
                  </div>
                )}
              </div>
              <div className="motif-inspector-section">
                <div className="motif-section-heading">
                  <div>
                    <span className="motif-section-label">QUICK CONTROLS</span>
                    <strong>Shape the layout</strong>
                  </div>
                  <button onClick={shuffleSeed}>New variation ↻</button>
                </div>
                <RangeField label="Density" value={settings.targetCount} min={4} max={96} onChange={(value) => updateSettings({ targetCount: value })} />
                {settings.layoutMode === "grid" ? (
                  <RangeField label="Columns" value={settings.columns} min={2} max={12} onChange={(value) => updateSettings({ columns: value })} />
                ) : (
                  <RangeField label="Spacing" value={settings.minDistance} min={0} max={28} suffix=" px" onChange={(value) => updateSettings({ minDistance: value })} />
                )}
                <RangeField label="Size variation" value={scaleVariation} min={0} max={100} suffix="%" onChange={updateScaleVariation} />
                <RangeField label="Rotation variation" value={settings.rotation} min={0} max={180} suffix="°" onChange={(value) => updateSettings({ rotation: value })} />
              </div>
              <details className="motif-advanced-controls">
                <summary><span>Advanced controls</span><small>Engine v{settings.algorithmVersion} · Seed & scale</small></summary>
                <div>
                  <div className="motif-seed-row">
                    <label>
                      <span>Seed</span>
                      <input
                        type="number"
                        value={settings.seed}
                        onChange={(event) => updateSettings({ seed: Number(event.target.value) || 1 })}
                      />
                    </label>
                    <button onClick={shuffleSeed}>Shuffle</button>
                  </div>
                  <RangeField label="Minimum scale" value={settings.scaleMin} min={0.2} max={1.4} step={0.02} onChange={(value) => updateSettings({ scaleMin: Math.min(value, settings.scaleMax) })} />
                  <RangeField label="Maximum scale" value={settings.scaleMax} min={0.3} max={1.8} step={0.02} onChange={(value) => updateSettings({ scaleMax: Math.max(value, settings.scaleMin) })} />
                  {(settings.layoutMode === "scatter" || settings.gridAssignment === "weighted") && (
                    <div className="motif-weight-controls">
                      <span className="motif-section-label">MOTIF WEIGHTS</span>
                      <p>{settings.layoutMode === "scatter" ? "Controls organic frequency" : "Controls weighted cell assignment"}</p>
                      {arrangeInputMotifs.map((motif) => {
                        const weight = settings.motifWeights[motif.id] ?? 1;
                        return (
                          <label key={motif.id}>
                            <span>{motif.name}</span>
                            <input type="range" min="0.25" max="3" step="0.25" value={weight} onChange={(event) => updateMotifWeight(motif.id, Number(event.target.value))} />
                            <output>{weight.toFixed(2)}×</output>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </details>
            </>
          )}

          {selectedNode === "colorway" && (
            <>
              <div className="motif-inspector-section">
                <div className="motif-config-intro">
                  <span>COLOR DIRECTION</span>
                  <strong>Choose by looking, not guessing</strong>
                  <p>Each preset previews the actual motifs. You can fine-tune individual colors afterwards.</p>
                </div>
                <div className="motif-palette-list">
                  {PALETTES.map((item) => (
                    <button
                      key={item.id}
                      className={settings.paletteId === item.id ? "is-active" : ""}
                      aria-pressed={settings.paletteId === item.id}
                      onClick={() => updateSettings({ paletteId: item.id, paletteColors: null, backgroundColor: null })}
                    >
                      <PalettePreview
                        motifs={motifs.filter((motif) => project.activeIds.includes(motif.id))}
                        colors={item.colors}
                        background={item.background}
                      />
                      <span className="motif-palette-info">
                        <strong>{item.name}</strong>
                        <small>{item.colors.slice(0, 5).map((color) => <i key={color} style={{ background: color }} />)}</small>
                      </span>
                      <b>{settings.paletteId === item.id ? "✓" : ""}</b>
                    </button>
                  ))}
                </div>
              </div>

              <div className="motif-inspector-section">
                <div className="motif-section-heading">
                  <div>
                    <span className="motif-section-label">FINE TUNE</span>
                    <strong>Color mapping</strong>
                  </div>
                  {(settings.paletteColors || settings.backgroundColor) && (
                    <button onClick={() => updateSettings({ paletteColors: null, backgroundColor: null })}>Reset colors</button>
                  )}
                </div>
                <div className="motif-color-map">
                  <label>
                    <span><i style={{ background: palette.background }} />Background</span>
                    <input aria-label="Background color" type="color" value={palette.background} onChange={(event) => updateSettings({ backgroundColor: event.target.value })} />
                    <code>{palette.background.toUpperCase()}</code>
                  </label>
                  {palette.colors.slice(0, 5).map((color, index) => (
                    <label key={`${index}-${color}`}>
                      <span><i style={{ background: color }} />Color {index + 1}</span>
                      <input aria-label={`Palette color ${index + 1}`} type="color" value={color} onChange={(event) => updatePaletteColor(index, event.target.value)} />
                      <code>{color.toUpperCase()}</code>
                    </label>
                  ))}
                </div>
                <p className="motif-inline-note">Loeme motifs follow this mapping. Solid colors inside imported SVGs stay unchanged.</p>
              </div>
            </>
          )}

          {selectedNode === "output" && (
            <>
              <div className="motif-inspector-section">
                <div className="motif-config-intro">
                  <span>DELIVERY</span>
                  <strong>Package the final SVG</strong>
                  <p>Output sets the canvas size and validates the file. Edge behavior comes from the global Surface context.</p>
                </div>
                <div className="motif-surface-context">
                  <span className={`motif-output-icon ${settings.surfaceMode === "repeat" ? "is-repeat" : "is-artboard"}`}>
                    <i /><i /><i /><i />
                  </span>
                  <div>
                    <small>GLOBAL SURFACE</small>
                    <strong>{settings.surfaceMode === "repeat" ? "Seamless tile" : "Artboard"}</strong>
                    <p>{settings.surfaceMode === "repeat" ? "Arrange wraps edge collisions." : "Arrange keeps motifs inside the canvas."}</p>
                  </div>
                  <button onClick={() => updateSettings({ surfaceMode: settings.surfaceMode === "repeat" ? "artboard" : "repeat" })}>
                    Switch
                  </button>
                </div>
              </div>
              <div className="motif-inspector-section">
                <span className="motif-section-label">CANVAS SIZE</span>
                <div className="motif-size-presets">
                  <button className={settings.width === 720 && settings.height === 720 ? "is-active" : ""} onClick={() => updateSettings({ width: 720, height: 720 })}><i className="is-square" />Square</button>
                  <button className={settings.width === 720 && settings.height === 420 ? "is-active" : ""} onClick={() => updateSettings({ width: 720, height: 420 })}><i className="is-landscape" />Landscape</button>
                  <button className={settings.width === 420 && settings.height === 720 ? "is-active" : ""} onClick={() => updateSettings({ width: 420, height: 720 })}><i className="is-portrait" />Portrait</button>
                </div>
                <div className="motif-size-grid">
                  <label><span>Width</span><input type="number" min="240" max="1600" value={settings.width} onChange={(event) => updateSettings({ width: Math.max(240, Number(event.target.value)) })} /></label>
                  <label><span>Height</span><input type="number" min="180" max="1200" value={settings.height} onChange={(event) => updateSettings({ height: Math.max(180, Number(event.target.value)) })} /></label>
                </div>
                <button className={`motif-boundary-toggle ${settings.showBoundary ? "is-active" : ""}`} role="switch" aria-checked={settings.showBoundary} onClick={() => updateSettings({ showBoundary: !settings.showBoundary })}>
                  <span><i />Show tile boundary</span><b>{settings.showBoundary ? "On" : "Off"}</b>
                </button>
              </div>
              {settings.surfaceMode === "repeat" && (
                <div className="motif-repeat-note">
                  <span>Square repeat</span>
                  <strong>Edges wrapped</strong>
                  <p>Crossing motifs are copied to opposite edges and corners before export.</p>
                </div>
              )}
              <div className="motif-inspector-section">
                <span className="motif-section-label">SVG READY CHECK</span>
                <div className="motif-export-checks">
                  <span><i>✓</i>Vector paths preserved</span>
                  <span><i>✓</i>No embedded raster images</span>
                  <span><i>✓</i>{settings.surfaceMode === "repeat" ? "Wrapped edge copies included" : "Artboard clipping applied"}</span>
                </div>
              </div>
            </>
          )}
          </div>

          <div className="motif-inspector-footer">
            <div>
              <span>Ready</span>
              <small>{nodeContracts[selectedNode].summary}</small>
            </div>
            {selectedNode === "output" ? (
              <button onClick={downloadSvg}>Export SVG <span>↗</span></button>
            ) : (
              <button onClick={() => setViewedNode("output")}>View final output <span>↗</span></button>
            )}
          </div>
        </aside>
      </section>

      {notice && <div className="motif-toast" role="status">{notice}</div>}
      <div className="motif-mobile-note">Loeme Motif MVP currently works best on a desktop-sized screen.</div>
    </main>
  );
}
