import type {
  VectorWorkerRequest,
  VectorWorkerResponse,
} from "./morph-types";
import {
  decodeVField,
  vectorizeVField,
} from "./morph-vector-engine";

interface CachedField {
  width: number;
  height: number;
  field: Float32Array;
}

interface WorkerScope {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<VectorWorkerRequest>) => void,
  ): void;
  postMessage(message: VectorWorkerResponse): void;
}

const workerScope = globalThis as unknown as WorkerScope;
const snapshotCache = new Map<string, CachedField>();
const latestGeneration = new Map<string, number>();
let pendingVectorize: Extract<VectorWorkerRequest, { type: "vectorize" }> | null = null;
let pumpRunning = false;

workerScope.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "cache") {
    try {
      const halves = new Uint16Array(request.data);
      const field = decodeVField(halves, request.width, request.height);
      snapshotCache.delete(request.snapshotId);
      snapshotCache.set(request.snapshotId, {
        width: request.width,
        height: request.height,
        field,
      });
      trimCache();
      workerScope.postMessage({ type: "cached", snapshotId: request.snapshotId });
    } catch (error) {
      workerScope.postMessage({
        type: "error",
        snapshotId: request.snapshotId,
        generationId: -1,
        message: errorMessage(error),
      });
    }
    return;
  }

  latestGeneration.set(request.snapshotId, request.generationId);
  // The Studio debounces at 120ms. This additional latest-only queue handles
  // messages that still arrive together and prevents stale results from being
  // posted after a newer generation has reached the Worker.
  pendingVectorize = request;
  if (!pumpRunning) void pumpVectorizeQueue();
});

async function pumpVectorizeQueue(): Promise<void> {
  pumpRunning = true;
  await yieldToWorkerQueue();

  while (pendingVectorize) {
    const request = pendingVectorize;
    pendingVectorize = null;
    const cached = snapshotCache.get(request.snapshotId);

    if (!cached) {
      postError(request, `Snapshot “${request.snapshotId}” is not cached.`);
      await yieldToWorkerQueue();
      continue;
    }
    if (latestGeneration.get(request.snapshotId) !== request.generationId) {
      await yieldToWorkerQueue();
      continue;
    }

    try {
      const result = vectorizeVField({
        snapshotId: request.snapshotId,
        generationId: request.generationId,
        width: cached.width,
        height: cached.height,
        field: cached.field,
        settings: request.settings,
      });

      // Yield before publishing so any already-queued message can advance the
      // generation and cooperatively cancel this result at a stage boundary.
      await yieldToWorkerQueue();
      if (latestGeneration.get(request.snapshotId) === request.generationId) {
        workerScope.postMessage({ type: "result", ...result });
      }
    } catch (error) {
      await yieldToWorkerQueue();
      if (latestGeneration.get(request.snapshotId) === request.generationId) {
        postError(request, errorMessage(error));
      }
    }
  }

  pumpRunning = false;
  if (pendingVectorize) void pumpVectorizeQueue();
}

function trimCache(): void {
  // Three Frozen Versions plus the current Working Snapshot.
  while (snapshotCache.size > 4) {
    const oldest = snapshotCache.keys().next().value as string | undefined;
    if (!oldest) break;
    snapshotCache.delete(oldest);
    latestGeneration.delete(oldest);
  }
}

function postError(
  request: Extract<VectorWorkerRequest, { type: "vectorize" }>,
  message: string,
): void {
  workerScope.postMessage({
    type: "error",
    snapshotId: request.snapshotId,
    generationId: request.generationId,
    message,
  });
}

function yieldToWorkerQueue(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Vectorization failed.";
}
