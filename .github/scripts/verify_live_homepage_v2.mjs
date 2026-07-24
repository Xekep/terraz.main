import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const expectedAssetsVersion = "20260725-4";
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
    const hostStyle = host ? getComputedStyle(host) : null;
    const svgStyle = svg ? getComputedStyle(svg) : null;
    const paths = Array.from(svg?.querySelectorAll(".logo-stroke") ?? []).map((path, index) => {
      const style = getComputedStyle(path);
      const animation = path.getAnimations().find((item) => item.id === `terraz-logo-write-${index}`);
      const timing = animation?.effect?.getTiming() ?? {};
      const length = Number.parseFloat(path.dataset.logoLength ?? "NaN");
      return {
        index,
        order: Number(path.dataset.logoOrder ?? -1),
        length,
        dashOffset: Number.parseFloat(style.strokeDashoffset ?? "NaN"),
        dashArray: Number.parseFloat(style.strokeDasharray ?? "NaN"),
        fill: style.fill,
        fillOpacity: Number.parseFloat(style.fillOpacity ?? "0"),
        stroke: style.stroke,
        strokeWidth: Number.parseFloat(style.strokeWidth ?? "NaN"),
        transitionProperty: style.transitionProperty,
        pathFilter: style.filter,
        animation: animation ? {
          id: animation.id,
          playbackRate: animation.playbackRate,
          playState: animation.playState,
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
      svgExists: Boolean(svg),
      strokeCount: Number(host?.dataset.strokeCount ?? 0),
      pathLength: Number.parseFloat(host?.dataset.pathLength ?? "NaN"),
      hostBackground: hostStyle?.backgroundColor ?? "",
      hostFilter: hostStyle?.filter ?? "none",
      svgBackground: svgStyle?.backgroundColor ?? "",
      paths,
    };
  });
}

function assertSequentialTiming(paths) {
  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    if (
      path.index !== index || path.order !== index || !path.animation ||
      path.animation.id !== `terraz-logo-write-${index}` ||
      path.animation.direction !== "normal" || path.animation.iterations !== 1 ||
      path.animation.playbackRate <= 0 || path.animation.duration <= 0
    ) {
      throw new Error(`Logo stroke ${index} is not a single forward animation: ${JSON.stringify(path)}`);
    }
    if (index > 0) {
      const previous = paths[index - 1].animation;
      if (path.animation.delay < previous.delay + previous.duration - 1) {
        throw new Error(`Logo strokes overlap instead of drawing sequentially: ${JSON.stringify(paths.map((item) => item.animation))}`);
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
    !start.hostExists || start.objectExists || !start.svgExists || start.strokeCount !== 7 || start.paths.length !== 7 ||
    !Number.isFinite(start.pathLength) || start.pathLength < 400 ||
    !isTransparentColor(start.hostBackground) || !isTransparentColor(start.svgBackground) || start.hostFilter !== "none"
  ) {
    throw new Error(`Single-pass logo structure is invalid: ${JSON.stringify(start)}`);
  }

  assertSequentialTiming(start.paths);

  for (const path of start.paths) {
    if (
      !Number.isFinite(path.length) || path.length <= 10 || !Number.isFinite(path.dashArray) ||
      !Number.isFinite(path.dashOffset) || path.dashOffset < path.length * 0.8 ||
      path.fill !== "none" || path.fillOpacity > 0.001 || path.stroke !== "rgb(255, 255, 255)" ||
      !Number.isFinite(path.strokeWidth) || path.strokeWidth < 0.9 || path.strokeWidth > 1.3 ||
      path.transitionProperty !== "none" || path.pathFilter !== "none"
    ) {
      throw new Error(`Logo stroke does not start hidden and thin: ${JSON.stringify(path)}`);
    }
  }

  const middleMoving = middle.paths.filter((path) => path.dashOffset > 2 && path.dashOffset < path.length * 0.98);
  if (middleMoving.length > 1) {
    throw new Error(`More than one logo stroke moves at once: ${JSON.stringify(middle.paths)}`);
  }

  const middleStates = middle.paths.map((path) => path.dashOffset <= 2 ? "done" : path.dashOffset >= path.length * 0.98 ? "waiting" : "drawing");
  const stateRank = { done: 0, drawing: 1, waiting: 2 };
  if (middleStates.some((state, index) => index > 0 && stateRank[state] < stateRank[middleStates[index - 1]])) {
    throw new Error(`Logo stroke order moved backwards: ${JSON.stringify(middleStates)}`);
  }

  for (const path of end.paths) {
    if (path.dashOffset > 2 || path.fill !== "none" || path.stroke !== "rgb(255, 255, 255)") {
      throw new Error(`Logo stroke did not finish once in place: ${JSON.stringify(path)}`);
    }
  }

  return { start, middle, end, middleStates };
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

  const videoAndControls = await page.evaluate(() => {
    const video = document.querySelector("#hero-video-element");
    const videoStyle = video ? getComputedStyle(video) : null;
    const matrix = videoStyle?.transform && videoStyle.transform !== "none" ? new DOMMatrixReadOnly(videoStyle.transform) : null;
    const pause = document.querySelector("#video-pause");
    const volume = document.querySelector("#video-volume");
    const rect = pause?.getBoundingClientRect();
    return {
      videoScaleX: matrix?.a ?? 0,
      videoScaleY: matrix?.d ?? 0,
      objectFit: videoStyle?.objectFit ?? "",
      pauseWidth: rect?.width ?? 0,
      pauseState: pause?.dataset.state ?? "",
      volumeState: volume?.dataset.muted ?? "",
      pauseSvg: Boolean(pause?.querySelector("svg")),
      speakerSvg: Boolean(volume?.querySelector(".video-control__speaker")),
    };
  });
  if (
    videoAndControls.videoScaleX < 1.19 || videoAndControls.videoScaleX > 1.21 ||
    videoAndControls.videoScaleY < 1.19 || videoAndControls.videoScaleY > 1.21 ||
    videoAndControls.objectFit !== "cover" || videoAndControls.pauseWidth < 30 ||
    videoAndControls.pauseWidth > 34 || videoAndControls.pauseState !== "playing" ||
    videoAndControls.volumeState !== "true" || !videoAndControls.pauseSvg || !videoAndControls.speakerSvg
  ) {
    throw new Error(`Video zoom or controls are invalid: ${JSON.stringify(videoAndControls)}`);
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();
  return { reducedMotion, logo, entrances, copy, videoAndControls, consoleErrors };
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
