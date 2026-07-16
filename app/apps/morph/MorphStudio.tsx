"use client";

import Image from "next/image";
import Link from "next/link";
import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildMorphFilename,
  buildMorphSvg,
  halfToFloat,
} from "./morph-vector-engine";
import { MorphGpuEngine } from "./morph-gpu";
import type {
  BrushMode,
  Colorway,
  FrozenVersion,
  GrowthSettings,
  MorphMode,
  PresetId,
  ShapeSettings,
  VectorWorkerResponse,
  VectorizeResult,
} from "./morph-types";
import "./morph.css";

type RuntimeStatus =
  | "initializing"
  | "growing"
  | "freezing"
  | "frozen"
  | "vectorizing"
  | "ready"
  | "error";

type ShapeHistory = {
  past: ShapeSettings[];
  future: ShapeSettings[];
};

const PRESETS: Array<{
  id: PresetId;
  name: string;
  description: string;
  seed: number;
  defaults: GrowthSettings;
}> = [
  {
    id: "cells",
    name: "Cells",
    description: "Dividing spots",
    seed: 284,
    defaults: { speed: 50, form: 25, featureSize: 45, brushSize: 6 },
  },
  {
    id: "coral",
    name: "Coral",
    description: "Connected chambers",
    seed: 731,
    defaults: { speed: 50, form: 55, featureSize: 60, brushSize: 6 },
  },
  {
    id: "maze",
    name: "Maze",
    description: "Continuous paths",
    seed: 119,
    defaults: { speed: 50, form: 85, featureSize: 50, brushSize: 6 },
  },
  {
    id: "worms",
    name: "Worms",
    description: "Moving strands",
    seed: 902,
    defaults: { speed: 50, form: 65, featureSize: 35, brushSize: 6 },
  },
];

const COLORWAYS: Colorway[] = [
  { id: "bio", name: "Bio", foreground: "#c8f45d", background: "#12211b" },
  { id: "coral", name: "Coral", foreground: "#ff715b", background: "#f2efe7" },
  { id: "water", name: "Water", foreground: "#74b7c9", background: "#102329" },
  { id: "ink", name: "Ink", foreground: "#17201c", background: "#fbfaf6" },
];

const DEFAULT_SHAPE: ShapeSettings = {
  fillLevel: 50,
  edgeSmoothing: 20,
  pathDetail: 75,
  removeSmallShapes: 0,
  invertFill: false,
};

const runtimeLabels: Record<RuntimeStatus, string> = {
  initializing: "Preparing",
  growing: "Growing",
  freezing: "Freezing",
  frozen: "Frozen",
  vectorizing: "Building paths",
  ready: "Vector ready",
  error: "Needs attention",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createVersionIdentity() {
  const createdAt = Date.now();
  const suffix = globalThis.crypto?.randomUUID?.()
    ?? Math.random().toString(36).slice(2, 12);
  return { id: `morph-${createdAt}-${suffix}`, createdAt };
}

function createRandomSeed() {
  const values = new Uint32Array(1);
  globalThis.crypto?.getRandomValues?.(values);
  return (values[0] & 0x7fffffff)
    || Math.floor(Math.random() * 2_147_483_647)
    || 1;
}

function toRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function createThumbnail(
  data: Uint16Array,
  width: number,
  height: number,
  colorway: Colorway,
) {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const image = context.createImageData(size, size);
  const foreground = toRgb(colorway.foreground);
  const background = toRgb(colorway.background);

  for (let y = 0; y < size; y += 1) {
    const sourceY = Math.min(height - 1, Math.floor((y / size) * height));
    for (let x = 0; x < size; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor((x / size) * width));
      const sourceIndex = (sourceY * width + sourceX) * 4 + 1;
      const value = clamp((halfToFloat(data[sourceIndex]) - 0.015) * 3.2, 0, 1);
      const targetIndex = (y * size + x) * 4;
      image.data[targetIndex] = Math.round(background.r + (foreground.r - background.r) * value);
      image.data[targetIndex + 1] = Math.round(background.g + (foreground.g - background.g) * value);
      image.data[targetIndex + 2] = Math.round(background.b + (foreground.b - background.b) * value);
      image.data[targetIndex + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function RangeField({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  output,
  startLabel,
  endLabel,
  onBegin,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  output: string;
  startLabel: string;
  endLabel: string;
  onBegin?: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <label className="morph-field">
      <span className="morph-field-head">
        <span>{label}</span>
        <output>{output}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={output}
        onPointerDown={onBegin}
        onKeyDown={onBegin}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="morph-range-ends"><span>{startLabel}</span><span>{endLabel}</span></span>
    </label>
  );
}

export default function MorphStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MorphGpuEngine | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number>(0);
  const runtimeRef = useRef<RuntimeStatus>("initializing");
  const modeRef = useRef<MorphMode>("grow");
  const colorwayRef = useRef<Colorway>(COLORWAYS[0]);
  const drawingRef = useRef(false);
  const reducedMotionGateRef = useRef(false);
  const generationRef = useRef(0);
  const shapeHistoryRef = useRef<ShapeHistory>({ past: [], future: [] });

  const [mode, setMode] = useState<MorphMode>("grow");
  const [runtime, setRuntime] = useState<RuntimeStatus>("initializing");
  const [projectName, setProjectName] = useState("Untitled Morph");
  const [presetId, setPresetId] = useState<PresetId>("cells");
  const [seed, setSeed] = useState(PRESETS[0].seed);
  const [growth, setGrowth] = useState<GrowthSettings>(PRESETS[0].defaults);
  const [shape, setShape] = useState<ShapeSettings>(DEFAULT_SHAPE);
  const [brushMode, setBrushMode] = useState<BrushMode>("add");
  const [colorway, setColorway] = useState<Colorway>(COLORWAYS[0]);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [versions, setVersions] = useState<FrozenVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [vectorResult, setVectorResult] = useState<VectorizeResult | null>(null);
  const [vectorUpdating, setVectorUpdating] = useState(false);
  const [gpuIssue, setGpuIssue] = useState("");
  const [notice, setNotice] = useState("");
  const [historyAvailability, setHistoryAvailability] = useState({ canUndo: false, canRedo: false });
  const [iteration, setIteration] = useState(0);
  const [fps, setFps] = useState(0);
  const [compactDismissed, setCompactDismissed] = useState(false);
  const [cursor, setCursor] = useState({ x: 50, y: 50, visible: false });

  const currentPreset = PRESETS.find((item) => item.id === presetId) ?? PRESETS[0];
  const activeVersion = versions.find((item) => item.id === activeVersionId) ?? null;

  useEffect(() => { runtimeRef.current = runtime; }, [runtime]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { colorwayRef.current = colorway; }, [colorway]);

  const setRuntimeState = useCallback((next: RuntimeStatus) => {
    runtimeRef.current = next;
    setRuntime(next);
  }, []);

  const setModeState = useCallback((next: MorphMode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement = canvas;
    let cancelled = false;
    let frameCount = 0;
    let lastFpsAt = performance.now();

    const engine = new MorphGpuEngine();
    engineRef.current = engine;

    async function prepare() {
      try {
        await engine.init(canvasElement);
        await engine.reset("cells", PRESETS[0].seed, PRESETS[0].defaults, true);
        if (cancelled) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        reducedMotionGateRef.current = reduceMotion;
        if (reduceMotion) {
          const start = performance.now();
          for (let index = 0; index < 50; index += 1) {
            engine.frame(start + index * 20, true, COLORWAYS[0]);
          }
          setRuntimeState("frozen");
        } else {
          setRuntimeState("growing");
        }

        const render = (now: number) => {
          if (cancelled) return;
          const rendered = engine.frame(now, runtimeRef.current === "growing", colorwayRef.current);
          if (rendered) frameCount += 1;
          if (now - lastFpsAt >= 700) {
            setFps(Math.round((frameCount * 1000) / (now - lastFpsAt)));
            setIteration(engine.iteration);
            frameCount = 0;
            lastFpsAt = now;
          }
          if (engine.deviceLostMessage) {
            setGpuIssue(engine.deviceLostMessage);
            setRuntimeState("error");
          }
          animationRef.current = requestAnimationFrame(render);
        };
        animationRef.current = requestAnimationFrame(render);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "WebGPU could not be initialized.";
        setGpuIssue(message);
        setRuntimeState("error");
      }
    }

    prepare();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationRef.current);
      engine.dispose();
      engineRef.current = null;
    };
  }, [setRuntimeState]);

  useEffect(() => {
    const worker = new Worker(new URL("./morph-vector-worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<VectorWorkerResponse>) => {
      const response = event.data;
      if (response.type === "result") {
        if (response.generationId !== generationRef.current) return;
        setVectorResult(response);
        setVectorUpdating(false);
        if (modeRef.current !== "grow") setRuntimeState("ready");
      } else if (response.type === "error") {
        if (response.generationId !== generationRef.current) return;
        setVectorUpdating(false);
        setRuntimeState("frozen");
        setNotice(response.message || "We couldn’t build paths from this snapshot.");
      }
    };
    worker.onerror = () => {
      setVectorUpdating(false);
      setRuntimeState("frozen");
      setNotice("We couldn’t build paths from this snapshot.");
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [setRuntimeState]);

  useEffect(() => {
    if (!activeVersion || mode === "grow" || !workerRef.current) return;
    setVectorUpdating(true);
    setRuntimeState("vectorizing");
    const generationId = generationRef.current + 1;
    generationRef.current = generationId;
    const timer = window.setTimeout(() => {
      workerRef.current?.postMessage({
        type: "vectorize",
        snapshotId: activeVersion.id,
        generationId,
        settings: shape,
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeVersion, mode, shape, setRuntimeState]);

  const { canUndo, canRedo } = historyAvailability;

  const svgText = useMemo(() => {
    if (!vectorResult) return "";
    return buildMorphSvg(vectorResult, {
      foreground: colorway.foreground,
      background: colorway.background,
      includeBackground,
      title: projectName.trim() || "Untitled Morph",
      metadata: `Generated by Loeme Morph · ${currentPreset.name}`,
    });
  }, [colorway, currentPreset.name, includeBackground, projectName, vectorResult]);

  const svgBytes = useMemo(
    () => (svgText ? new TextEncoder().encode(svgText).byteLength : 0),
    [svgText],
  );

  function postSnapshot(version: FrozenVersion) {
    const cloned = version.data.slice().buffer;
    workerRef.current?.postMessage({
      type: "cache",
      snapshotId: version.id,
      width: version.width,
      height: version.height,
      data: cloned,
    }, [cloned]);
  }

  function bumpHistory() {
    if (modeRef.current === "grow") {
      setHistoryAvailability({
        canUndo: Boolean(engineRef.current?.canUndo),
        canRedo: Boolean(engineRef.current?.canRedo),
      });
      return;
    }
    setHistoryAvailability({
      canUndo: shapeHistoryRef.current.past.length > 0,
      canRedo: shapeHistoryRef.current.future.length > 0,
    });
  }

  function beginGrowthAction() {
    engineRef.current?.createCheckpoint();
    bumpHistory();
  }

  function updateGrowth(patch: Partial<GrowthSettings>) {
    const next = { ...growth, ...patch };
    setGrowth(next);
    engineRef.current?.setSettings(next);
  }

  function updateShape(patch: Partial<ShapeSettings>) {
    const next = { ...shape, ...patch };
    shapeHistoryRef.current.past = [...shapeHistoryRef.current.past.slice(-19), shape];
    shapeHistoryRef.current.future = [];
    setShape(next);
    setVersions((items) => items.map((item) => (
      item.id === activeVersionId ? { ...item, shapeSettings: next } : item
    )));
    bumpHistory();
  }

  async function moveHistory(direction: "undo" | "redo") {
    if (mode === "grow") {
      const engine = engineRef.current;
      if (!engine) return;
      const moved = direction === "undo" ? await engine.undo() : await engine.redo();
      if (moved) {
        setGrowth({ ...engine.settings });
        setPresetId(engine.presetId);
        setSeed(engine.seed);
        setIteration(engine.iteration);
      }
    } else {
      const history = shapeHistoryRef.current;
      if (direction === "undo") {
        const previous = history.past.at(-1);
        if (!previous) return;
        history.past = history.past.slice(0, -1);
        history.future = [shape, ...history.future].slice(0, 20);
        setShape(previous);
      } else {
        const next = history.future[0];
        if (!next) return;
        history.future = history.future.slice(1);
        history.past = [...history.past.slice(-19), shape];
        setShape(next);
      }
    }
    bumpHistory();
  }

  async function choosePreset(id: PresetId) {
    if (runtime === "initializing" || runtime === "freezing" || runtime === "error") return;
    const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0];
    const engine = engineRef.current;
    if (!engine) return;
    engine.createCheckpoint();
    await engine.reset(id, preset.seed, preset.defaults);
    setPresetId(id);
    setSeed(preset.seed);
    setGrowth(preset.defaults);
    setActiveVersionId(null);
    setVectorResult(null);
    setIteration(0);
    setModeState("grow");
    setRuntimeState(reducedMotionGateRef.current ? "frozen" : "growing");
    setNotice(`Switched to ${preset.name}.`);
    bumpHistory();
  }

  async function shufflePattern() {
    if (runtime === "initializing" || runtime === "freezing" || runtime === "error") return;
    const engine = engineRef.current;
    if (!engine) return;
    const nextSeed = createRandomSeed();
    engine.createCheckpoint();
    await engine.reset(presetId, nextSeed, growth);
    setSeed(nextSeed);
    setActiveVersionId(null);
    setVectorResult(null);
    setIteration(0);
    setModeState("grow");
    setRuntimeState(reducedMotionGateRef.current ? "frozen" : "growing");
    setNotice("A new seed is growing.");
    bumpHistory();
  }

  async function restartPattern() {
    if (runtime === "initializing" || runtime === "freezing" || runtime === "error") return;
    const engine = engineRef.current;
    if (!engine) return;
    engine.createCheckpoint();
    await engine.reset(presetId, currentPreset.seed, growth);
    setSeed(currentPreset.seed);
    setActiveVersionId(null);
    setVectorResult(null);
    setIteration(0);
    setModeState("grow");
    setRuntimeState(reducedMotionGateRef.current ? "frozen" : "growing");
    setNotice("Pattern restarted from its original seed.");
    bumpHistory();
  }

  async function freezeAndShape() {
    const engine = engineRef.current;
    if (!engine || runtime === "freezing" || runtime === "initializing") return;
    setRuntimeState("freezing");
    try {
      const snapshot = await engine.freeze();
      const identity = createVersionIdentity();
      const version: FrozenVersion = {
        id: identity.id,
        createdAt: identity.createdAt,
        presetId,
        seed,
        width: snapshot.width,
        height: snapshot.height,
        iteration: snapshot.iteration,
        data: snapshot.data,
        thumbnail: createThumbnail(snapshot.data, snapshot.width, snapshot.height, colorway),
        growthSettings: { ...growth },
        shapeSettings: { ...shape },
      };
      postSnapshot(version);
      setVersions((items) => [version, ...items].slice(0, 3));
      setActiveVersionId(identity.id);
      setIteration(snapshot.iteration);
      setVectorResult(null);
      shapeHistoryRef.current = { past: [], future: [] };
      setModeState("shape");
      setRuntimeState("vectorizing");
      setNotice("Growth frozen. Shape controls are now live.");
      bumpHistory();
    } catch (error) {
      if (engine.status === "lost" || engine.status === "error") {
        setGpuIssue(engine.errorMessage ?? "The graphics device could not create a snapshot.");
        setRuntimeState("error");
      } else {
        setRuntimeState("growing");
      }
      setNotice(error instanceof Error ? error.message : "Couldn’t create a snapshot.");
    }
  }

  async function selectVersion(version: FrozenVersion) {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.restore(
      {
        width: version.width,
        height: version.height,
        iteration: version.iteration,
        data: version.data,
      },
      {
        presetId: version.presetId,
        seed: version.seed,
        settings: version.growthSettings,
      },
    );
    postSnapshot(version);
    setPresetId(version.presetId);
    setSeed(version.seed);
    setGrowth({ ...version.growthSettings });
    setShape({ ...version.shapeSettings });
    setActiveVersionId(version.id);
    setVectorResult(null);
    setIteration(version.iteration);
    shapeHistoryRef.current = { past: [], future: [] };
    setModeState("shape");
    setRuntimeState("vectorizing");
    bumpHistory();
  }

  async function resumeGrowth() {
    const engine = engineRef.current;
    if (!engine) return;
    if (activeVersion) {
      await engine.restore(
        {
          width: activeVersion.width,
          height: activeVersion.height,
          iteration: activeVersion.iteration,
          data: activeVersion.data,
        },
        {
          presetId: activeVersion.presetId,
          seed: activeVersion.seed,
          settings: activeVersion.growthSettings,
        },
      );
      setGrowth({ ...activeVersion.growthSettings });
      setPresetId(activeVersion.presetId);
      setSeed(activeVersion.seed);
      setIteration(activeVersion.iteration);
    }
    reducedMotionGateRef.current = false;
    setModeState("grow");
    setRuntimeState("growing");
    bumpHistory();
  }

  async function changeMode(next: MorphMode) {
    if (next === mode) return;
    if (next === "shape") {
      if (runtime === "growing") await freezeAndShape();
      else if (activeVersion) {
        setModeState("shape");
        setRuntimeState(vectorResult ? "ready" : "vectorizing");
      }
      return;
    }
    if (next === "export") {
      if (!vectorResult || vectorUpdating) return;
      setModeState("export");
      setRuntimeState("ready");
      return;
    }
    setModeState("grow");
    if (runtime !== "growing") setRuntimeState("frozen");
  }

  function downloadSvg() {
    if (!svgText || !vectorResult) return;
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildMorphFilename(presetId);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setNotice("SVG downloaded. Your frozen version is still here.");
  }

  function sampleFromPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    setCursor({ x: x * 100, y: y * 100, visible: true });
    return { x, y, radius: growth.brushSize / 200, mode: brushMode };
  }

  function beginStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (mode !== "grow" || runtime !== "growing") return;
    const engine = engineRef.current;
    if (!engine) return;
    engine.createCheckpoint();
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    engine.enqueueStroke(sampleFromPointer(event));
    bumpHistory();
  }

  function moveStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    const sample = sampleFromPointer(event);
    if (drawingRef.current && runtime === "growing") engineRef.current?.enqueueStroke(sample);
  }

  function endStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    engineRef.current?.endStroke();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        moveHistory(event.shiftKey ? "redo" : "undo");
        return;
      }
      if (event.key.toLowerCase() === "b") setBrushMode("add");
      if (event.key.toLowerCase() === "e") setBrushMode("erase");
      if (event.key === "[") updateGrowth({ brushSize: clamp(growth.brushSize - 1, 1, 20) });
      if (event.key === "]") updateGrowth({ brushSize: clamp(growth.brushSize + 1, 1, 20) });
      if (event.key.toLowerCase() === "f") {
        if (runtime === "growing") freezeAndShape();
        else resumeGrowth();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function primaryAction() {
    if (mode === "grow") {
      if (runtime === "growing") freezeAndShape();
      else resumeGrowth();
    } else if (mode === "shape") {
      changeMode("export");
    } else {
      downloadSvg();
    }
  }

  const primaryLabel = mode === "grow"
    ? (runtime === "frozen" ? "Start Growth" : runtime === "freezing" ? "Creating snapshot…" : "Freeze & Shape")
    : mode === "shape"
      ? (vectorUpdating ? "Building paths…" : "Review Export")
      : "Download SVG";

  const statusClass = runtime === "error" ? "is-error" : runtime === "frozen" || runtime === "ready" ? "is-frozen" : "";
  const canvasTitle = mode === "grow" ? `${currentPreset.name} growth` : mode === "shape" ? "Filled shape" : "Export preview";
  const gpuControlsDisabled = runtime === "initializing" || runtime === "freezing" || runtime === "error";

  return (
    <main className="morph-app">
      <header className="morph-topbar">
        <div className="morph-brand-row">
          <div className="morph-brand" aria-label="Morph application">
            <Image src="/brand/morph-app-icon.svg" alt="" width={22} height={22} priority />
            <strong>Morph</strong>
          </div>
          <div className="morph-project">
            <Link className="morph-back" href="/products" aria-label="Back to Loeme products">←</Link>
            <input aria-label="Project name" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          </div>
        </div>

        <nav className="morph-mode-tabs" aria-label="Morph workspace modes">
          {(["grow", "shape", "export"] as MorphMode[]).map((item) => (
            <button
              key={item}
              className={mode === item ? "is-active" : ""}
              disabled={runtime === "initializing" || runtime === "error" || (item === "export" && (!vectorResult || vectorUpdating))}
              aria-pressed={mode === item}
              onClick={() => changeMode(item)}
            >{item[0].toUpperCase() + item.slice(1)}</button>
          ))}
        </nav>

        <div className="morph-top-actions">
          <span className={`morph-status ${statusClass}`} aria-live="polite"><i />{runtimeLabels[runtime]}</span>
          <button className="morph-icon-button" aria-label="Undo" disabled={!canUndo} onClick={() => moveHistory("undo")}>↶</button>
          <button className="morph-icon-button" aria-label="Redo" disabled={!canRedo} onClick={() => moveHistory("redo")}>↷</button>
          {mode === "shape" && <button className="morph-secondary-button" onClick={resumeGrowth}>Resume growth</button>}
          <button
            className="morph-primary-button"
            disabled={runtime === "initializing" || runtime === "error" || runtime === "freezing" || (mode !== "grow" && (!vectorResult || vectorUpdating))}
            onClick={primaryAction}
          >{primaryLabel}<span>↗</span></button>
        </div>
      </header>

      <section className="morph-workspace">
        <aside className="morph-left morph-panel">
          {mode === "grow" ? (
            <>
              <section className="morph-panel-section">
                <div className="morph-panel-heading"><div><span className="morph-eyebrow">GROWTH MODEL</span><h2>Presets</h2></div></div>
                <div className="morph-presets">
                  {PRESETS.map((preset) => (
                    <button key={preset.id} className={`morph-preset ${presetId === preset.id ? "is-active" : ""}`} disabled={gpuControlsDisabled} aria-pressed={presetId === preset.id} onClick={() => choosePreset(preset.id)}>
                      <span className={`morph-preset-preview is-${preset.id}`} />
                      <strong>{preset.name}</strong><i>✓</i>
                    </button>
                  ))}
                </div>
              </section>
              <section className="morph-panel-section">
                <span className="morph-eyebrow">TOOLS</span>
                <div className="morph-tool-row">
                  <button className={brushMode === "add" ? "is-active" : ""} aria-pressed={brushMode === "add"} onClick={() => setBrushMode("add")}><b>＋</b>Add Seed</button>
                  <button className={brushMode === "erase" ? "is-active" : ""} aria-pressed={brushMode === "erase"} onClick={() => setBrushMode("erase")}><b>○</b>Erase</button>
                </div>
                <RangeField label="Brush size" value={growth.brushSize} min={1} max={20} output={`${growth.brushSize}%`} startLabel="Fine" endLabel="Broad" onBegin={beginGrowthAction} onChange={(value) => updateGrowth({ brushSize: value })} />
              </section>
              <section className="morph-panel-section">
                <span className="morph-eyebrow">PATTERN ACTIONS</span>
                <div className="morph-action-list">
                  <button disabled={gpuControlsDisabled} onClick={shufflePattern}><span>Shuffle seed</span><span>↝</span></button>
                  <button disabled={gpuControlsDisabled} onClick={restartPattern}><span>Restart pattern</span><span>↺</span></button>
                </div>
              </section>
            </>
          ) : (
            <section className="morph-panel-section">
              <div className="morph-panel-heading"><div><span className="morph-eyebrow">OUTPUT TYPE</span><h2>Shape</h2></div></div>
              <div className="morph-output-types">
                <button className="is-active"><strong>Filled Shape</strong><small>Closed vector paths with editable color</small></button>
                <button disabled><strong>Contour Lines</strong><small>Planned after prototype validation</small></button>
              </div>
            </section>
          )}

          <section className="morph-panel-section morph-versions">
            <div className="morph-panel-heading"><div><span className="morph-eyebrow">SESSION</span><h2>Frozen Versions</h2></div><span className="morph-eyebrow">{versions.length}/3</span></div>
            {versions.length ? (
              <div className="morph-version-list">
                {versions.map((version, index) => (
                  <button key={version.id} className={`morph-version ${version.id === activeVersionId ? "is-active" : ""}`} onClick={() => selectVersion(version)}>
                    {/* Session-only data URL produced from the local GPU snapshot. */}
                    <Image src={version.thumbnail} alt="" width={52} height={52} unoptimized />
                    <span><strong>{PRESETS.find((preset) => preset.id === version.presetId)?.name ?? "Morph"} · V{versions.length - index}</strong><span>{version.iteration.toLocaleString()} iterations</span></span>
                  </button>
                ))}
              </div>
            ) : <p className="morph-empty">Frozen shapes will appear here. Freeze a moment you want to keep.</p>}
          </section>
        </aside>

        <section className="morph-center">
          <div className="morph-canvas-panel morph-panel">
            <div className="morph-canvas-header">
              <div><span className="morph-eyebrow">{mode === "grow" ? "LIVE SIMULATION" : mode === "shape" ? "VECTOR PREVIEW" : "FINAL OUTPUT"}</span><h1>{canvasTitle}</h1></div>
              <div className="morph-canvas-meta"><i /><span>{runtimeLabels[runtime]}</span><span>·</span><span>512²</span></div>
            </div>

            <div className="morph-stage">
              <div className={`morph-artboard ${mode === "grow" ? "is-grow" : ""}`} style={{ background: colorway.background }}>
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label={`${currentPreset.name} pattern, ${runtimeLabels[runtime]}, 512 by 512 simulation`}
                  style={{ opacity: mode === "grow" ? 1 : vectorResult ? 0 : 0.28 }}
                  onPointerDown={beginStroke}
                  onPointerMove={moveStroke}
                  onPointerUp={endStroke}
                  onPointerCancel={endStroke}
                  onPointerEnter={(event) => sampleFromPointer(event)}
                  onPointerLeave={() => !drawingRef.current && setCursor((value) => ({ ...value, visible: false }))}
                />

                {mode !== "grow" && vectorResult && (
                  <svg className={`morph-vector-preview ${vectorUpdating ? "is-updating" : ""}`} viewBox="0 0 1024 1024" role="img" aria-label={`Filled vector shape with ${vectorResult.anchorCount} anchors`}>
                    <rect width="1024" height="1024" fill={colorway.background} />
                    <path d={vectorResult.pathData} fill={colorway.foreground} fillRule="evenodd" />
                  </svg>
                )}

                {cursor.visible && mode === "grow" && runtime === "growing" && (
                  <span className="morph-brush-cursor" style={{ left: `${cursor.x}%`, top: `${cursor.y}%`, width: `${growth.brushSize}%`, height: `${growth.brushSize}%` }} />
                )}

                {runtime === "initializing" && <div className="morph-canvas-message"><div><span>◎</span><strong>Preparing the growth canvas…</strong><p>Connecting the simulation to your graphics device.</p></div></div>}
                {runtime === "error" && <div className="morph-canvas-message"><div><span>!</span><strong>Morph needs WebGPU</strong><p>{gpuIssue || "Try the latest desktop Chrome or Edge with hardware acceleration enabled."}</p></div></div>}
                {mode !== "grow" && !vectorResult && runtime !== "error" && <div className="morph-canvas-message"><div><span>⌁</span><strong>Building editable paths…</strong><p>Tracing the frozen chemical field into a filled SVG shape.</p></div></div>}
                {mode === "grow" && runtime === "frozen" && !activeVersion && <div className="morph-canvas-message"><div><span>◉</span><strong>Motion is paused</strong><p>Your reduced-motion preference is active. Start when you are ready.</p><button onClick={resumeGrowth}>Start Growth</button></div></div>}
                {mode === "grow" && runtime === "growing" && <span className="morph-hint">Paint to guide the growth · Freeze when you find a shape you like</span>}
              </div>

              <div className="morph-canvas-tools">
                <span>Fit</span>
                <span>{iteration.toLocaleString()} steps</span>
                <span>{fps || "—"} FPS</span>
                {vectorResult && <span>{vectorResult.anchorCount.toLocaleString()} anchors</span>}
              </div>
            </div>
          </div>
        </section>

        <aside className="morph-inspector morph-panel">
          <div className="morph-inspector-heading"><div><i /><div><span className="morph-eyebrow">{mode.toUpperCase()}</span><h2>{mode === "grow" ? "Growth controls" : mode === "shape" ? "Shape controls" : "Export SVG"}</h2></div></div></div>
          <div className="morph-inspector-body">
            {mode === "grow" && (
              <>
                <section className="morph-inspector-section">
                  <div className="morph-section-head"><strong>Living form</strong><span>{currentPreset.description}</span></div>
                  <p className="morph-section-copy">Simple controls stay inside the stable range for this growth model.</p>
                  <RangeField label="Growth speed" value={growth.speed} output={growth.speed < 40 ? "Slow" : growth.speed > 60 ? "Fast" : "Balanced"} startLabel="Slow" endLabel="Fast" onBegin={beginGrowthAction} onChange={(value) => updateGrowth({ speed: value })} />
                  <RangeField label="Form" value={growth.form} output={`${growth.form}`} startLabel="Spots" endLabel="Stripes" onBegin={beginGrowthAction} onChange={(value) => updateGrowth({ form: value })} />
                  <RangeField label="Feature size" value={growth.featureSize} output={`${growth.featureSize}`} startLabel="Fine" endLabel="Bold" onBegin={beginGrowthAction} onChange={(value) => updateGrowth({ featureSize: value })} />
                </section>
                <section className="morph-inspector-section">
                  <div className="morph-switch-row"><div><strong>Current seed</strong><small>{seed.toString(16).toUpperCase().padStart(8, "0")}</small></div><span className="morph-eyebrow">LOCAL</span></div>
                </section>
              </>
            )}

            {mode === "shape" && (
              <>
                <section className="morph-inspector-section">
                  <div className="morph-section-head"><strong>Geometry</strong><span>{vectorUpdating ? "Updating paths…" : "Live vector"}</span></div>
                  <RangeField label="Fill level" value={shape.fillLevel} output={`${shape.fillLevel}`} startLabel="Open" endLabel="Dense" onChange={(value) => updateShape({ fillLevel: value })} />
                  <RangeField label="Edge smoothing" value={shape.edgeSmoothing} output={`${shape.edgeSmoothing}`} startLabel="Raw" endLabel="Smooth" onChange={(value) => updateShape({ edgeSmoothing: value })} />
                  <RangeField label="Path detail" value={shape.pathDetail} output={`${shape.pathDetail}`} startLabel="Simple" endLabel="Detailed" onChange={(value) => updateShape({ pathDetail: value })} />
                  <RangeField label="Remove small shapes" value={shape.removeSmallShapes} min={0} max={1} step={0.01} output={`${shape.removeSmallShapes.toFixed(2)}%`} startLabel="Keep" endLabel="Remove" onChange={(value) => updateShape({ removeSmallShapes: value })} />
                </section>
                <section className="morph-inspector-section">
                  <div className="morph-switch-row"><div><strong>Invert fill</strong><small>Swap the shape and its negative space</small></div><button className={`morph-switch ${shape.invertFill ? "is-active" : ""}`} role="switch" aria-checked={shape.invertFill} aria-label="Invert fill" onClick={() => updateShape({ invertFill: !shape.invertFill })} /></div>
                </section>
                <section className="morph-inspector-section">
                  <div className="morph-section-head"><strong>Colorway</strong><span>4 presets</span></div>
                  <div className="morph-colorways">
                    {COLORWAYS.map((item) => (
                      <button key={item.id} className={`morph-colorway ${item.id === colorway.id ? "is-active" : ""}`} aria-pressed={item.id === colorway.id} onClick={() => setColorway(item)}>
                        <span className="morph-colorway-preview"><i style={{ background: item.background }} /><i style={{ background: item.foreground }} /></span><strong>{item.name}</strong>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {mode === "export" && (
              <>
                <section className="morph-inspector-section">
                  <div className="morph-section-head"><strong>Output summary</strong><span>Filled Shape</span></div>
                  <div className="morph-export-summary">
                    <div className="morph-export-row"><span>Artboard</span><strong>1024 × 1024</strong></div>
                    <div className="morph-export-row"><span>Shapes</span><strong>{vectorResult?.shapeCount.toLocaleString() ?? 0}</strong></div>
                    <div className="morph-export-row"><span>Paths</span><strong>{vectorResult?.pathCount.toLocaleString() ?? 0}</strong></div>
                    <div className="morph-export-row"><span>Anchors</span><strong>{vectorResult?.anchorCount.toLocaleString() ?? 0}</strong></div>
                    <div className="morph-export-row"><span>SVG size</span><strong>{svgBytes < 1024 ? `${svgBytes} B` : `${(svgBytes / 1024).toFixed(1)} KB`}</strong></div>
                  </div>
                </section>
                <section className="morph-inspector-section">
                  <div className="morph-switch-row"><div><strong>Include background</strong><small>Turn off for a transparent SVG</small></div><button className={`morph-switch ${includeBackground ? "is-active" : ""}`} role="switch" aria-checked={includeBackground} aria-label="Include background" onClick={() => setIncludeBackground((value) => !value)} /></div>
                  <button className="morph-download" disabled={!vectorResult} onClick={downloadSvg}>Download SVG ↗</button>
                </section>
              </>
            )}
          </div>
        </aside>
      </section>

      {!compactDismissed && <div className="morph-compact-warning"><div><strong>Morph likes a little room.</strong><p>Rotate your device or use a wider window for the full growth workspace.</p><button onClick={() => setCompactDismissed(true)}>Continue anyway</button></div></div>}
      {notice && <div className="morph-notice" role="status">{notice}</div>}
    </main>
  );
}
