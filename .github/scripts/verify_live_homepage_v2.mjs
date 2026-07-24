import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const expectedAssetsVersion = "20260725-5";
const expectedVideoUrl = "https://d.terraz.ru/static/Eye_of_Cthulhu_By_Cupquake_Terraria_Speed_Art.mp4";
const report = { modes: {}, error: null };
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--autoplay-policy=no-user-gesture-required"],
});

function isTransparentColor(value) {
  return value === "transparent" || value === "rgba(0, 0, 0, 0)";
}

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
    const host = document.querySelector("#hero-logo");
    const svg = host?.querySelector("svg.hero__logo-svg");
    const finalPath = svg?.querySelector(".title-letter");
    const finalStyle = finalPath ? getComputedStyle(finalPath) : null;
    const hostStyle = host ? getComputedStyle(host) : null;
    const svgStyle = svg ? getComputedStyle(svg) : null;
    const revealPaths = Array.from(svg?.querySelectorAll(".logo-reveal-stroke") ?? []).map((path, index) => {
      const style = getComputedStyle(path);
      const animation = path.getAnimations().find((item) => item.id === `terraz-logo-reveal-${index}`);
      const timing = animation?.effect?.getTiming() ?? {};
      const length = Number.parseFloat(path.dataset.logoLength ?? "NaN");
      return {
        index,
        order: Number(path.dataset.logoOrder ?? -1),
        length,
        dashOffset: Number.parseFloat(style.strokeDashoffset ?? "NaN"),
        dashArray: Number.parseFloat(style.strokeDasharray ?? "NaN"),
        stroke: style.stroke,
        strokeWidth: Number.parseFloat(style.strokeWidth ?? "NaN"),
        animation: animation ? {
          id: animation.id,
          playbackRate: animation.playbackRate,
          delay: Number(timing.delay ?? 0),
          duration: Number(timing.duration ?? 0),
          direction: timing.direction ?? "",
          iterations: Number(timing.iterations ?? 0),
        } : null,
      };
    });

    return {
      hostExists: Boolean(host),
      objectExists: Boolean(document.querySelector("#hero-logo-object, .hero__logo object")),
      ready: host?.dataset.drawingReady === "true",
      logoMode: host?.dataset.logoMode ?? "",
      svgExists: Boolean(svg),
      viewBox: svg?.getAttribute("viewBox") ?? "",
      finalPathExists: Boolean(finalPath),
      finalPathAnimationCount: finalPath?.getAnimations().length ?? -1,
      finalMask: finalPath?.getAttribute("mask") ?? "",
      finalFill: finalStyle?.fill ?? "",
      finalStroke: finalStyle?.stroke ?? "",
      finalStrokeWidth: Number.parseFloat(finalStyle?.strokeWidth ?? "NaN"),
      finalFilter: finalStyle?.filter ?? "none",
      strokeCount: Number(host?.dataset.strokeCount ?? 0),
      pathLength: Number.parseFloat(host?.dataset.pathLength ?? "NaN"),
      hostBackground: hostStyle?.backgroundColor ?? "",
      hostFilter: hostStyle?.filter ?? "none",
      svgBackground: svgStyle?.backgroundColor ?? "",
      maskExists: Boolean(svg?.querySelector("#terraz-logo-reveal-mask")),
      revealPaths,
    };
  });
}

function assertSequentialTiming(paths) {
  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    if (
      path.index !== index || path.order !== index || !path.animation ||
      path.animation.id !== `terraz-logo-reveal-${index}` ||
      path.animation.direction !== "normal" || path.animation.iterations !== 1 ||
      path.animation.playbackRate <= 0 || path.animation.duration <= 0
    ) {
      throw new Error(`Reveal stroke ${index} is not a single forward animation: ${JSON.stringify(path)}`);
    }
    if (index > 0) {
      const previous = paths[index - 1].animation;
      if (path.animation.delay < previous.delay + previous.duration - 1) {
        throw new Error(`Reveal strokes overlap: ${JSON.stringify(paths.map((item) => item.animation))}`);
      }
    }
  }
}

async function verifyLogoDrawing(page) {
  await page.waitForFunction(() => document.querySelector("#hero-logo")?.dataset.drawingReady === "true", { timeout: 15_000 });
  const start = await readLogoState(page);
  await delay(1_800);
  const middle = await readLogoState(page);
  await delay(3_100);
  const end = await readLogoState(page);

  if (
    !start.hostExists || start.objectExists || !start.svgExists || !start.finalPathExists || !start.maskExists ||
    start.logoMode !== "masked-original" || start.viewBox !== "0 0 255 150" || start.finalPathAnimationCount !== 0 ||
    !start.finalMask.includes("terraz-logo-reveal-mask") || start.strokeCount !== 7 || start.revealPaths.length !== 7 ||
    !Number.isFinite(start.pathLength) || start.pathLength < 300 ||
    start.finalFill !== "none" || start.finalStroke !== "rgb(255, 255, 255)" ||
    !Number.isFinite(start.finalStrokeWidth) || start.finalStrokeWidth < 0.9 || start.finalStrokeWidth > 1.3 ||
    start.finalFilter !== "none" || !isTransparentColor(start.hostBackground) ||
    !isTransparentColor(start.svgBackground) || start.hostFilter !== "none"
  ) {
    throw new Error(`Masked original logo structure is invalid: ${JSON.stringify(start)}`);
  }

  assertSequentialTiming(start.revealPaths);
  for (const path of start.revealPaths) {
    if (
      !Number.isFinite(path.length) || path.length <= 10 || !Number.isFinite(path.dashArray) ||
      !Number.isFinite(path.dashOffset) || path.dashOffset < path.length * 0.65 ||
      path.stroke !== "rgb(255, 255, 255)" || !Number.isFinite(path.strokeWidth) ||
      path.strokeWidth < 17 || path.strokeWidth > 19
    ) {
      throw new Error(`Reveal stroke does not start hidden: ${JSON.stringify(path)}`);
    }
  }

  const moving = middle.revealPaths.filter((path) => path.dashOffset > 2 && path.dashOffset < path.length * 0.98);
  if (moving.length > 1) {
    throw new Error(`More than one reveal stroke moves at once: ${JSON.stringify(middle.revealPaths)}`);
  }
  const states = middle.revealPaths.map((path) => path.dashOffset <= 2 ? "done" : path.dashOffset >= path.length * 0.98 ? "waiting" : "drawing");
  const rank = { done: 0, drawing: 1, waiting: 2 };
  if (states.some((state, index) => index > 0 && rank[state] < rank[states[index - 1]])) {
    throw new Error(`Reveal order moved backwards: ${JSON.stringify(states)}`);
  }
  if (end.revealPaths.some((path) => path.dashOffset > 2)) {
    throw new Error(`Reveal did not finish in one pass: ${JSON.stringify(end.revealPaths)}`);
  }

  return { start, middle, end, states };
}

async function verifyMode({ mode, reducedMotion = false, mobile = false, expectedScale, screenshotPath }) {
  const page = await browser.newPage();
  await page.setViewport(mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }

  const consoleErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await openPublished(page, mode);
  const logo = await verifyLogoDrawing(page);

  await page.click("#server-copy");
  await page.waitForFunction(() => {
    const status = document.querySelector("#copy-status");
    return status?.classList.contains("is-visible") && Number(getComputedStyle(status).opacity) > 0.1;
  }, { timeout: 5_000 });

  await page.waitForFunction((source) => {
    const video = document.querySelector("#hero-video-element");
    return video?.currentSrc === source && video.readyState >= 2 && video.currentTime >= 11.5 && !video.paused;
  }, { timeout: 30_000 }, expectedVideoUrl);

  const videoAndControls = await page.evaluate(() => {
    const video = document.querySelector("#hero-video-element");
    const style = video ? getComputedStyle(video) : null;
    const matrix = style?.transform && style.transform !== "none" ? new DOMMatrixReadOnly(style.transform) : null;
    const pause = document.querySelector("#video-pause");
    const volume = document.querySelector("#video-volume");
    return {
      scaleX: matrix?.a ?? 0,
      scaleY: matrix?.d ?? 0,
      objectFit: style?.objectFit ?? "",
      pauseWidth: pause?.getBoundingClientRect().width ?? 0,
      pauseState: pause?.dataset.state ?? "",
      volumeState: volume?.dataset.muted ?? "",
    };
  });
  if (
    Math.abs(videoAndControls.scaleX - expectedScale) > 0.02 ||
    Math.abs(videoAndControls.scaleY - expectedScale) > 0.02 ||
    videoAndControls.objectFit !== "cover" || videoAndControls.pauseWidth < 30 ||
    videoAndControls.pauseWidth > 34 || videoAndControls.pauseState !== "playing" ||
    videoAndControls.volumeState !== "true"
  ) {
    throw new Error(`Video scale or controls are invalid for ${mode}: ${JSON.stringify(videoAndControls)}`);
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();
  return { reducedMotion, mobile, expectedScale, logo, videoAndControls, consoleErrors };
}

try {
  report.modes.desktop = await verifyMode({ mode: "desktop", expectedScale: 1.2, screenshotPath: "live-homepage.png" });
  report.modes.reducedMotion = await verifyMode({ mode: "reduced-motion", reducedMotion: true, expectedScale: 1.2, screenshotPath: "live-homepage-reduced-motion.png" });
  report.modes.mobile = await verifyMode({ mode: "mobile", mobile: true, expectedScale: 1, screenshotPath: "live-homepage-mobile.png" });
  fs.writeFileSync("live-homepage-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.error = error instanceof Error ? error.stack || error.message : String(error);
  fs.writeFileSync("live-homepage-report.json", JSON.stringify(report, null, 2));
  throw error;
} finally {
  await browser.close();
}
