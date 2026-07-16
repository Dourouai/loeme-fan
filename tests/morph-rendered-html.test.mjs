import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname) {
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

test("server-renders the hidden Loeme Morph workspace without touching WebGPU", async () => {
  const response = await render("/apps/morph");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Morph — Organic Vector Lab · Loeme<\/title>/i);
  assert.match(html, /Morph application/);
  assert.match(html, />Grow</);
  assert.match(html, />Shape</);
  assert.match(html, />Export</);
  assert.match(html, />Cells</);
  assert.match(html, />Coral</);
  assert.match(html, />Maze</);
  assert.match(html, />Worms</);
  assert.match(html, /Freeze &amp; Shape/);
  assert.match(html, /Add Seed/);
  assert.match(html, /Frozen Versions/);
  assert.doesNotMatch(html, /ReferenceError|navigator is not defined|GPUTextureUsage is not defined/i);
});
