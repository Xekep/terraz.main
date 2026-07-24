import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const expectedAssetsVersion = "20260724-7";
const expectedVideoUrl =
  "https://d.terraz.ru/static/Eye_of_Cthulhu_By_Cupquake_Terraria_Speed_Art.mp4";

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--autoplay-policy=no-user-gesture-required",
  ],
});

const report = { modes: {}, error: null };
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function openCurrentHomepage(page, probeName) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const url = new URL(liveUrl);
    url.searchParams.set("browser_probe", `${runId}-${probeName}-${attempt}`);

    const response = await page.goto(url.href, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const assetsVersion = await page
      .$eval('meta[name="terraz-assets"]', (element) => element.getAttribute("content"))
      .catch(() => null);

    if (response?.ok() && assetsVersion === expectedAssetsVersion) {
      return url.href;
    }

    await delay(2_000);
  }

  throw new Error(`Live homepage did not publish assets ${expectedAssetsVersion}`);
}

function collectConsoleErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function verifySocialIcons(page) {
  await page.waitForSelector(".social-links .social-link", {
    visible: true,
    timeout: 15_000,
  });

  const state = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".social-links .social-link")).map((link) => {
      const icon = link.querySelector(".social-link__icon");
      const iconStyle = icon ? getComputedStyle(icon) : null;
      const linkRect = link.getBoundingClientRect();
      const iconRect = icon?.getBoundingClientRect();

      return {
        href: link.getAttribute("href"),
        linkWidth: linkRect.width,
        linkHeight: linkRect.height,
        iconWidth: iconRect?.width ?? 0,
        iconHeight: iconRect?.height ?? 0,
        backgroundImage: iconStyle?.backgroundImage ?? "none",
        backgroundSize: iconStyle?.backgroundSize ?? "",
        filter: iconStyle?.filter ?? "none",
        opacity: Number(iconStyle?.opacity ?? 0),
      };
    }),
  );

  if (state.length !== 5) {
    throw new Error(`Expected five social links, found ${state.length}`);
  }

  for (const icon of state) {
    if (
      icon.linkWidth < 30 ||
      icon.linkHeight < 30 ||
      icon.iconWidth < 16 ||
      icon.iconHeight < 16 ||
      !icon.backgroundImage.includes("data:image/svg+xml") ||
      icon.backgroundSize !== "contain" ||
      icon.filter !== "none" ||
      icon.opacity <= 0
    ) {
      throw new Error(`Social icon is invalid: ${JSON.stringify(icon)}`);
    }
  }

  return state;
}

async function readEntranceAnimations(page) {
  const state = await page.evaluate(() => {
    const selectors = {
      logoStage: ".hero__logo-stage",
      logoTrace: ".hero__logo--trace",
      message: ".hero__message",
      serverActions: ".server-actions",
      socialLinks: ".social-links",
      portal: ".portal-link",
    };

    return Object.fromEntries(
      Object.entries(selectors).map(([name, selector]) => {
        const element = document.querySelector(selector);
        const style = element ? getComputedStyle(element) : null;
        const rect = element?.getBoundingClientRect();
        return [name, {
          exists: Boolean(element),
          animationName: style?.animationName ?? "none",
          animationDuration: style?.animationDuration ?? "0s",
          animationDelay: style?.animationDelay ?? "0s",
          opacity: Number(style?.opacity ?? 0),
          width: rect?.width ?? 0,
          height: rect?.height ?? 0,
        }];
      }),
    );
  });

  const expected = {
    logoStage: "logo-stage-in",
    logoTrace: "logo-trace",
    message: "section-in",
    serverActions: "section-in",
    socialLinks: "section-in",
    portal: "portal-soft-in",
  };

  for (const [name, animationName] of Object.entries(expected)) {
    const item = state[name];
    const duration = Number.parseFloat(item?.animationDuration ?? "0");
    if (!item?.exists || item.animationName !== animationName || duration < 0.4 || item.width <= 0 || item.height <= 0) {
      throw new Error(`Entrance animation ${name} is missing: ${JSON.stringify(item)}`);
    }
  }

  return state;
}

async function clickAndReadCopyFeedback(page) {
  await page.click("#server-copy");
  await page.waitForFunction(
    () => {
      const button = document.querySelector("#server-copy");
      const status = document.querySelector("#copy-status");
      return Boolean(
        button?.classList.contains("is-copied") &&
        status?.classList.contains("is-visible") &&
        status?.textContent?.trim() === "Скопировано",
      );
    },
    { timeout: 5_000 },
  );

  await delay(320);

  const state = await page.evaluate(() => {
    const button = document.querySelector("#server-copy");
    const status = document.querySelector("#copy-status");
    const icon = button?.querySelector(".server-copy__icon");
    const style = status ? getComputedStyle(status) : null;

    return {
      copiedClass: button?.classList.contains("is-copied") ?? false,
      visibleClass: status?.classList.contains("is-visible") ?? false,
      text: status?.textContent?.trim() ?? "",
      opacity: Number(style?.opacity ?? 0),
      animationName: style?.animationName ?? "none",
      animationDuration: style?.animationDuration ?? "0s",
      transform: style?.transform ?? "none",
      copyIcon: icon?.textContent?.trim() ?? "",
    };
  });

  if (
    !state.copiedClass ||
    !state.visibleClass ||
    state.text !== "Скопировано" ||
    state.opacity <= 0.5 ||
    state.animationName !== "copy-fade" ||
    Number.parseFloat(state.animationDuration) < 1.5 ||
    state.copyIcon !== "✓"
  ) {
    throw new Error(`Copy feedback is not smoothly visible: ${JSON.stringify(state)}`);
  }

  return state;
}

async function waitForVideoPlayback(page) {
  await page.waitForFunction(
    (expectedSource) => {
      const video = document.querySelector("#hero-video-element");
      return Boolean(
        video &&
        video.currentSrc === expectedSource &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime >= 11.5 &&
        !video.paused &&
        document.body.classList.contains("has-video"),
      );
    },
    { timeout: 30_000 },
    expectedVideoUrl,
  );

  await delay(650);

  return page.evaluate((expectedSource) => {
    const video = document.querySelector("#hero-video-element");
    const videoStyle = video ? getComputedStyle(video) : null;
    const controls = document.querySelector("#video-controls");
    const controlsStyle = controls ? getComputedStyle(controls) : null;
    const pauseButton = document.querySelector("#video-pause");
    const volumeButton = document.querySelector("#video-volume");
    const pauseStyle = pauseButton ? getComputedStyle(pauseButton) : null;
    const pauseRect = pauseButton?.getBoundingClientRect();

    return {
      exists: Boolean(video),
      source: video?.currentSrc ?? "",
      expectedSource,
      loopStart: video?.dataset.loopStart ?? "",
      currentTime: video?.currentTime ?? -1,
      duration: video?.duration ?? -1,
      readyState: video?.readyState ?? -1,
      paused: video?.paused ?? true,
      muted: video?.muted ?? false,
      videoDisplay: videoStyle?.display ?? "none",
      objectFit: videoStyle?.objectFit ?? "",
      transform: videoStyle?.transform ?? "none",
      controlsDisplay: controlsStyle?.display ?? "none",
      controlsOpacity: Number(controlsStyle?.opacity ?? 0),
      controlsAnimation: controlsStyle?.animationName ?? "none",
      pauseWidth: pauseRect?.width ?? 0,
      pauseHeight: pauseRect?.height ?? 0,
      pauseBackground: pauseStyle?.backgroundColor ?? "",
      pauseState: pauseButton?.dataset.state ?? "",
      volumeMutedState: volumeButton?.dataset.muted ?? "",
      pauseSvg: Boolean(pauseButton?.querySelector("svg.video-control__icon")),
      speakerSvg: Boolean(volumeButton?.querySelector(".video-control__speaker")),
      youtubeApiScript: Array.from(document.scripts).some((script) =>
        script.src.includes("youtube.com/iframe_api"),
      ),
      youtubeIframe: Boolean(document.querySelector("#hero-video iframe")),
    };
  }, expectedVideoUrl);
}

function assertVideoState(state, mode) {
  if (
    !state.exists ||
    state.source !== expectedVideoUrl ||
    state.loopStart !== "12" ||
    state.currentTime < 11.5 ||
    state.readyState < 2 ||
    state.paused ||
    !state.muted ||
    state.videoDisplay === "none" ||
    state.objectFit !== "cover" ||
    state.transform === "none" ||
    state.controlsDisplay === "none" ||
    state.controlsOpacity <= 0.15 ||
    state.controlsOpacity > 0.55 ||
    state.controlsAnimation !== "controls-in" ||
    state.pauseWidth > 34 ||
    state.pauseWidth < 30 ||
    state.pauseHeight > 34 ||
    state.pauseState !== "playing" ||
    state.volumeMutedState !== "true" ||
    !state.pauseSvg ||
    !state.speakerSvg ||
    state.youtubeApiScript ||
    state.youtubeIframe
  ) {
    throw new Error(`${mode} video or controls are invalid: ${JSON.stringify(state)}`);
  }
}

async function verifyControlSwitches(page) {
  await page.click("#video-pause");
  await page.waitForFunction(
    () => {
      const video = document.querySelector("#hero-video-element");
      const button = document.querySelector("#video-pause");
      return video?.paused === true && button?.dataset.state === "paused";
    },
    { timeout: 5_000 },
  );

  await page.click("#video-pause");
  await page.waitForFunction(
    () => {
      const video = document.querySelector("#hero-video-element");
      const button = document.querySelector("#video-pause");
      return video?.paused === false && button?.dataset.state === "playing";
    },
    { timeout: 5_000 },
  );

  await page.click("#video-volume");
  await page.waitForFunction(
    () => {
      const video = document.querySelector("#hero-video-element");
      const button = document.querySelector("#video-volume");
      return video?.muted === false && button?.dataset.muted === "false";
    },
    { timeout: 5_000 },
  );

  await page.click("#video-volume");
  await page.waitForFunction(
    () => {
      const video = document.querySelector("#hero-video-element");
      const button = document.querySelector("#video-volume");
      return video?.muted === true && button?.dataset.muted === "true";
    },
    { timeout: 5_000 },
  );

  return page.evaluate(() => ({
    pauseState: document.querySelector("#video-pause")?.dataset.state ?? "",
    mutedState: document.querySelector("#video-volume")?.dataset.muted ?? "",
    muted: document.querySelector("#hero-video-element")?.muted ?? false,
  }));
}

async function verifyMode(mode, reducedMotion, screenshotPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }

  const consoleErrors = collectConsoleErrors(page);
  await openCurrentHomepage(page, mode);

  const socialState = await verifySocialIcons(page);
  const entranceAnimations = await readEntranceAnimations(page);
  const copyState = await clickAndReadCopyFeedback(page);
  const videoState = await waitForVideoPlayback(page);
  assertVideoState(videoState, mode);
  const controlSwitches = await verifyControlSwitches(page);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const state = {
    reducedMotion,
    socialState,
    entranceAnimations,
    copyState,
    videoState,
    controlSwitches,
    consoleErrors,
  };
  await page.close();
  return state;
}

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(new URL(liveUrl).origin, ["clipboard-read", "clipboard-write"]);

  report.modes.desktop = await verifyMode("desktop", false, "live-homepage.png");
  report.modes.reducedMotion = await verifyMode(
    "reduced-motion",
    true,
    "live-homepage-reduced-motion.png",
  );

  fs.writeFileSync("live-homepage-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.error = error instanceof Error ? error.stack || error.message : String(error);
  fs.writeFileSync("live-homepage-report.json", JSON.stringify(report, null, 2));
  throw error;
} finally {
  await browser.close();
}
