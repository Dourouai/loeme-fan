/// <reference types="@webgpu/types" />

import type {
  BrushSample,
  Colorway,
  GpuSnapshot,
  GrowthSettings,
  PresetId,
} from "./morph-types";

const SIMULATION_SIZE = 512;
const WORKGROUP_SIZE = 8;
const MAX_STEPS_PER_FRAME = 8;
const MAX_BRUSH_SAMPLES_PER_SUBMISSION = 192;
const HISTORY_LIMIT = 8;
const MIN_BRUSH_RADIUS = 0.005;
const MAX_BRUSH_RADIUS = 0.2;

export const DEFAULT_MORPH_SEED = 0x4d4f5250;

export type MorphGpuStatus =
  | "idle"
  | "initializing"
  | "ready"
  | "freezing"
  | "lost"
  | "error"
  | "disposed";

export type MorphGpuErrorCode =
  | "insecure-context"
  | "webgpu-unavailable"
  | "adapter-unavailable"
  | "device-limits"
  | "canvas-unavailable"
  | "device-lost"
  | "initialization-failed";

export class MorphGpuError extends Error {
  readonly code: MorphGpuErrorCode;

  constructor(code: MorphGpuErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MorphGpuError";
    this.code = code;
  }
}

class MorphInitializationCancelled extends Error {
  constructor() {
    super("Morph GPU initialization was cancelled.");
    this.name = "MorphInitializationCancelled";
  }
}

interface FormPoint {
  at: number;
  feed: number;
  kill: number;
}

export interface MorphPreset {
  id: PresetId;
  name: string;
  description: string;
  du: number;
  dv: number;
  feed: number;
  kill: number;
  defaultForm: number;
  defaultFeatureSize: number;
  defaultSeed: number;
  formLut: readonly FormPoint[];
}

export const MORPH_PRESETS: Readonly<Record<PresetId, MorphPreset>> = {
  cells: {
    id: "cells",
    name: "Cells",
    description: "Dividing islands and soft cellular spots.",
    du: 0.16,
    dv: 0.08,
    feed: 0.0367,
    kill: 0.0649,
    defaultForm: 25,
    defaultFeatureSize: 45,
    defaultSeed: DEFAULT_MORPH_SEED,
    formLut: [
      { at: 0, feed: 0.038, kill: 0.066 },
      { at: 25, feed: 0.0367, kill: 0.0649 },
      { at: 100, feed: 0.03, kill: 0.059 },
    ],
  },
  coral: {
    id: "coral",
    name: "Coral",
    description: "Connected bubbles with branching, reef-like edges.",
    du: 0.16,
    dv: 0.08,
    feed: 0.0545,
    kill: 0.062,
    defaultForm: 55,
    defaultFeatureSize: 60,
    defaultSeed: DEFAULT_MORPH_SEED ^ 0x434f5241,
    formLut: [
      { at: 0, feed: 0.058, kill: 0.064 },
      { at: 55, feed: 0.0545, kill: 0.062 },
      { at: 100, feed: 0.05, kill: 0.06 },
    ],
  },
  maze: {
    id: "maze",
    name: "Maze",
    description: "Continuous labyrinths and fingerprint-like paths.",
    du: 0.16,
    dv: 0.08,
    feed: 0.029,
    kill: 0.057,
    defaultForm: 85,
    defaultFeatureSize: 50,
    defaultSeed: DEFAULT_MORPH_SEED ^ 0x4d415a45,
    formLut: [
      { at: 0, feed: 0.034, kill: 0.061 },
      { at: 85, feed: 0.029, kill: 0.057 },
      { at: 100, feed: 0.0275, kill: 0.0555 },
    ],
  },
  worms: {
    id: "worms",
    name: "Worms",
    description: "Slender strands and flowing organic ribbons.",
    du: 0.16,
    dv: 0.08,
    feed: 0.078,
    kill: 0.061,
    defaultForm: 65,
    defaultFeatureSize: 35,
    defaultSeed: DEFAULT_MORPH_SEED ^ 0x574f524d,
    formLut: [
      { at: 0, feed: 0.082, kill: 0.0635 },
      { at: 65, feed: 0.078, kill: 0.061 },
      { at: 100, feed: 0.074, kill: 0.0585 },
    ],
  },
};

export const DEFAULT_GROWTH_SETTINGS: Readonly<GrowthSettings> = {
  // 43 maps to roughly 120 simulation steps per second.
  speed: 43,
  form: MORPH_PRESETS.cells.defaultForm,
  featureSize: MORPH_PRESETS.cells.defaultFeatureSize,
  brushSize: 6,
};

export function growthSettingsForPreset(
  presetId: PresetId,
  current: Partial<GrowthSettings> = {},
): GrowthSettings {
  const preset = MORPH_PRESETS[presetId];
  return {
    speed: current.speed ?? DEFAULT_GROWTH_SETTINGS.speed,
    form: preset.defaultForm,
    featureSize: preset.defaultFeatureSize,
    brushSize: current.brushSize ?? DEFAULT_GROWTH_SETTINGS.brushSize,
  };
}

interface HistoryEntry {
  texture: GPUTexture;
  iteration: number;
  presetId: PresetId;
  seed: number;
  settings: GrowthSettings;
}

interface ResetOptions {
  clearHistory?: boolean;
}

export interface MorphRestoreOptions {
  checkpoint?: boolean;
  presetId?: PresetId;
  seed?: number;
  settings?: GrowthSettings;
}

const INITIALIZE_SHADER = /* wgsl */ `
struct InitParams {
  seed: u32,
  preset: u32,
  width: u32,
  height: u32,
}

@group(0) @binding(0) var<uniform> params: InitParams;
@group(0) @binding(1) var destination: texture_storage_2d<rgba16float, write>;

fn hash_u32(value: u32) -> u32 {
  var x = value;
  x = x ^ (x >> 16u);
  x = x * 0x7feb352du;
  x = x ^ (x >> 15u);
  x = x * 0x846ca68bu;
  return x ^ (x >> 16u);
}

fn random(index: u32, channel: u32) -> f32 {
  let mixed = params.seed ^ (index * 0x9e3779b9u) ^ (channel * 0x85ebca6bu);
  return f32(hash_u32(mixed)) / 4294967295.0;
}

fn soft_disk(uv: vec2f, center: vec2f, radius: f32) -> f32 {
  let distance_from_center = distance(uv, center);
  return 1.0 - smoothstep(radius * 0.7, radius, distance_from_center);
}

fn distance_to_segment(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let segment = end - start;
  let denominator = max(dot(segment, segment), 0.000001);
  let amount = clamp(dot(point - start, segment) / denominator, 0.0, 1.0);
  return distance(point, start + segment * amount);
}

fn cells_seed(uv: vec2f) -> f32 {
  var value = soft_disk(uv, vec2f(0.5), 0.062);
  for (var index = 1u; index < 12u; index = index + 1u) {
    let center = vec2f(
      0.1 + 0.8 * random(index, 0u),
      0.1 + 0.8 * random(index, 1u)
    );
    let radius = 0.025 + 0.025 * random(index, 2u);
    value = max(value, soft_disk(uv, center, radius));
  }
  return value;
}

fn coral_seed(uv: vec2f) -> f32 {
  let centered = uv - vec2f(0.5);
  let angle = atan2(centered.y, centered.x);
  let radius = length(centered);
  let phase = random(0u, 7u) * 6.2831853;
  let ring_radius = 0.18 + 0.025 * sin(angle * 7.0 + phase) + 0.012 * sin(angle * 13.0);
  var value = 1.0 - smoothstep(0.015, 0.036, abs(radius - ring_radius));
  for (var index = 1u; index < 8u; index = index + 1u) {
    let center = vec2f(
      0.12 + 0.76 * random(index, 3u),
      0.12 + 0.76 * random(index, 4u)
    );
    value = max(value, soft_disk(uv, center, 0.012 + 0.012 * random(index, 5u)));
  }
  return value;
}

fn maze_seed(uv: vec2f) -> f32 {
  let grid_size = 20u;
  let grid = uv * f32(grid_size);
  let cell = vec2u(min(floor(grid), vec2f(f32(grid_size - 1u))));
  let index = cell.y * grid_size + cell.x;
  let enabled = random(index, 12u) > 0.82;
  let local = fract(grid) - vec2f(0.5);
  let block = 1.0 - smoothstep(0.2, 0.42, length(local));
  return max(select(0.0, block, enabled), soft_disk(uv, vec2f(0.5), 0.025));
}

fn worms_seed(uv: vec2f) -> f32 {
  var value = 0.0;
  for (var index = 0u; index < 5u; index = index + 1u) {
    let start = vec2f(
      0.1 + 0.7 * random(index, 20u),
      0.1 + 0.7 * random(index, 21u)
    );
    let direction = vec2f(
      0.08 + 0.15 * random(index, 22u),
      -0.12 + 0.24 * random(index, 23u)
    );
    let width = 0.022 + 0.014 * random(index, 24u);
    let strand = 1.0 - smoothstep(width * 0.65, width, distance_to_segment(uv, start, start + direction));
    value = max(value, strand);
  }
  for (var index = 0u; index < 6u; index = index + 1u) {
    let center = vec2f(random(index, 30u), random(index, 31u));
    value = max(value, soft_disk(uv, center, 0.014 + random(index, 32u) * 0.014));
  }
  return value;
}

@compute @workgroup_size(8, 8)
fn initialize(@builtin(global_invocation_id) global_id: vec3u) {
  if (global_id.x >= params.width || global_id.y >= params.height) {
    return;
  }

  let uv = (vec2f(global_id.xy) + vec2f(0.5))
    / vec2f(f32(params.width), f32(params.height));
  var activation = 0.0;
  switch params.preset {
    case 0u: { activation = cells_seed(uv); }
    case 1u: { activation = coral_seed(uv); }
    case 2u: { activation = maze_seed(uv); }
    default: { activation = worms_seed(uv); }
  }

  activation = clamp(activation, 0.0, 1.0);
  // A small deterministic perturbation is essential for symmetry breaking.
  // Without it, a perfectly smooth seed can collapse back to (1, 0) before
  // the Turing instability has a chance to form visible structure.
  let pixel_index = global_id.y * params.width + global_id.x;
  let needs_strong_perturbation = params.preset == 0u || params.preset == 3u;
  let perturbation_scale = select(0.2, 1.0, needs_strong_perturbation);
  let perturbation = (random(pixel_index, 91u) - 0.5) * perturbation_scale;
  let seeded_u = clamp(0.5 + perturbation, 0.0, 1.0);
  let seeded_v = clamp(0.25 - perturbation, 0.0, 1.0);
  let u = mix(1.0, seeded_u, activation);
  let v = mix(0.0, seeded_v, activation);
  textureStore(destination, vec2i(global_id.xy), vec4f(u, v, 0.0, 1.0));
}
`;

const SIMULATION_SHADER = /* wgsl */ `
struct SimulationParams {
  coefficients: vec4f,
}

@group(0) @binding(0) var<uniform> params: SimulationParams;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var destination: texture_storage_2d<rgba16float, write>;

fn load_uv(position: vec2i, dimensions: vec2i) -> vec2f {
  let bounded = clamp(position, vec2i(0), dimensions - vec2i(1));
  return textureLoad(source, bounded, 0).rg;
}

@compute @workgroup_size(8, 8)
fn simulate(@builtin(global_invocation_id) global_id: vec3u) {
  let dimensions_u = textureDimensions(source);
  if (global_id.x >= dimensions_u.x || global_id.y >= dimensions_u.y) {
    return;
  }

  let dimensions = vec2i(dimensions_u);
  let center_position = vec2i(global_id.xy);
  let center = load_uv(center_position, dimensions);

  let axis =
    load_uv(center_position + vec2i(1, 0), dimensions) +
    load_uv(center_position + vec2i(-1, 0), dimensions) +
    load_uv(center_position + vec2i(0, 1), dimensions) +
    load_uv(center_position + vec2i(0, -1), dimensions);
  let diagonal =
    load_uv(center_position + vec2i(1, 1), dimensions) +
    load_uv(center_position + vec2i(-1, 1), dimensions) +
    load_uv(center_position + vec2i(1, -1), dimensions) +
    load_uv(center_position + vec2i(-1, -1), dimensions);
  let laplacian = -center + axis * 0.2 + diagonal * 0.05;

  let du = params.coefficients.x;
  let dv = params.coefficients.y;
  let feed = params.coefficients.z;
  let kill = params.coefficients.w;
  let reaction = center.x * center.y * center.y;
  let next_u = clamp(center.x + du * laplacian.x - reaction + feed * (1.0 - center.x), 0.0, 1.0);
  let next_v = clamp(center.y + dv * laplacian.y + reaction - (feed + kill) * center.y, 0.0, 1.0);

  textureStore(destination, center_position, vec4f(next_u, next_v, 0.0, 1.0));
}
`;

const BRUSH_SHADER = /* wgsl */ `
struct BrushBatch {
  count: u32,
  preset: u32,
  _padding_1: u32,
  _padding_2: u32,
}

@group(0) @binding(0) var<storage, read> brushes: array<vec4f>;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var destination: texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<uniform> batch: BrushBatch;

fn brush_noise(position: vec2u) -> f32 {
  var value = (position.x * 0x9e3779b9u) ^ (position.y * 0x85ebca6bu);
  value = value ^ (value >> 16u);
  value = value * 0x7feb352du;
  value = value ^ (value >> 15u);
  return f32(value) / 4294967295.0;
}

@compute @workgroup_size(8, 8)
fn paint(@builtin(global_invocation_id) global_id: vec3u) {
  let dimensions = textureDimensions(source);
  if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
    return;
  }

  let uv = (vec2f(global_id.xy) + vec2f(0.5)) / vec2f(dimensions);
  var painted = textureLoad(source, vec2i(global_id.xy), 0);
  for (var index = 0u; index < batch.count; index = index + 1u) {
    let brush = brushes[index];
    let radius = max(brush.z, 0.0001);
    let distance_from_brush = distance(uv, brush.xy);
    let influence = 1.0 - smoothstep(radius * 0.7, radius, distance_from_brush);
    let add_mode = brush.w > 0.5;
    let needs_strong_perturbation = batch.preset == 0u || batch.preset == 3u;
    let perturbation_scale = select(0.2, 1.0, needs_strong_perturbation);
    let perturbation = (brush_noise(global_id.xy) - 0.5) * perturbation_scale;
    let seeded = vec4f(
      clamp(0.5 + perturbation, 0.0, 1.0),
      clamp(0.25 - perturbation, 0.0, 1.0),
      0.0,
      1.0
    );
    let erased = vec4f(1.0, 0.0, 0.0, 1.0);
    let brush_target = select(erased, seeded, add_mode);
    painted = mix(painted, brush_target, influence);
  }
  textureStore(destination, vec2i(global_id.xy), painted);
}
`;

const RENDER_SHADER = /* wgsl */ `
struct ColorParams {
  foreground: vec4f,
  background: vec4f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var<uniform> colors: ColorParams;
@group(0) @binding(1) var field: texture_2d<f32>;

@vertex
fn vertex_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  let position = positions[vertex_index];
  var output: VertexOutput;
  output.position = vec4f(position, 0.0, 1.0);
  output.uv = vec2f((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
  return output;
}

@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4f {
  let dimensions = textureDimensions(field);
  let bounded_uv = clamp(input.uv, vec2f(0.0), vec2f(0.999999));
  let position = vec2i(bounded_uv * vec2f(dimensions));
  let concentration = textureLoad(field, position, 0).g;
  let pigment = smoothstep(0.015, 0.32, concentration);
  let color = mix(colors.background, colors.foreground, pigment);
  return vec4f(color.rgb, 1.0);
}
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function copySettings(settings: GrowthSettings): GrowthSettings {
  return {
    speed: clamp(Number.isFinite(settings.speed) ? settings.speed : 43, 0, 100),
    form: clamp(Number.isFinite(settings.form) ? settings.form : 50, 0, 100),
    featureSize: clamp(
      Number.isFinite(settings.featureSize) ? settings.featureSize : 50,
      0,
      100,
    ),
    brushSize: clamp(Number.isFinite(settings.brushSize) ? settings.brushSize : 6, 1, 20),
  };
}

function interpolateForm(preset: MorphPreset, form: number): { feed: number; kill: number } {
  const value = clamp(form, 0, 100);
  const points = preset.formLut;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    if (value <= next.at) {
      const amount = (value - previous.at) / Math.max(0.0001, next.at - previous.at);
      return {
        feed: previous.feed + (next.feed - previous.feed) * amount,
        kill: previous.kill + (next.kill - previous.kill) * amount,
      };
    }
  }
  const last = points[points.length - 1];
  return { feed: last.feed, kill: last.kill };
}

function featureScale(preset: MorphPreset, featureSize: number): number {
  const value = clamp(featureSize, 0, 100);
  if (value <= preset.defaultFeatureSize) {
    return 0.65 + (value / Math.max(1, preset.defaultFeatureSize)) * 0.35;
  }
  return (
    1 +
    ((value - preset.defaultFeatureSize) / Math.max(1, 100 - preset.defaultFeatureSize)) * 0.45
  );
}

function presetIndex(presetId: PresetId): number {
  return ({ cells: 0, coral: 1, maze: 2, worms: 3 } as const)[presetId];
}

function parseHexColor(value: string): [number, number, number, number] {
  const clean = value.trim().replace(/^#/, "");
  const expanded = clean.length === 3 ? clean.replace(/./g, (character) => character.repeat(2)) : clean;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return [1, 1, 1, 1];
  }
  return [
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255,
    1,
  ];
}

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

function normalizeBrushSample(sample: BrushSample): BrushSample {
  const rawRadius = Number.isFinite(sample.radius) ? sample.radius : DEFAULT_GROWTH_SETTINGS.brushSize / 100;
  const radius = rawRadius > 1 ? rawRadius / 100 : rawRadius;
  return {
    x: clamp(Number.isFinite(sample.x) ? sample.x : 0.5, 0, 1),
    y: clamp(Number.isFinite(sample.y) ? sample.y : 0.5, 0, 1),
    radius: clamp(radius, MIN_BRUSH_RADIUS, MAX_BRUSH_RADIUS),
    mode: sample.mode,
  };
}

export class MorphGpuEngine {
  readonly resolution = SIMULATION_SIZE;

  private statusValue: MorphGpuStatus = "idle";
  private errorValue: string | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: GPUCanvasContext | null = null;
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private canvasFormat: GPUTextureFormat | null = null;

  private textures: [GPUTexture, GPUTexture] | null = null;
  private currentTextureIndex = 0;
  private initializePipeline: GPUComputePipeline | null = null;
  private simulationPipeline: GPUComputePipeline | null = null;
  private brushPipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;
  private initializeBindGroups: [GPUBindGroup, GPUBindGroup] | null = null;
  private simulationBindGroups: [GPUBindGroup, GPUBindGroup] | null = null;
  private brushBindGroups: [GPUBindGroup, GPUBindGroup] | null = null;
  private renderBindGroups: [GPUBindGroup, GPUBindGroup] | null = null;
  private initializeUniformBuffer: GPUBuffer | null = null;
  private simulationUniformBuffer: GPUBuffer | null = null;
  private brushUniformBuffer: GPUBuffer | null = null;
  private brushCountBuffer: GPUBuffer | null = null;
  private colorUniformBuffer: GPUBuffer | null = null;

  private presetIdValue: PresetId = "cells";
  private seedValue = DEFAULT_MORPH_SEED;
  private settingsValue: GrowthSettings = { ...DEFAULT_GROWTH_SETTINGS };
  private iterationValue = 0;
  private hasSimulation = false;
  private lastFrameTime: number | null = null;
  private stepAccumulator = 0;
  private brushQueue: BrushSample[] = [];
  private lastBrushSample: BrushSample | null = null;
  private strokeOpen = false;
  private undoEntries: HistoryEntry[] = [];
  private redoEntries: HistoryEntry[] = [];
  private freezePromise: Promise<GpuSnapshot> | null = null;
  private initializationGeneration = 0;
  private readonly handleVisibilityChange = () => {
    this.lastFrameTime = null;
    this.stepAccumulator = 0;
  };

  get status(): MorphGpuStatus {
    return this.statusValue;
  }

  get isReady(): boolean {
    return this.statusValue === "ready";
  }

  get iteration(): number {
    return this.iterationValue;
  }

  get presetId(): PresetId {
    return this.presetIdValue;
  }

  get seed(): number {
    return this.seedValue;
  }

  get settings(): GrowthSettings {
    return { ...this.settingsValue };
  }

  get canUndo(): boolean {
    return this.undoEntries.length > 0;
  }

  get canRedo(): boolean {
    return this.redoEntries.length > 0;
  }

  get errorMessage(): string | null {
    return this.errorValue;
  }

  get deviceLostMessage(): string | null {
    return this.statusValue === "lost" || this.statusValue === "error" ? this.errorValue : null;
  }

  get targetStepsPerSecond(): number {
    return 30 + (clamp(this.settingsValue.speed, 0, 100) / 100) * 210;
  }

  static async checkSupport(): Promise<{ supported: true } | { supported: false; error: MorphGpuError }> {
    if (typeof globalThis.isSecureContext === "boolean" && !globalThis.isSecureContext) {
      return {
        supported: false,
        error: new MorphGpuError(
          "insecure-context",
          "Morph needs a secure browser context to use WebGPU.",
        ),
      };
    }
    if (typeof navigator === "undefined" || !("gpu" in navigator) || !navigator.gpu) {
      return {
        supported: false,
        error: new MorphGpuError(
          "webgpu-unavailable",
          "Morph needs WebGPU to grow patterns on this device.",
        ),
      };
    }
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) {
      return {
        supported: false,
        error: new MorphGpuError(
          "adapter-unavailable",
          "No compatible graphics adapter is available for Morph.",
        ),
      };
    }
    if (
      adapter.limits.maxTextureDimension2D < SIMULATION_SIZE ||
      adapter.limits.maxComputeWorkgroupSizeX < WORKGROUP_SIZE ||
      adapter.limits.maxComputeWorkgroupSizeY < WORKGROUP_SIZE ||
      adapter.limits.maxComputeInvocationsPerWorkgroup < WORKGROUP_SIZE * WORKGROUP_SIZE
    ) {
      return {
        supported: false,
        error: new MorphGpuError(
          "device-limits",
          "This graphics device does not meet Morph's minimum WebGPU limits.",
        ),
      };
    }
    return { supported: true };
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.statusValue === "initializing") {
      throw new MorphGpuError("initialization-failed", "Morph GPU is already initializing.");
    }
    if (this.statusValue === "ready") {
      return;
    }

    const initializationGeneration = this.initializationGeneration + 1;
    this.initializationGeneration = initializationGeneration;
    this.statusValue = "initializing";
    this.errorValue = null;
    this.canvas = canvas;

    try {
      const support = await MorphGpuEngine.checkSupport();
      this.assertInitializationActive(initializationGeneration);
      if (!support.supported) {
        throw support.error;
      }

      const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      this.assertInitializationActive(initializationGeneration);
      if (!adapter) {
        throw new MorphGpuError("adapter-unavailable", "No compatible graphics adapter is available.");
      }
      const device = await adapter.requestDevice();
      if (!this.isInitializationActive(initializationGeneration)) {
        device.destroy();
        throw new MorphInitializationCancelled();
      }
      const context = canvas.getContext("webgpu");
      if (!context) {
        device.destroy();
        throw new MorphGpuError(
          "canvas-unavailable",
          "The browser could not create a WebGPU canvas for Morph.",
        );
      }

      this.adapter = adapter;
      this.device = device;
      this.context = context;
      this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
      this.configureCanvas();
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
      }

      device.lost.then((information) => {
        if (this.device !== device || this.statusValue === "disposed") {
          return;
        }
        this.statusValue = "lost";
        this.errorValue = information.message || "The graphics device was reset.";
      });
      device.addEventListener("uncapturederror", (event) => {
        if (this.device !== device || this.statusValue === "disposed") {
          return;
        }
        this.statusValue = "error";
        this.errorValue = event.error.message || "WebGPU reported an unexpected error.";
      });

      await this.createResources(initializationGeneration);
      this.assertInitializationActive(initializationGeneration);
      this.statusValue = "ready";
      this.reset("cells", DEFAULT_MORPH_SEED, DEFAULT_GROWTH_SETTINGS, { clearHistory: true });
    } catch (error) {
      if (
        error instanceof MorphInitializationCancelled ||
        !this.isInitializationActive(initializationGeneration)
      ) {
        return;
      }
      this.releaseGpuResources();
      this.statusValue = "error";
      this.errorValue = error instanceof Error ? error.message : "Could not initialize WebGPU.";
      if (error instanceof MorphGpuError) {
        throw error;
      }
      throw new MorphGpuError(
        "initialization-failed",
        this.errorValue,
        error instanceof Error ? { cause: error } : undefined,
      );
    }
  }

  reset(
    presetId: PresetId,
    seed: number,
    growthSettings: GrowthSettings,
    options: ResetOptions | boolean = {},
  ): void {
    const device = this.requireDevice();
    const pipeline = this.requireResource(this.initializePipeline, "initialize pipeline");
    const bindGroups = this.requireResource(this.initializeBindGroups, "initialize bind groups");
    const uniformBuffer = this.requireResource(
      this.initializeUniformBuffer,
      "initialize uniform buffer",
    );

    const clearHistory = typeof options === "boolean" ? options : options.clearHistory;
    if (clearHistory) {
      this.clearHistory();
    }

    this.presetIdValue = presetId;
    this.seedValue = seed >>> 0;
    this.settingsValue = copySettings(growthSettings);
    this.iterationValue = 0;
    this.currentTextureIndex = 0;
    this.lastFrameTime = null;
    this.stepAccumulator = 0;
    this.brushQueue = [];
    this.endStroke();
    this.errorValue = null;

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Uint32Array([this.seedValue, presetIndex(presetId), SIMULATION_SIZE, SIMULATION_SIZE]),
    );
    const encoder = device.createCommandEncoder({ label: "Morph reset" });
    for (let index = 0; index < 2; index += 1) {
      const pass = encoder.beginComputePass({ label: `Morph initialize texture ${index}` });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroups[index]);
      pass.dispatchWorkgroups(
        Math.ceil(SIMULATION_SIZE / WORKGROUP_SIZE),
        Math.ceil(SIMULATION_SIZE / WORKGROUP_SIZE),
      );
      pass.end();
    }
    device.queue.submit([encoder.finish()]);
    this.hasSimulation = true;
    this.statusValue = "ready";
    this.writeSimulationSettings();
  }

  setSettings(settings: GrowthSettings, checkpoint = false): void {
    if (checkpoint) {
      this.createCheckpoint();
    }
    this.settingsValue = copySettings(settings);
    if (this.device && this.simulationUniformBuffer) {
      this.writeSimulationSettings();
    }
  }

  enqueueStroke(samples: BrushSample | readonly BrushSample[]): void {
    if (!this.isReady || !this.hasSimulation) {
      return;
    }
    const incoming = (Array.isArray(samples) ? samples : [samples]).map(normalizeBrushSample);
    if (incoming.length === 0) {
      return;
    }

    if (!this.strokeOpen) {
      this.strokeOpen = true;
      this.lastBrushSample = null;
    }

    for (const next of incoming) {
      const previous = this.lastBrushSample;
      if (!previous || previous.mode !== next.mode) {
        this.brushQueue.push(next);
        this.lastBrushSample = next;
        continue;
      }

      const deltaX = next.x - previous.x;
      const deltaY = next.y - previous.y;
      const distance = Math.hypot(deltaX, deltaY);
      const spacing = Math.max(0.0005, Math.min(previous.radius, next.radius) * 0.5);
      const segmentCount = Math.max(1, Math.ceil(distance / spacing));
      for (let segment = 1; segment <= segmentCount; segment += 1) {
        const amount = segment / segmentCount;
        this.brushQueue.push({
          x: previous.x + deltaX * amount,
          y: previous.y + deltaY * amount,
          radius: previous.radius + (next.radius - previous.radius) * amount,
          mode: next.mode,
        });
      }
      this.lastBrushSample = next;
    }
  }

  endStroke(): void {
    this.strokeOpen = false;
    this.lastBrushSample = null;
  }

  frame(now: number, running: boolean, colorway: Colorway): boolean {
    if (!this.isReady || !this.device || !this.renderPipeline || !this.renderBindGroups) {
      return false;
    }

    this.resizeCanvasBackingStore();
    const encoder = this.device.createCommandEncoder({ label: "Morph frame" });

    if (this.brushQueue.length > 0) {
      const count = Math.min(this.brushQueue.length, MAX_BRUSH_SAMPLES_PER_SUBMISSION);
      const samples = this.brushQueue.splice(0, count);
      this.encodeBrushes(encoder, samples);
    }

    const pageIsVisible = typeof document === "undefined" || document.visibilityState === "visible";
    const shouldRun = running && pageIsVisible;
    let steps = 0;
    if (shouldRun) {
      if (this.lastFrameTime !== null) {
        const elapsedSeconds = clamp((now - this.lastFrameTime) / 1000, 0, 0.1);
        const desiredSteps = this.stepAccumulator + elapsedSeconds * this.targetStepsPerSecond;
        steps = Math.min(MAX_STEPS_PER_FRAME, Math.floor(desiredSteps));
        this.stepAccumulator = steps === MAX_STEPS_PER_FRAME ? 0 : desiredSteps - steps;
      }
      this.lastFrameTime = now;
    } else {
      this.lastFrameTime = now;
      this.stepAccumulator = 0;
    }

    if (steps > 0) {
      this.encodeSimulationSteps(encoder, steps);
      this.iterationValue += steps;
    }

    this.writeColors(colorway);
    this.encodeRender(encoder);
    this.device.queue.submit([encoder.finish()]);
    return true;
  }

  createCheckpoint(): boolean {
    if (!this.isReady || !this.hasSimulation || !this.device || !this.textures) {
      return false;
    }
    this.flushBrushQueue();
    this.endStroke();
    const entry = this.captureHistoryEntry();
    this.undoEntries.push(entry);
    this.trimHistory(this.undoEntries);
    this.destroyEntries(this.redoEntries);
    this.redoEntries = [];
    return true;
  }

  undo(): boolean {
    if (!this.isReady || this.undoEntries.length === 0 || !this.device) {
      return false;
    }
    this.flushBrushQueue();
    this.endStroke();
    const target = this.undoEntries.pop();
    if (!target) {
      return false;
    }
    this.redoEntries.push(this.captureHistoryEntry());
    this.trimHistory(this.redoEntries);
    this.restoreHistoryEntry(target);
    return true;
  }

  redo(): boolean {
    if (!this.isReady || this.redoEntries.length === 0 || !this.device) {
      return false;
    }
    this.flushBrushQueue();
    this.endStroke();
    const target = this.redoEntries.pop();
    if (!target) {
      return false;
    }
    this.undoEntries.push(this.captureHistoryEntry());
    this.trimHistory(this.undoEntries);
    this.restoreHistoryEntry(target);
    return true;
  }

  async freeze(): Promise<GpuSnapshot> {
    if (this.freezePromise) {
      return this.freezePromise;
    }
    this.freezePromise = this.readSnapshot();
    try {
      return await this.freezePromise;
    } finally {
      this.freezePromise = null;
    }
  }

  restore(snapshot: GpuSnapshot, options: boolean | MorphRestoreOptions = true): void {
    const device = this.requireDevice();
    const textures = this.requireResource(this.textures, "simulation textures");
    if (snapshot.width !== SIMULATION_SIZE || snapshot.height !== SIMULATION_SIZE) {
      throw new RangeError(
        `Morph snapshot is ${snapshot.width}x${snapshot.height}; expected ${SIMULATION_SIZE}x${SIMULATION_SIZE}.`,
      );
    }
    const expectedLength = SIMULATION_SIZE * SIMULATION_SIZE * 4;
    if (snapshot.data.length !== expectedLength) {
      throw new RangeError(
        `Morph snapshot contains ${snapshot.data.length} half-floats; expected ${expectedLength}.`,
      );
    }
    const checkpoint = typeof options === "boolean" ? options : (options.checkpoint ?? true);
    if (checkpoint && this.isReady && this.hasSimulation) {
      this.createCheckpoint();
    }

    if (typeof options !== "boolean") {
      if (options.presetId) {
        this.presetIdValue = options.presetId;
      }
      if (options.seed !== undefined) {
        this.seedValue = options.seed >>> 0;
      }
      if (options.settings) {
        this.settingsValue = copySettings(options.settings);
      }
    }

    const layout: GPUImageDataLayout = {
      offset: 0,
      bytesPerRow: SIMULATION_SIZE * 8,
      rowsPerImage: SIMULATION_SIZE,
    };
    // GpuSnapshot intentionally accepts any ArrayBufferLike. WebGPU uploads do
    // not accept SharedArrayBuffer-backed views, so normalize to owned memory.
    const uploadData = new Uint16Array(snapshot.data.length);
    uploadData.set(snapshot.data);
    for (const texture of textures) {
      device.queue.writeTexture(
        { texture },
        uploadData,
        layout,
        { width: SIMULATION_SIZE, height: SIMULATION_SIZE, depthOrArrayLayers: 1 },
      );
    }
    this.currentTextureIndex = 0;
    this.iterationValue = Math.max(0, Math.floor(snapshot.iteration));
    this.lastFrameTime = null;
    this.stepAccumulator = 0;
    this.brushQueue = [];
    this.endStroke();
    this.hasSimulation = true;
    this.statusValue = "ready";
    this.writeSimulationSettings();
  }

  dispose(): void {
    if (this.statusValue === "disposed") {
      return;
    }
    this.initializationGeneration += 1;
    this.statusValue = "disposed";
    this.destroyEntries(this.undoEntries);
    this.destroyEntries(this.redoEntries);
    this.undoEntries = [];
    this.redoEntries = [];
    this.releaseGpuResources();
  }

  private isInitializationActive(generation: number): boolean {
    return generation === this.initializationGeneration && this.statusValue !== "disposed";
  }

  private assertInitializationActive(generation: number): void {
    if (!this.isInitializationActive(generation)) {
      throw new MorphInitializationCancelled();
    }
  }

  private releaseGpuResources(): void {
    this.textures?.forEach((texture) => texture.destroy());
    this.initializeUniformBuffer?.destroy();
    this.simulationUniformBuffer?.destroy();
    this.brushUniformBuffer?.destroy();
    this.brushCountBuffer?.destroy();
    this.colorUniformBuffer?.destroy();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
    this.context?.unconfigure();
    this.device?.destroy();
    this.textures = null;
    this.initializePipeline = null;
    this.simulationPipeline = null;
    this.brushPipeline = null;
    this.renderPipeline = null;
    this.initializeBindGroups = null;
    this.simulationBindGroups = null;
    this.brushBindGroups = null;
    this.renderBindGroups = null;
    this.initializeUniformBuffer = null;
    this.simulationUniformBuffer = null;
    this.brushUniformBuffer = null;
    this.brushCountBuffer = null;
    this.colorUniformBuffer = null;
    this.device = null;
    this.adapter = null;
    this.context = null;
    this.canvas = null;
    this.canvasFormat = null;
    this.hasSimulation = false;
    this.brushQueue = [];
    this.endStroke();
  }

  private async createResources(initializationGeneration: number): Promise<void> {
    const device = this.requireDevice();
    const canvasFormat = this.requireResource(this.canvasFormat, "canvas format");
    device.pushErrorScope("validation");
    let errorScopeOpen = true;
    try {

    const textureUsage =
      GPUTextureUsage.STORAGE_BINDING |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC |
      GPUTextureUsage.COPY_DST;
    const createSimulationTexture = (label: string) =>
      device.createTexture({
        label,
        size: { width: SIMULATION_SIZE, height: SIMULATION_SIZE },
        format: "rgba16float",
        usage: textureUsage,
      });
    this.textures = [
      createSimulationTexture("Morph field A"),
      createSimulationTexture("Morph field B"),
    ];

    this.initializeUniformBuffer = device.createBuffer({
      label: "Morph initialize uniforms",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.simulationUniformBuffer = device.createBuffer({
      label: "Morph simulation uniforms",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.brushUniformBuffer = device.createBuffer({
      label: "Morph brush samples",
      size: MAX_BRUSH_SAMPLES_PER_SUBMISSION * 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.brushCountBuffer = device.createBuffer({
      label: "Morph brush count",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.colorUniformBuffer = device.createBuffer({
      label: "Morph color uniforms",
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const initializeLayout = device.createBindGroupLayout({
      label: "Morph initialize layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: "rgba16float" },
        },
      ],
    });
    const simulationLayout = device.createBindGroupLayout({
      label: "Morph simulation layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          texture: { sampleType: "unfilterable-float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: "rgba16float" },
        },
      ],
    });
    const brushLayout = device.createBindGroupLayout({
      label: "Morph brush layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage", minBindingSize: 16 },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          texture: { sampleType: "unfilterable-float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: "rgba16float" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform", minBindingSize: 16 },
        },
      ],
    });
    const renderLayout = device.createBindGroupLayout({
      label: "Morph render layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "unfilterable-float" },
        },
      ],
    });

    const createCheckedShaderModule = async (label: string, code: string) => {
      const shaderModule = device.createShaderModule({ label, code });
      const compilation = await shaderModule.getCompilationInfo();
      this.assertInitializationActive(initializationGeneration);
      const errors = compilation.messages.filter((message) => message.type === "error");
      if (errors.length > 0) {
        const details = errors
          .slice(0, 4)
          .map((message) => `${message.lineNum}:${message.linePos} ${message.message}`)
          .join("; ");
        throw new MorphGpuError(
          "initialization-failed",
          `${label} did not compile: ${details}`,
        );
      }
      return shaderModule;
    };

    const initializeShader = await createCheckedShaderModule(
      "Morph initialize shader",
      INITIALIZE_SHADER,
    );
    const simulationShader = await createCheckedShaderModule(
      "Morph simulation shader",
      SIMULATION_SHADER,
    );
    const brushShader = await createCheckedShaderModule("Morph brush shader", BRUSH_SHADER);
    const renderShader = await createCheckedShaderModule("Morph render shader", RENDER_SHADER);

    this.initializePipeline = await device.createComputePipelineAsync({
      label: "Morph initialize pipeline",
      layout: device.createPipelineLayout({ bindGroupLayouts: [initializeLayout] }),
      compute: {
        module: initializeShader,
        entryPoint: "initialize",
      },
    });
    this.assertInitializationActive(initializationGeneration);
    this.simulationPipeline = await device.createComputePipelineAsync({
      label: "Morph simulation pipeline",
      layout: device.createPipelineLayout({ bindGroupLayouts: [simulationLayout] }),
      compute: {
        module: simulationShader,
        entryPoint: "simulate",
      },
    });
    this.assertInitializationActive(initializationGeneration);
    this.brushPipeline = await device.createComputePipelineAsync({
      label: "Morph brush pipeline",
      layout: device.createPipelineLayout({ bindGroupLayouts: [brushLayout] }),
      compute: {
        module: brushShader,
        entryPoint: "paint",
      },
    });
    this.assertInitializationActive(initializationGeneration);
    this.renderPipeline = await device.createRenderPipelineAsync({
      label: "Morph render pipeline",
      layout: device.createPipelineLayout({ bindGroupLayouts: [renderLayout] }),
      vertex: {
        module: renderShader,
        entryPoint: "vertex_main",
      },
      fragment: {
        module: renderShader,
        entryPoint: "fragment_main",
        targets: [{ format: canvasFormat }],
      },
      primitive: { topology: "triangle-list" },
    });
    this.assertInitializationActive(initializationGeneration);

    const [textureA, textureB] = this.textures;
    const sourceTargetPairs: readonly [GPUTexture, GPUTexture][] = [
      [textureA, textureB],
      [textureB, textureA],
    ];
    this.initializeBindGroups = [textureA, textureB].map((texture, index) =>
      device.createBindGroup({
        label: `Morph initialize bind group ${index}`,
        layout: initializeLayout,
        entries: [
          { binding: 0, resource: { buffer: this.initializeUniformBuffer! } },
          { binding: 1, resource: texture.createView() },
        ],
      }),
    ) as [GPUBindGroup, GPUBindGroup];
    this.simulationBindGroups = sourceTargetPairs.map(([source, target], index) =>
      device.createBindGroup({
        label: `Morph simulation bind group ${index}`,
        layout: simulationLayout,
        entries: [
          { binding: 0, resource: { buffer: this.simulationUniformBuffer! } },
          { binding: 1, resource: source.createView() },
          { binding: 2, resource: target.createView() },
        ],
      }),
    ) as [GPUBindGroup, GPUBindGroup];
    this.brushBindGroups = sourceTargetPairs.map(([source, target], index) =>
      device.createBindGroup({
        label: `Morph brush bind group ${index}`,
        layout: brushLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: this.brushUniformBuffer! },
          },
          { binding: 1, resource: source.createView() },
          { binding: 2, resource: target.createView() },
          { binding: 3, resource: { buffer: this.brushCountBuffer! } },
        ],
      }),
    ) as [GPUBindGroup, GPUBindGroup];
    this.renderBindGroups = [textureA, textureB].map((texture, index) =>
      device.createBindGroup({
        label: `Morph render bind group ${index}`,
        layout: renderLayout,
        entries: [
          { binding: 0, resource: { buffer: this.colorUniformBuffer! } },
          { binding: 1, resource: texture.createView() },
        ],
      }),
    ) as [GPUBindGroup, GPUBindGroup];

    const validationError = await device.popErrorScope();
    errorScopeOpen = false;
    this.assertInitializationActive(initializationGeneration);
    if (validationError) {
      throw new MorphGpuError(
        "initialization-failed",
        `WebGPU could not create Morph's pipelines: ${validationError.message}`,
      );
    }
    } finally {
      if (errorScopeOpen) {
        await device.popErrorScope().catch(() => null);
      }
    }
  }

  private configureCanvas(): void {
    const context = this.requireResource(this.context, "canvas context");
    const device = this.requireDevice();
    const format = this.requireResource(this.canvasFormat, "canvas format");
    this.resizeCanvasBackingStore();
    context.configure({ device, format, alphaMode: "opaque" });
  }

  private resizeCanvasBackingStore(): void {
    const canvas = this.canvas;
    if (!canvas) {
      return;
    }
    const ratio = typeof window === "undefined" ? 1 : clamp(window.devicePixelRatio || 1, 1, 2);
    const width = Math.max(1, Math.round((canvas.clientWidth || SIMULATION_SIZE) * ratio));
    const height = Math.max(1, Math.round((canvas.clientHeight || SIMULATION_SIZE) * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  private writeSimulationSettings(): void {
    const device = this.requireDevice();
    const buffer = this.requireResource(this.simulationUniformBuffer, "simulation uniform buffer");
    const preset = MORPH_PRESETS[this.presetIdValue];
    const form = interpolateForm(preset, this.settingsValue.form);
    const diffusionScale = featureScale(preset, this.settingsValue.featureSize);
    device.queue.writeBuffer(
      buffer,
      0,
      new Float32Array([
        preset.du * diffusionScale,
        preset.dv * diffusionScale,
        form.feed,
        form.kill,
      ]),
    );
  }

  private writeColors(colorway: Colorway): void {
    const device = this.requireDevice();
    const buffer = this.requireResource(this.colorUniformBuffer, "color uniform buffer");
    const foreground = parseHexColor(colorway.foreground);
    const background = parseHexColor(colorway.background);
    device.queue.writeBuffer(buffer, 0, new Float32Array([...foreground, ...background]));
  }

  private encodeBrushes(encoder: GPUCommandEncoder, samples: readonly BrushSample[]): void {
    const device = this.requireDevice();
    const pipeline = this.requireResource(this.brushPipeline, "brush pipeline");
    const bindGroups = this.requireResource(this.brushBindGroups, "brush bind groups");
    const uniformBuffer = this.requireResource(this.brushUniformBuffer, "brush uniform buffer");
    const countBuffer = this.requireResource(this.brushCountBuffer, "brush count buffer");
    const packed = new Float32Array(samples.length * 4);
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];
      packed.set([
        sample.x,
        sample.y,
        sample.radius,
        sample.mode === "add" ? 1 : 0,
      ], index * 4);
    }
    device.queue.writeBuffer(uniformBuffer, 0, packed);
    device.queue.writeBuffer(
      countBuffer,
      0,
      new Uint32Array([samples.length, presetIndex(this.presetIdValue), 0, 0]),
    );

    const pass = encoder.beginComputePass({ label: "Morph brush batch" });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroups[this.currentTextureIndex]);
    pass.dispatchWorkgroups(
      Math.ceil(SIMULATION_SIZE / WORKGROUP_SIZE),
      Math.ceil(SIMULATION_SIZE / WORKGROUP_SIZE),
    );
    pass.end();
    this.currentTextureIndex = 1 - this.currentTextureIndex;
  }

  private encodeSimulationSteps(encoder: GPUCommandEncoder, steps: number): void {
    const pipeline = this.requireResource(this.simulationPipeline, "simulation pipeline");
    const bindGroups = this.requireResource(this.simulationBindGroups, "simulation bind groups");
    for (let step = 0; step < steps; step += 1) {
      const pass = encoder.beginComputePass({ label: "Morph simulation step" });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroups[this.currentTextureIndex]);
      pass.dispatchWorkgroups(
        Math.ceil(SIMULATION_SIZE / WORKGROUP_SIZE),
        Math.ceil(SIMULATION_SIZE / WORKGROUP_SIZE),
      );
      pass.end();
      this.currentTextureIndex = 1 - this.currentTextureIndex;
    }
  }

  private encodeRender(encoder: GPUCommandEncoder): void {
    const context = this.requireResource(this.context, "canvas context");
    const pipeline = this.requireResource(this.renderPipeline, "render pipeline");
    const bindGroups = this.requireResource(this.renderBindGroups, "render bind groups");
    const pass = encoder.beginRenderPass({
      label: "Morph render",
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.071, g: 0.129, b: 0.106, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroups[this.currentTextureIndex]);
    pass.draw(3);
    pass.end();
  }

  private flushBrushQueue(): void {
    const device = this.requireDevice();
    while (this.brushQueue.length > 0) {
      const count = Math.min(this.brushQueue.length, MAX_BRUSH_SAMPLES_PER_SUBMISSION);
      const samples = this.brushQueue.splice(0, count);
      const encoder = device.createCommandEncoder({ label: "Morph flush brushes" });
      this.encodeBrushes(encoder, samples);
      device.queue.submit([encoder.finish()]);
    }
  }

  private async readSnapshot(): Promise<GpuSnapshot> {
    const device = this.requireDevice();
    const textures = this.requireResource(this.textures, "simulation textures");
    if (!this.isReady) {
      throw new Error("Morph must be ready before it can freeze a snapshot.");
    }
    this.statusValue = "freezing";
    let readBuffer: GPUBuffer | null = null;
    let readBufferMapped = false;
    try {
      this.flushBrushQueue();
      this.endStroke();
      await device.queue.onSubmittedWorkDone();

      const unalignedBytesPerRow = SIMULATION_SIZE * 8;
      const bytesPerRow = alignTo(unalignedBytesPerRow, 256);
      readBuffer = device.createBuffer({
        label: "Morph snapshot readback",
        size: bytesPerRow * SIMULATION_SIZE,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      const encoder = device.createCommandEncoder({ label: "Morph freeze snapshot" });
      encoder.copyTextureToBuffer(
        { texture: textures[this.currentTextureIndex] },
        { buffer: readBuffer, bytesPerRow, rowsPerImage: SIMULATION_SIZE },
        { width: SIMULATION_SIZE, height: SIMULATION_SIZE, depthOrArrayLayers: 1 },
      );
      device.queue.submit([encoder.finish()]);
      await readBuffer.mapAsync(GPUMapMode.READ);
      readBufferMapped = true;

      const mapped = new Uint8Array(readBuffer.getMappedRange());
      const dense = new Uint8Array(unalignedBytesPerRow * SIMULATION_SIZE);
      for (let row = 0; row < SIMULATION_SIZE; row += 1) {
        dense.set(
          mapped.subarray(row * bytesPerRow, row * bytesPerRow + unalignedBytesPerRow),
          row * unalignedBytesPerRow,
        );
      }
      const data = new Uint16Array(dense.buffer);
      if (this.statusValue === "freezing") {
        this.statusValue = "ready";
        this.errorValue = null;
      }
      return {
        width: SIMULATION_SIZE,
        height: SIMULATION_SIZE,
        iteration: this.iterationValue,
        data,
      };
    } catch (error) {
      if (this.statusValue === "freezing") {
        this.statusValue = "ready";
      }
      this.errorValue = error instanceof Error ? error.message : "Could not read the GPU snapshot.";
      throw error;
    } finally {
      if (readBufferMapped) {
        readBuffer?.unmap();
      }
      readBuffer?.destroy();
    }
  }

  private captureHistoryEntry(): HistoryEntry {
    const device = this.requireDevice();
    const textures = this.requireResource(this.textures, "simulation textures");
    const texture = device.createTexture({
      label: "Morph history checkpoint",
      size: { width: SIMULATION_SIZE, height: SIMULATION_SIZE },
      format: "rgba16float",
      usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
    });
    const encoder = device.createCommandEncoder({ label: "Morph capture checkpoint" });
    encoder.copyTextureToTexture(
      { texture: textures[this.currentTextureIndex] },
      { texture },
      { width: SIMULATION_SIZE, height: SIMULATION_SIZE, depthOrArrayLayers: 1 },
    );
    device.queue.submit([encoder.finish()]);
    return {
      texture,
      iteration: this.iterationValue,
      presetId: this.presetIdValue,
      seed: this.seedValue,
      settings: { ...this.settingsValue },
    };
  }

  private restoreHistoryEntry(entry: HistoryEntry): void {
    const device = this.requireDevice();
    const textures = this.requireResource(this.textures, "simulation textures");
    const encoder = device.createCommandEncoder({ label: "Morph restore checkpoint" });
    for (const texture of textures) {
      encoder.copyTextureToTexture(
        { texture: entry.texture },
        { texture },
        { width: SIMULATION_SIZE, height: SIMULATION_SIZE, depthOrArrayLayers: 1 },
      );
    }
    device.queue.submit([encoder.finish()]);
    this.presetIdValue = entry.presetId;
    this.seedValue = entry.seed;
    this.settingsValue = { ...entry.settings };
    this.iterationValue = entry.iteration;
    this.currentTextureIndex = 0;
    this.lastFrameTime = null;
    this.stepAccumulator = 0;
    this.brushQueue = [];
    this.writeSimulationSettings();
    void device.queue.onSubmittedWorkDone().then(() => entry.texture.destroy());
  }

  private trimHistory(entries: HistoryEntry[]): void {
    while (entries.length > HISTORY_LIMIT) {
      entries.shift()?.texture.destroy();
    }
  }

  private clearHistory(): void {
    this.destroyEntries(this.undoEntries);
    this.destroyEntries(this.redoEntries);
    this.undoEntries = [];
    this.redoEntries = [];
  }

  private destroyEntries(entries: readonly HistoryEntry[]): void {
    for (const entry of entries) {
      entry.texture.destroy();
    }
  }

  private requireDevice(): GPUDevice {
    if (!this.device || this.statusValue === "disposed") {
      throw new Error("Morph GPU has not been initialized.");
    }
    return this.device;
  }

  private requireResource<T>(resource: T | null, name: string): T {
    if (!resource) {
      throw new Error(`Morph ${name} is not available.`);
    }
    return resource;
  }
}
