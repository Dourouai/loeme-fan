import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(pathname = "/apps/motif") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
      redirect: "manual",
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Loeme Motif workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Motif — Parametric Vector Studio · Loeme<\/title>/i);
  assert.match(html, /Loeme/);
  assert.match(html, /Arrangement Preview/);
  assert.match(html, /Node outputs/);
  assert.match(html, /Compose/);
  assert.match(html, /Click a node to inspect its output/);
  assert.match(html, /How should motifs fill the canvas/);
  assert.match(html, /exact motif set produced by the previous node/);
  assert.match(html, /Explore 3/);
  assert.match(html, /Packed/);
  assert.match(html, /placed/);
  assert.match(html, /Starter/);
  assert.match(html, /Export Final SVG/);
  assert.match(html, /CURRENT STEP/);
  assert.match(html, /Current step/);
  assert.match(html, /Final/);
  assert.match(html, /Surface/);
  assert.doesNotMatch(html, /Continue to/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("root route renders the Loeme tools homepage", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Tools for/);
  assert.match(html, /living/);
  assert.match(html, /We design the conditions/);
  assert.match(html, /Motif/);
  assert.match(html, /Morph/);
  assert.doesNotMatch(html, />Flow</);
  assert.match(html, /CREATIVE SYSTEMS/);
  assert.match(html, /ADVERTISEMENT/);
  assert.match(html, /Explore products/);
  assert.match(html, /href="\/apps\/motif"/);
  assert.match(html, /href="\/apps\/morph"/);
});

test("removes the disposable starter and uses product metadata", async () => {
  const [layout, packageJson, motifCss, studioSource, engineSource, homeCss, dustworksCss] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/apps/motif/motif.css", import.meta.url), "utf8"),
    readFile(new URL("../app/apps/motif/MotifStudio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/apps/motif/motif-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/home.css", import.meta.url), "utf8"),
    readFile(new URL("../app/apps/dustworks/dustworks.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Tools for living systems/);
  assert.match(layout, /lang="zh-CN"/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(motifCss, /grid-template-columns:\s*auto minmax\(190px, 1fr\) auto auto/);
  assert.match(motifCss, /height:\s*calc\(100vh - 64px\)/);
  assert.match(studioSource, /Replace selected/);
  assert.match(studioSource, /filter\(\(id\) => !resolvedComposeIds\.includes\(id\)\)/);
  assert.match(studioSource, /previewMode/);
  assert.match(studioSource, /currentNode/);
  assert.doesNotMatch(studioSource, /viewedNode/);
  assert.match(studioSource, /colorizeInstances\(layoutInstances, palette\.colors\)/);
  assert.match(studioSource, /GRID OFFSET/);
  assert.match(studioSource, /ASSIGNMENT/);
  assert.match(studioSource, /capacity-limited/);
  assert.match(engineSource, /surfaceMode: SurfaceMode/);
  assert.match(engineSource, /__LOEME_SLOT_/);
  assert.match(engineSource, /collisionRadius/);
  assert.match(engineSource, /class SpatialHash/);
  assert.match(engineSource, /organicStrategy === "dense"/);
  assert.match(engineSource, /gridAssignment === "weighted"/);
  assert.match(engineSource, /capacity-limited/);
  assert.doesNotMatch(engineSource, /attempt > 36/);
  assert.doesNotMatch(engineSource, /outputMode:/);
  assert.match(homeCss, /overflow-x:\s*clip/);
  assert.doesNotMatch(dustworksCss, /html\s*,\s*body\s*\{[^}]*overflow:\s*hidden/);
  assert.match(dustworksCss, /\.dustworks-shell\s*\{[^}]*overflow:\s*hidden/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", templateRoot)));
});
