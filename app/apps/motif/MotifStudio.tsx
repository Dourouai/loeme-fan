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
  Motif,
  PALETTES,
  PatternInstance,
  STARTER_MOTIFS,
  StudioSettings,
  buildInstances,
  exportFlattenedSvg,
  importSvgFile,
  withWrapCopies,
} from "./motif-engine";
import "./motif.css";

type ProjectState = {
  name: string;
  activeIds: string[];
  importedMotifs: Motif[];
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

const STORAGE_KEY = "loeme-motif-mvp-v1";

const initialProject: ProjectState = {
  name: "Coastal Bloom",
  activeIds: ["bloom", "leaf", "sprig", "berries", "petal", "daisy"],
  importedMotifs: [],
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
  offsetX = 0,
  offsetY = 0,
}: {
  motif: Motif;
  instance: PatternInstance;
  offsetX?: number;
  offsetY?: number;
}) {
  const transform = `translate(${instance.x + offsetX} ${instance.y + offsetY}) rotate(${instance.rotation}) scale(${instance.scale}) translate(-50 -50)`;
  return (
    <g
      transform={transform}
      color={instance.color}
      dangerouslySetInnerHTML={{ __html: motif.body }}
    />
  );
}

function MiniMotif({ motif, color = "#7c58e8" }: { motif: Motif; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <g color={color} dangerouslySetInnerHTML={{ __html: motif.body }} />
    </svg>
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
  const [selectedNode, setSelectedNode] = useState<"input" | "arrange" | "colorway" | "output">("arrange");
  const [notice, setNotice] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const project = history.present;
  const settings = project.settings;

  const motifs = useMemo(
    () => [...STARTER_MOTIFS, ...project.importedMotifs],
    [project.importedMotifs],
  );
  const motifMap = useMemo(() => new Map(motifs.map((motif) => [motif.id, motif])), [motifs]);
  const instances = useMemo(
    () => buildInstances(motifs, project.activeIds, settings),
    [motifs, project.activeIds, settings],
  );
  const displayedInstances = useMemo(
    () => settings.outputMode === "repeat"
      ? withWrapCopies(instances, settings.width, settings.height)
      : instances,
    [instances, settings.outputMode, settings.width, settings.height],
  );
  const palette = PALETTES.find((item) => item.id === settings.paletteId) ?? PALETTES[0];

  useEffect(() => {
    if (startFresh) {
      window.localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: "load", next: initialProject });
      const freshTimer = window.setTimeout(() => setHydrated(true), 0);
      return () => window.clearTimeout(freshTimer);
    }
    let loadNotice = "";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ProjectState;
        if (parsed?.settings && Array.isArray(parsed.activeIds)) {
          dispatch({
            type: "load",
            next: {
              ...initialProject,
              ...parsed,
              settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
              importedMotifs: Array.isArray(parsed.importedMotifs) ? parsed.importedMotifs : [],
            },
          });
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

  function toggleMotif(motif: Motif) {
    const isActive = project.activeIds.includes(motif.id);
    const nextIds = isActive
      ? project.activeIds.filter((id) => id !== motif.id)
      : [...project.activeIds, motif.id];
    if (!nextIds.length) {
      setNotice("至少保留一个 Motif 参与布局。");
      return;
    }
    commit({ ...project, activeIds: nextIds });
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

  function downloadSvg() {
    if (!instances.length) {
      setNotice("当前没有可导出的图形。");
      return;
    }
    const svg = exportFlattenedSvg(motifs, instances, settings);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "loeme-motif"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${settings.outputMode === "repeat" ? "Repeat" : "Artboard"} SVG 已导出。`);
  }

  function resetProject() {
    if (!window.confirm("重置当前项目？本地修改和导入素材都会被清除。")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "load", next: initialProject });
    setNotice("项目已重置。");
  }

  const visibleLibrary = libraryMode === "starter" ? STARTER_MOTIFS : project.importedMotifs;
  const tiles = settings.outputMode === "repeat" ? 3 : 1;
  const canvasWidth = settings.width * tiles;
  const canvasHeight = settings.height * tiles;
  const tileEntries = Array.from({ length: tiles * tiles }, (_, index) => ({
    x: (index % tiles) * settings.width,
    y: Math.floor(index / tiles) * settings.height,
    id: index,
  }));

  return (
    <main className="motif-app">
      <header className="motif-topbar">
        <div className="motif-brand" aria-label="Loeme Motif">
          <span className="motif-brand-mark">LM</span>
          <span>Loeme</span>
          <span className="motif-brand-divider">/</span>
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
          <button onClick={() => updateSettings({ outputMode: settings.outputMode === "repeat" ? "artboard" : "repeat" })}>
            {settings.outputMode === "repeat" ? "Repeat" : "Artboard"}
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
          <button className="motif-export-top" onClick={downloadSvg}>Export SVG <span>↗</span></button>
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
                  title={`${active ? "Remove" : "Add"} ${motif.name}`}
                >
                  <span className="motif-card-preview">
                    <MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} />
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
                <span className="motif-eyebrow">FINAL OUTPUT</span>
                <h1>{settings.outputMode === "repeat" ? "Seamless Preview" : "Artboard Preview"}</h1>
              </div>
              <div className="motif-canvas-status">
                <span className="motif-live-dot" /> Live
                <button onClick={() => updateSettings({ showBoundary: !settings.showBoundary })}>
                  {settings.showBoundary ? "Hide grid" : "Show grid"}
                </button>
              </div>
            </div>

            <div className="motif-canvas-stage" style={{ background: palette.background }}>
              <svg
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                role="img"
                aria-label={`${settings.outputMode} preview with ${instances.length} vector instances`}
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
                        return motif ? <MotifGlyph key={`${tile.id}-${instance.id}`} motif={motif} instance={instance} /> : null;
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
                        strokeOpacity={settings.outputMode === "repeat" ? 0.2 : 0.42}
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                ))}
              </svg>

              <div className="motif-canvas-toolbar">
                <span>{settings.outputMode === "repeat" ? "3 × 3" : "1 × 1"}</span>
                <span>{settings.width} × {settings.height}</span>
                <span>{instances.length} instances</span>
              </div>
            </div>
          </div>

          <div className="motif-recipe-panel motif-panel">
            <div className="motif-recipe-heading">
              <div>
                <span className="motif-eyebrow">RECIPE</span>
                <h2>Vector flow</h2>
              </div>
              <span>Fixed for MVP · no broken connections</span>
            </div>
            <div className="motif-recipe-flow">
              {([
                ["input", "01", "Input", `${project.activeIds.length} motifs`],
                ["arrange", "02", "Arrange", settings.layoutMode === "scatter" ? "Scatter" : "Grid"],
                ["colorway", "03", "Colorway", palette.name],
                ["output", "04", "Output", settings.outputMode === "repeat" ? "Square repeat" : "Artboard"],
              ] as const).map((node, index) => (
                <div className="motif-node-wrap" key={node[0]}>
                  <button
                    className={`motif-node-card ${selectedNode === node[0] ? "is-selected" : ""}`}
                    onClick={() => setSelectedNode(node[0])}
                  >
                    <span>{node[1]}</span>
                    <strong>{node[2]}</strong>
                    <small>{node[3]}</small>
                    <i />
                  </button>
                  {index < 3 && <span className="motif-node-link" aria-hidden="true">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="motif-inspector motif-panel">
          <div className="motif-inspector-title">
            <div>
              <span className="motif-node-status" />
              <span className="motif-eyebrow">{selectedNode.toUpperCase()}</span>
              <h2>{selectedNode === "input" ? "Input set" : selectedNode === "arrange" ? "Arrange" : selectedNode === "colorway" ? "Colorway" : "Output"}</h2>
            </div>
            <button className="motif-icon-button" aria-label="Reset project" title="Reset project" onClick={resetProject}>⋯</button>
          </div>

          {selectedNode === "input" && (
            <div className="motif-inspector-section">
              <p className="motif-section-copy">Choose Starter motifs or import a simple SVG. Active motifs flow into Arrange as one set.</p>
              <div className="motif-active-stack">
                {project.activeIds.slice(0, 8).map((id, index) => {
                  const motif = motifMap.get(id);
                  return motif ? (
                    <div key={id}>
                      <MiniMotif motif={motif} color={palette.colors[index % palette.colors.length]} />
                      <span>{motif.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
              <button className="motif-primary-light" onClick={() => fileInputRef.current?.click()}>＋ Add SVG motif</button>
            </div>
          )}

          {selectedNode === "arrange" && (
            <>
              <div className="motif-inspector-section">
                <span className="motif-section-label">Layout</span>
                <div className="motif-segmented">
                  <button className={settings.layoutMode === "scatter" ? "is-active" : ""} onClick={() => updateSettings({ layoutMode: "scatter" })}>Scatter</button>
                  <button className={settings.layoutMode === "grid" ? "is-active" : ""} onClick={() => updateSettings({ layoutMode: "grid" })}>Grid</button>
                </div>
              </div>
              <div className="motif-inspector-section">
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
                <RangeField label="Count" value={settings.targetCount} min={4} max={96} onChange={(value) => updateSettings({ targetCount: value })} />
                {settings.layoutMode === "grid" ? (
                  <RangeField label="Columns" value={settings.columns} min={2} max={12} onChange={(value) => updateSettings({ columns: value })} />
                ) : (
                  <RangeField label="Min distance" value={settings.minDistance} min={0} max={28} suffix=" px" onChange={(value) => updateSettings({ minDistance: value })} />
                )}
                <RangeField label="Min scale" value={settings.scaleMin} min={0.2} max={1.4} step={0.02} onChange={(value) => updateSettings({ scaleMin: Math.min(value, settings.scaleMax) })} />
                <RangeField label="Max scale" value={settings.scaleMax} min={0.3} max={1.8} step={0.02} onChange={(value) => updateSettings({ scaleMax: Math.max(value, settings.scaleMin) })} />
                <RangeField label="Rotation" value={settings.rotation} min={0} max={180} suffix="°" onChange={(value) => updateSettings({ rotation: value })} />
              </div>
            </>
          )}

          {selectedNode === "colorway" && (
            <div className="motif-inspector-section">
              <p className="motif-section-copy">Colorways recolor Loeme Starter motifs. Imported SVG solid colors are preserved.</p>
              <div className="motif-palette-list">
                {PALETTES.map((item) => (
                  <button
                    key={item.id}
                    className={settings.paletteId === item.id ? "is-active" : ""}
                    onClick={() => updateSettings({ paletteId: item.id })}
                  >
                    <span className="motif-palette-swatches" style={{ background: item.background }}>
                      {item.colors.slice(0, 4).map((color) => <i key={color} style={{ background: color }} />)}
                    </span>
                    <span>{item.name}</span>
                    <b>{settings.paletteId === item.id ? "✓" : ""}</b>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedNode === "output" && (
            <>
              <div className="motif-inspector-section">
                <span className="motif-section-label">Output mode</span>
                <div className="motif-segmented">
                  <button className={settings.outputMode === "artboard" ? "is-active" : ""} onClick={() => updateSettings({ outputMode: "artboard" })}>Artboard</button>
                  <button className={settings.outputMode === "repeat" ? "is-active" : ""} onClick={() => updateSettings({ outputMode: "repeat" })}>Repeat</button>
                </div>
              </div>
              <div className="motif-inspector-section motif-size-grid">
                <label><span>Width</span><input type="number" min="240" max="1600" value={settings.width} onChange={(event) => updateSettings({ width: Math.max(240, Number(event.target.value)) })} /></label>
                <label><span>Height</span><input type="number" min="180" max="1200" value={settings.height} onChange={(event) => updateSettings({ height: Math.max(180, Number(event.target.value)) })} /></label>
              </div>
              {settings.outputMode === "repeat" && (
                <div className="motif-repeat-note">
                  <span>Square repeat</span>
                  <strong>Edges wrapped</strong>
                  <p>Crossing motifs are copied to opposite edges and corners before export.</p>
                </div>
              )}
            </>
          )}

          <div className="motif-inspector-footer">
            <div>
              <span>{instances.length}</span>
              <small>instances ready</small>
            </div>
            <button onClick={downloadSvg}>Export flattened SVG <span>↗</span></button>
          </div>
        </aside>
      </section>

      {notice && <div className="motif-toast" role="status">{notice}</div>}
      <div className="motif-mobile-note">Loeme Motif MVP currently works best on a desktop-sized screen.</div>
    </main>
  );
}
