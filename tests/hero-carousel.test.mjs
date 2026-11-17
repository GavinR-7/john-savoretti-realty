import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const input = readFileSync(new URL("../components/HeroCarousel.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(input, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

const listing = (id) => ({ id, mls: id, city: "Franklin Square", style: "Home",
  status: "For sale", dealType: "sale", price: 100_000, image: "" });

function mount(initial, reduced = false) {
  const slots = [], effects = [], pending = [], timers = new Map();
  const preference = { matches: reduced, addEventListener: (_, callback) => { preference.change = callback; },
    removeEventListener: () => {} };
  let cursor = 0, timerId = 0, output, listings = initial;
  const react = {
    useState(value) {
      const slot = cursor++;
      if (!(slot in slots)) slots[slot] = value;
      return [slots[slot], (update) => { slots[slot] = typeof update === "function" ? update(slots[slot]) : update; }];
    },
    useEffect(effect, dependencies) {
      const slot = cursor++;
      const previous = effects[slot];
      if (!previous || dependencies.some((item, index) => !Object.is(item, previous.dependencies[index]))) {
        pending.push(() => {
          previous?.cleanup?.();
          effects[slot] = { dependencies, cleanup: effect() };
        });
      }
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    window: { matchMedia: () => preference },
    setInterval: (callback) => { timers.set(++timerId, callback); return timerId; },
    clearInterval: (id) => { timers.delete(id); },
    require: (name) => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return require("react/jsx-runtime");
      if (name === "@/data/listings") return { formatPrice: (price) => String(price) };
      if (name === "@/components/PropertyImage") return { __esModule: true, default: "img" };
      if (name === "next/link") return { __esModule: true, default: "a" };
      throw new Error("Unexpected dependency: " + name);
    },
  });
  const render = (next = listings) => {
    listings = next;
    cursor = 0;
    output = module.exports.default({ listings });
    for (const effect of pending.splice(0)) effect();
    return output;
  };
  render();
  render();
  return {
    render, get output() { return output; }, timers,
    tick() { for (const callback of [...timers.values()]) callback(); render(); },
    motion(matches) { preference.matches = matches; preference.change(); render(); },
  };
}

function elements(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(elements);
  return [value, ...elements(value.props?.children)];
}
const byLabel = (app, label) => elements(app.output).find(node => node.props?.["aria-label"] === label);
const transform = app => elements(app.output).find(node => node.props?.style?.transform)?.props.style.transform;
const playButton = app => elements(app.output).find(node => node.type === "button" && /slideshow/.test(node.props.children));

test("empty and single-listing carousels never schedule automatic movement", () => {
  const empty = mount([]);
  assert.equal(empty.output, null);
  assert.equal(empty.timers.size, 0);
  const single = mount([listing("1")]);
  assert.equal(single.timers.size, 0);
  assert.equal(elements(single.output).filter(node => node.type === "a").length, 1);
  assert.equal(elements(single.output).filter(node => node.type === "button").length, 0);
  assert.equal(transform(single), "translateX(-0%)");
});

test("automatic movement wraps through visible listings", () => {
  const app = mount([listing("1"), listing("2")]);
  assert.equal(app.timers.size, 1);
  app.tick();
  assert.equal(transform(app), "translateX(-100%)");
  app.tick();
  assert.equal(transform(app), "translateX(-0%)");
});

test("manual arrow navigation keeps automatic movement paused", () => {
  const app = mount([listing("1"), listing("2")]);
  byLabel(app, "Previous listing").props.onClick();
  app.render();
  assert.equal(transform(app), "translateX(-100%)");
  assert.equal(app.timers.size, 0);
  byLabel(app, "Next listing").props.onClick();
  app.render();
  assert.equal(transform(app), "translateX(-0%)");
  assert.equal(app.timers.size, 0);
});

test("hover and keyboard focus pause until they leave the carousel", () => {
  const app = mount([listing("1"), listing("2")]);
  app.output.props.onMouseEnter();
  app.render();
  assert.equal(app.timers.size, 0);
  app.output.props.onMouseLeave();
  app.render();
  assert.equal(app.timers.size, 1);
  app.output.props.onFocusCapture();
  app.render();
  assert.equal(app.timers.size, 0);
  app.output.props.onBlurCapture({ currentTarget: { contains: () => false }, relatedTarget: null });
  app.render();
  assert.equal(app.timers.size, 1);
});

test("reduced-motion preferences stop movement and retain manual arrows", () => {
  const app = mount([listing("1"), listing("2")], true);
  assert.equal(app.timers.size, 0);
  assert.ok(byLabel(app, "Next listing"));
  app.motion(false);
  assert.equal(app.timers.size, 1);
  app.motion(true);
  assert.equal(app.timers.size, 0);
});

test("pause control stops and resumes the slideshow", () => {
  const app = mount([listing("1"), listing("2")]);
  assert.equal(playButton(app).props.children, "Pause slideshow");
  playButton(app).props.onClick();
  app.render();
  assert.equal(playButton(app).props.children, "Play slideshow");
  assert.equal(app.timers.size, 0);
  playButton(app).props.onClick();
  app.render();
  assert.equal(app.timers.size, 1);
});

test("a listing refresh can shrink or empty the carousel without an invalid index", () => {
  const app = mount([listing("1"), listing("2"), listing("3")]);
  app.tick();
  app.tick();
  assert.equal(transform(app), "translateX(-200%)");
  app.render([listing("1")]);
  assert.equal(transform(app), "translateX(-0%)");
  assert.equal(app.timers.size, 0);
  app.render([]);
  assert.equal(app.output, null);
  assert.equal(app.timers.size, 0);
});
