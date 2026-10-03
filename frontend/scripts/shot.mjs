// Deterministic page screenshots for agents and quick visual checks.
//
//   pnpm shot /               -> shots/home-mobile.png (375x812, default)
//   pnpm shot /dates-rates --desktop
//   pnpm shot / --width 768 --height 1024 --full --out shots/custom.png
//
// Waits for network idle, fonts, and every <img> to decode before shooting,
// so there are no blank or half-loaded frames. Uses the locally installed
// Google Chrome via playwright-core: no browser download step.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};
const route = args.find((a) => !a.startsWith("--") && a !== flagValue("--width") && a !== flagValue("--height") && a !== flagValue("--out") && a !== flagValue("--base")) ?? "/";

const desktop = flags.has("--desktop");
const width = Number(flagValue("--width") ?? (desktop ? 1440 : 375));
const height = Number(flagValue("--height") ?? (desktop ? 900 : 812));
const base = flagValue("--base") ?? "http://localhost:3000";
const url = route.startsWith("http") ? route : new URL(route, base).href;

const slug = (route === "/" ? "home" : route.replace(/^https?:\/\/[^/]+/, "").replace(/\W+/g, "-").replace(/^-|-$/g, "")) || "home";
const out =
  flagValue("--out") ?? path.join("shots", `${slug}-${desktop ? "desktop" : "mobile"}.png`);

const started = Date.now();
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
    ...(desktop ? {} : { isMobile: true, hasTouch: true }),
  });
  // Not "networkidle": dev servers hold hot-reload connections open forever.
  await page.goto(url, { waitUntil: "load", timeout: 30_000 });
  // Real "everything painted" signals instead of guessed sleeps.
  await page.evaluate(async (fullPage) => {
    await document.fonts.ready;
    const decodeVisibleImages = async () => {
      const visible = Array.from(document.images).filter((img) => {
        const r = img.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight && r.width > 0;
      });
      await Promise.race([
        Promise.allSettled(visible.map((img) => img.decode())),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
    };

    if (fullPage) {
      const originalScrollY = scrollY;
      const step = Math.max(Math.floor(innerHeight * 0.8), 1);
      for (
        let y = 0, count = 0;
        y < document.documentElement.scrollHeight && count < 100;
        y += step, count += 1
      ) {
        scrollTo(0, y);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await decodeVisibleImages();
      }
      scrollTo(0, originalScrollY);
    }

    await decodeVisibleImages();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, flags.has("--full"));
  mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: flags.has("--full") });
  console.log(`${out} (${width}x${height}${flags.has("--full") ? ", full page" : ""}) in ${((Date.now() - started) / 1000).toFixed(1)}s`);
} finally {
  await browser.close();
}
