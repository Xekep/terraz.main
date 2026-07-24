import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const expectedAssetsVersion = "20260724-9";
const expectedVideoUrl = "https://d.terraz.ru/static/Eye_of_Cthulhu_By_Cupquake_Terraria_Speed_Art.mp4";
const report = { modes: {}, error: null };
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--autoplay-policy=no-user-gesture-required"],
});

async function openPublished(page, mode) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const url = new URL(liveUrl);
    url.searchParams.set("browser_probe", `${runId}-${mode}-${attempt}`);
    const response = await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const version = await page.$eval('meta[name="terraz-assets"]', (node) => node.content).catch(() => null);
    if (response?.ok() && version === expectedAssetsVersion) return;
    await delay(2_000);
  }
  throw new Error(`Live homepage did not publish assets ${expectedAssetsVersion}`);
}

async function readLogoState(page) {
  return page.evaluate(() => {
    const object = document.querySelector("#hero-logo-object");
    const path = object?.contentDocument?.querySelector(".title-letter");
    const style = path ? getComputedStyle(path) : null;
    const animations = path?.getAnimations().map((animation) => ({
      id: animation.id,
      currentTime: Number(animation.currentTime ?? -1),
      playState: animation.playState,
    })) ?? [];

    return {
      objectExists: Boolean(object),
      ready: object?.dataset.drawingReady === "true",
      pathExists: Boolean(path),
      pathLength: Number.parseFloat(object?.dataset.pathLength ?? "NaN"),
      dashOffset: Number.parseFloat(style?.strokeDashoffset ?? "NaN"),
      dashArray: Number.parseFloat(style?.strokeDasharray ?? "NaN"),
      fillOpacity: Number.parseFloat(style?.fillOpacity ?? "0"),
      animations,
    };
  });
}

async function verifyLogoDrawing(page) {
  await page.waitForFunction(() => document.querySelector("#hero-logo-object")?.dataset.drawingReady === "true", { timeout: 15_000 });
  const start = await readLogoState(page);
  await delay(700);
  const middle = await readLogoState(page);
  await delay(3_500);
  const end = await readLogoState(page);

  const hasDrawingAnimation = start.animations.some((animation) => animation.id === "terraz-logo-write");
  if (
    !start.objectExists || !start.pathExists || !hasDrawingAnimation ||
    !Number.isFinite(start.pathLength) || start.pathLength < 1000 ||
    !Number.isFinite(start.dashArray) || !Number.isFinite(start.dashOffset) ||
    !Number.isFinite(middle.dashOffset) || middle.dashOffset >= start.dashOffset ||
    end.dashOffset > 2 || end.fillOpacity < 0.1
  ) {
    throw new Error(`Logo path is not genuinely drawn: ${JSON.stringify({ start, middle, end })}`);
  }
  return { start, middle, end };
}

async function verifyMode(mode, reducedMotion, screenshotPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }

  const consoleErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await openPublished(page, mode);
  const logo = await verifyLogoDrawing(page);

  const entrances = await page.evaluate(() => [".hero__message", ".server-actions", ".social-links", ".portal-link"].map((selector) => {
    const node = document.querySelector(selector);
    const style = node ? getComputedStyle(node) : null;
    return { selector, exists: Boolean(node), animationName: style?.animationName ?? "none", duration: style?.animationDuration ?? "0s" };
  }));
  if (entrances.some((item) => !item.exists || item.animationName === "none" || Number.parseFloat(item.duration) < 0.4)) {
    throw new Error(`Entrance animations are missing: ${JSON.stringify(entrances)}`);
  }

  await page.click("#server-copy");
  await page.waitForFunction(() => document.querySelector("#copy-status")?.classList.contains("is-visible"), { timeout: 5_000 });
  await page.waitForFunction(() => {
    const status = document.querySelector("#copy-status");
    return status && Number(getComputedStyle(status).opacity) > 0.1;
  }, { timeout: 2_000 });
  const copy = await page.$eval("#copy-status", (node) => {
    const style = getComputedStyle(node);
    return { text: node.textContent.trim(), animationName: style.animationName, duration: style.animationDuration, opacity: Number(style.opacity) };
  });
  if (copy.text !== "Скопировано" || copy.animationName !== "copy-fade" || Number.parseFloat(copy.duration) < 1.5 || copy.opacity <= 0.1) {
    throw new Error(`Copy animation is invalid: ${JSON.stringify(copy)}`);
  }

  await page.waitForFunction((source) => {
    const video = document.querySelector("#hero-video-element");
    return video?.currentSrc === source && video.readyState >= 2 && video.currentTime >= 11.5 && !video.paused;
  }, { timeout: 30_000 }, expectedVideoUrl);

  const controls = await page.evaluate(() => {
    const pause = document.querySelector("#video-pause");
    const volume = document.querySelector("#video-volume");
    const rect = pause?.getBoundingClientRect();
    return {
      pauseWidth: rect?.width ?? 0,
      pauseState: pause?.dataset.state ?? "",
      volumeState: volume?.dataset.muted ?? "",
      pauseSvg: Boolean(pause?.querySelector("svg")),
      speakerSvg: Boolean(volume?.querySelector(".video-control__speaker")),
    };
  });
  if (controls.pauseWidth < 30 || controls.pauseWidth > 34 || controls.pauseState !== "playing" || controls.volumeState !== "true" || !controls.pauseSvg || !controls.speakerSvg) {
    throw new Error(`Video controls are invalid: ${JSON.stringify(controls)}`);
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();
  return { reducedMotion, logo, entrances, copy, controls, consoleErrors };
}

try {
  report.modes.desktop = await verifyMode("desktop", false, "live-homepage.png");
  report.modes.reducedMotion = await verifyMode("reduced-motion", true, "live-homepage-reduced-motion.png");
  fs.writeFileSync("live-homepage-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.error = error instanceof Error ? error.stack || error.message : String(error);
  fs.writeFileSync("live-homepage-report.json", JSON.stringify(report, null, 2));
  throw error;
} finally {
  await browser.close();
}
