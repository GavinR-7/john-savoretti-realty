import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const input = readFileSync(new URL("../components/PropertyImage.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(input, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

test("one failed gallery photo cannot hide a later photo", () => {
  let failedSrc;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require(name) {
      if (name === "react") return { useState: () => [failedSrc, (value) => { failedSrc = value; }] };
      if (name === "react/jsx-runtime") return require("react/jsx-runtime");
      if (name === "next/image") return { __esModule: true, default: "img" };
      throw new Error("Unexpected dependency: " + name);
    },
  });
  const render = (src) => module.exports.default({ src, alt: "Property photo" });
  const first = render("https://images.example/first.webp");
  assert.equal(first.type, "img");
  first.props.onError();
  assert.equal(render("https://images.example/first.webp").props.role, "img");
  const next = render("https://images.example/next.webp");
  assert.equal(next.type, "img");
  assert.equal(next.props.src, "https://images.example/next.webp");
  assert.equal(render(undefined).props.role, "img");
});
