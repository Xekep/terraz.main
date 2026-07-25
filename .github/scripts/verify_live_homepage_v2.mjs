import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const expectedAssetsVersion = "20260725-8";
const expectedVideoUrl = "https://d.terraz.ru/static/Eye_of_Cthulhu_By_Cupquake_Terraria_Speed_Art.mp4";
const expectedLoopStart = 12;
const expectedLoopEnd = 210;
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
    const finalGroup = svg?.querySelector(".logo-final-shape");
    const finalPath = finalGroup?.querySelector(".title-letter");
    const finalStyle = finalPath ? getComputedStyle(finalPath) : null;
    const hostStyle = host ? getComputedStyle(host) : null;
    const svgStyle = svg ? getComputedStyle(svg) : null;
    const revealPaths = Array.from(svg?.querySelectorAll(".logo-reveal-stroke") ?? []).map((path) => {
      const style = getComputedStyle(path);
      const animation = path.getAnimations().find((item) => item.id === "terraz-logo-reveal");
      const timing = animation?.effect?.getTiming() ?? {};
      const length = Number.parseFloat(path.dataset.logoLength ?? "NaN");
      return {
        length,
        dashOffset: Number.parseFloat(style.strokeDashoffset ?? "NaN"),
        dashArray: Number.parseFloat(style.strokeDasharray ?? "NaN"),
        stroke: style.stroke,
        strokeWidth: Number.parseFloat(style.strokeWidth ?? "NaN"),
        transform: path.getAttribute("transform") ?? "",
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
      finalGroupExists: Boolean(finalGroup),
      finalPathExists: Boolean(finalPath),
      finalPathAnimationCount: finalPath?.getAnimations().length ?? -1,
      finalGroupMask: finalGroup?.getAttribute("mask") ?? "",
      finalPathMask: finalPath?.getAttribute("mask") ?? "",
      finalTransform: finalPath?.getAttribute("transform") ?? "",
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

async function countVisibleLogoPixels(page, unmasked) {
  return page.evaluate(async (removeMask) => {
    const svg = document.querySelector("#hero-logo svg.hero__logo-svg");
    if (!svg) return { count: 0, width: 0, height: 0 };

    const clone = svg.cloneNode(true);
    clone.setAttribute("width", "510");
    clone.setAttribute("height", "300");
    const sourcePath = svg.querySelector(".logo-reveal-stroke");
    const clonePath = clone.querySelector(".logo-reveal-stroke");
    if (sourcePath && clonePath) {
      const style = getComputedStyle(sourcePath);
      clonePath.style.strokeDasharray = style.strokeDasharray;
      clonePath.style.strokeDashoffset = style.strokeDashoffset;
    }
    if (removeMask) {
      clone.querySelector(".logo-final-shape")?.removeAttribute("mask");
    }

    const markup = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 510;
      canvas.height = 300;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (pixels[offset + 3] < 32 || Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) < 140) continue;
        const pixel = offset / 4;
        const x = pixel % canvas.width;
        const y = Math.floor(pixel / canvas.width);
        count += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
      return {
        count,
        width: maxX >= minX ? maxX - minX + 1 : 0,
        height: maxY >= minY ? maxY - minY + 1 : 0,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }, unmasked);
}

async function verifyLogoDrawing(page) {
  await page.waitForFunction(() => document.querySelector("#hero-logo")?.dataset.drawingReady === "true", { timeout: 15_000 });
  const start = await readLogoState(page);
  await delay(1_800);
  const middle = await readLogoState(page);
  await delay(3_100);
  const end = await readLogoState(page);
  const renderedPixels = await countVisibleLogoPixels(page, false);
  const fullPixels = await countVisibleLogoPixels(page, true);
  const coverage = fullPixels.count > 0 ? renderedPixels.count / fullPixels.count : 0;

  if (
    !start.hostExists || start.objectExists || !start.svgExists || !start.finalGroupExists ||
    !start.finalPathExists || !start.maskExists || start.logoMode !== "masked-original" ||
    start.viewBox !== "0 0 255 150" || start.finalPathAnimationCount !== 0 ||
    !start.finalGroupMask.includes("terraz-logo-reveal-mask") || start.finalPathMask !== "" ||
    start.strokeCount !== 1 || start.revealPaths.length !== 1 ||
    !Number.isFinite(start.pathLength) || start.pathLength < 2000 ||
    start.finalTransform !== start.revealPaths[0]?.transform ||
    start.finalFill !== "none" || start.finalStroke !== "rgb(255, 255, 255)" ||
    !Number.isFinite(start.finalStrokeWidth) || start.finalStrokeWidth < 0.9 || start.finalStrokeWidth > 1.3 ||
    start.finalFilter !== "none" || !isTransparentColor(start.hostBackground) ||
    !isTransparentColor(start.svgBackground) || start.hostFilter !== "none"
  ) {
    throw new Error(`Exact masked logo structure is invalid: ${JSON.stringify(start)}`);
  }

  const reveal = start.revealPaths[0];
  if (
    !reveal.animation || reveal.animation.id !== "terraz-logo-reveal" ||
    reveal.animation.direction !== "normal" || reveal.animation.iterations !== 1 ||
    reveal.animation.playbackRate <= 0 || reveal.animation.duration < 4000 ||
    !Number.isFinite(reveal.length) || !Number.isFinite(reveal.dashArray) ||
    !Number.isFinite(reveal.dashOffset) || reveal.dashOffset < reveal.length * 0.8 ||
    reveal.stroke !== "rgb(255, 255, 255)" || !Number.isFinite(reveal.strokeWidth) ||
    reveal.strokeWidth < 7.5 || reveal.strokeWidth > 8.5
  ) {
    throw new Error(`Exact reveal brush is invalid: ${JSON.stringify(reveal)}`);
  }

  const middleOffset = middle.revealPaths[0]?.dashOffset;
  if (!Number.isFinite(middleOffset) || middleOffset >= reveal.dashOffset || middleOffset <= 2) {
    throw new Error(`Reveal brush is not moving forward: ${JSON.stringify({ start: reveal, middle: middle.revealPaths[0] })}`);
  }
  if (end.revealPaths[0]?.dashOffset > 2) {
    throw new Error(`Reveal brush did not finish: ${JSON.stringify(end.revealPaths[0])}`);
  }
  if (
    fullPixels.count < 200 || renderedPixels.count < 200 || coverage < 0.95 ||
    renderedPixels.width < fullPixels.width * 0.95 || renderedPixels.height < fullPixels.height * 0.95
  ) {
    throw new Error(`Completed mask does not reveal the full original logo: ${JSON.stringify({ renderedPixels, fullPixels, coverage })}`);
  }

  return { start, middle, end, renderedPixels, fullPixels, coverage };
}

async function verifyVideoLoop(page) {
  const before = await page.evaluate(() => {
    const video = document.querySelector("#hero-video-element");
    return {
      loopStart: Number(video?.dataset.loopStart ?? NaN),
      loopEnd: Number(video?.dataset.loopEnd ?? NaN),
      duration: Number(video?.duration ?? NaN),
    };
  });

  if (before.loopStart !== expectedLoopStart || before.loopEnd !== expectedLoopEnd || before.duration <= expectedLoopEnd) {
    throw new Error(`Video loop configuration is invalid: ${JSON.stringify(before)}`);
  }

  const after = await page.evaluate(async (loopEnd) => {
    const video = document.querySelector("#hero-video-element");
    video.currentTime = loopEnd - 0.02;
    video.dispatchEvent(new Event("timeupdate"));
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      currentTime: video.currentTime,
      paused: video.paused,
      loopStart: Number(video.dataset.loopStart),
      loopEnd: Number(video.dataset.loopEnd),
    };
  }, expectedLoopEnd);

  if (
    after.loopStart !== expectedLoopStart || after.loopEnd !== expectedLoopEnd ||
    after.currentTime < expectedLoopStart - 0.25 || after.currentTime > expectedLoopStart + 1.5 || after.paused
  ) {
    throw new Error(`Video did not restart at 03:30: ${JSON.stringify({ before, after })}`);
  }

  return { before, after };
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

  const videoLoop = await verifyVideoLoop(page);
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
  return { reducedMotion, mobile, expectedScale, logo, videoLoop, videoAndControls, consoleErrors };
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
