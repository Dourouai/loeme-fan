export type MorphMode = "grow" | "shape" | "export";

export type PresetId = "cells" | "coral" | "maze" | "worms";

export type BrushMode = "add" | "erase";

export interface GrowthSettings {
  speed: number;
  form: number;
  featureSize: number;
  brushSize: number;
}

export interface ShapeSettings {
  fillLevel: number;
  edgeSmoothing: number;
  pathDetail: number;
  removeSmallShapes: number;
  invertFill: boolean;
}

export interface Colorway {
  id: "bio" | "coral" | "water" | "ink";
  name: string;
  foreground: string;
  background: string;
}

export interface BrushSample {
  x: number;
  y: number;
  radius: number;
  mode: BrushMode;
}

export interface GpuSnapshot {
  width: number;
  height: number;
  iteration: number;
  data: Uint16Array;
}

export interface FrozenVersion {
  id: string;
  createdAt: number;
  presetId: PresetId;
  seed: number;
  width: number;
  height: number;
  iteration: number;
  data: Uint16Array;
  thumbnail: string;
  growthSettings: GrowthSettings;
  shapeSettings: ShapeSettings;
}

export interface VectorizeResult {
  snapshotId: string;
  generationId: number;
  pathData: string;
  shapeCount: number;
  pathCount: number;
  anchorCount: number;
}

export type VectorWorkerRequest =
  | {
      type: "cache";
      snapshotId: string;
      width: number;
      height: number;
      data: ArrayBuffer;
    }
  | {
      type: "vectorize";
      snapshotId: string;
      generationId: number;
      settings: ShapeSettings;
    };

export type VectorWorkerResponse =
  | { type: "cached"; snapshotId: string }
  | ({ type: "result" } & VectorizeResult)
  | {
      type: "error";
      snapshotId: string;
      generationId: number;
      message: string;
    };
