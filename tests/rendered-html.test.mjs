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
  assert.match(html, /Vector flow/);
  assert.match(html, /Compose/);
  assert.match(html, /5-step recipe/);
  assert.match(html, /How should motifs fill the canvas/);
  assert.match(html, /New variation/);
  assert.match(html, /Starter/);
  assert.match(html, /Export SVG/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("root route points to the Motif app", async () => {
  const response = await render("/");
  assert.ok([301, 302, 303, 307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, "/apps/motif");
});

test("removes the disposable starter and uses product metadata", async () => {
  const [layout, packageJson, motifCss] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/apps/motif/motif.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Loeme Motif/);
  assert.match(layout, /lang="zh-CN"/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(motifCss, /grid-template-columns:\s*auto minmax\(190px, 1fr\) auto auto/);
  assert.match(motifCss, /height:\s*calc\(100vh - 64px\)/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", templateRoot)));
});
