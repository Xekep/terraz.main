import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const expectedAssetsVersion = "20260724-6";
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

  const socialState = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll(".social-links .social-link"));
    return links.map((link) => {
      const icon = link.querySelector(".social-link__icon");
      const linkStyle = getComputedStyle(link);
      const iconStyle = icon ? getComputedStyle(icon) : null;
      const linkRect = link.getBoundingClientRect();
      const iconRect = icon?.getBoundingClientRect();

      return {
        href: link.getAttribute("href"),
        linkWidth: linkRect.width,
        linkHeight: linkRect.height,
        borderRadius: linkStyle.borderRadius,
        iconWidth: iconRect?.width ?? 0,
        iconHeight: iconRect?.height ?? 0,
        backgroundImage: iconStyle?.backgroundImage ?? "none",
        backgroundSize: iconStyle?.backgroundSize ?? "",
        filter: iconStyle?.filter ?? "none",
        iconDisplay: iconStyle?.display ?? "none",
        iconVisibility: iconStyle?.visibility ?? "hidden",
        iconOpacity: Number(iconStyle?.opacity ?? 0),
      };
    });
  });

  if (socialState.length !== 5) {
    throw new Error(`Expected five social links, found ${socialState.length}`);
  }

  for (const icon of socialState) {
    const isTransparentSvg = icon.backgroundImage.includes("data:image/svg+xml");
    const visible =
      icon.linkWidth >= 30 &&
      icon.linkHeight >= 30 &&
      icon.iconWidth >= 16 &&
      icon.iconHeight >= 16 &&
      isTransparentSvg &&
      icon.backgroundSize === "contain" &&
      icon.filter === "none" &&
      icon.iconDisplay !== "none" &&
      icon.iconVisibility !== "hidden" &&
      icon.iconOpacity > 0;

    if (!visible) {
      throw new Error(`Social icon is not a transparent rendered SVG: ${JSON.stringify(icon)}`);
    }
  }

  return socialState;
}

async function clickAndReadCopyFeedback(page) {
  await page.click("#server-copy");
  await page.waitForFunction(
    () => {
      const button = document.querySelector("#server-copy");
      const status = document.querySelector("#copy-status");
      const icon = button?.querySelector(".server-copy__icon");
      const opacity = status ? Number(getComputedStyle(status).opacity) : 0;

      return (
        button?.classList.contains("is-copied") &&
        status?.classList.contains("is-visible") &&
        status?.textContent?.trim() === "Скопировано" &&
        icon?.textContent?.trim() === "✓" &&
        opacity > 0.5
      );
    },
    { timeout: 5_000 },
  );

  return page.evaluate(() => {
    const button = document.querySelector("#server-copy");
    const status = document.querySelector("#copy-status");
    const icon = button?.querySelector(".server-copy__icon");
    const style = status ? getComputedStyle(status) : null;

    return {
      copiedClass: button?.classList.contains("is-copied") ?? false,
      statusVisibleClass: status?.classList.contains("is-visible") ?? false,
      text: status?.textContent?.trim() ?? "",
      opacity: Number(style?.opacity ?? 0),
      animationName: style?.animationName ?? "none",
      animationDuration: style?.animationDuration ?? "",
      transform: style?.transform ?? "none",
      copyIcon: icon?.textContent?.trim() ?? "",
    };
  });
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

  return page.evaluate((expectedSource) => {
    const video = document.querySelector("#hero-video-element");
    const videoStyle = video ? getComputedStyle(video) : null;
    const container = document.querySelector("#hero-video");
    const containerStyle = container ? getComputedStyle(container) : null;
    const controls = document.querySelector("#video-controls");
    const controlsStyle = controls ? getComputedStyle(controls) : null;

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
      containerDisplay: containerStyle?.display ?? "none",
      controlsDisplay: controlsStyle?.display ?? "none",
      objectFit: videoStyle?.objectFit ?? "",
      transform: videoStyle?.transform ?? "none",
      youtubeApiScript: Array.from(document.scripts).some((script) =>
        script.src.includes("youtube.com/iframe_api"),
      ),
      youtubeIframe: Boolean(document.querySelector("#hero-video iframe")),
    };
  }, expectedVideoUrl);
}

function assertVideoState(videoState, mode) {
  if (
    !videoState.exists ||
    videoState.source !== expectedVideoUrl ||
    videoState.loopStart !== "12" ||
    videoState.currentTime < 11.5 ||
    videoState.readyState < 2 ||
    videoState.paused ||
    !videoState.muted ||
    videoState.videoDisplay === "none" ||
    videoState.containerDisplay === "none" ||
    videoState.controlsDisplay === "none" ||
    videoState.objectFit !== "cover" ||
    videoState.transform === "none" ||
    videoState.youtubeApiScript ||
    videoState.youtubeIframe
  ) {
    throw new Error(`${mode} static background video is incomplete: ${JSON.stringify(videoState)}`);
  }
}

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(new URL(liveUrl).origin, ["clipboard-read", "clipboard-write"]);

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const consoleErrors = collectConsoleErrors(page);
  await openCurrentHomepage(page, "desktop");

  const socialState = await verifySocialIcons(page);
  const copyState = await clickAndReadCopyFeedback(page);

  if (copyState.animationName === "none") {
    throw new Error(`Desktop copy feedback should animate: ${JSON.stringify(copyState)}`);
  }

  const videoState = await waitForVideoPlayback(page);
  assertVideoState(videoState, "Desktop");

  await page.click("#video-pause");
  await page.waitForFunction(
    () => document.querySelector("#hero-video-element")?.paused === true,
    { timeout: 5_000 },
  );
  await page.click("#video-pause");
  await page.waitForFunction(
    () => document.querySelector("#hero-video-element")?.paused === false,
    { timeout: 5_000 },
  );

  await page.screenshot({
    path: "live-homepage.png",
    fullPage: true,
  });

  const reducedPage = await browser.newPage();
  await reducedPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await reducedPage.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  const reducedConsoleErrors = collectConsoleErrors(reducedPage);
  await openCurrentHomepage(reducedPage, "reduced-motion");

  const reducedVideoState = await waitForVideoPlayback(reducedPage);
  assertVideoState(reducedVideoState, "Reduced-motion desktop");

  const reducedCopyState = await clickAndReadCopyFeedback(reducedPage);
  await delay(300);
  const reducedCopyAfterDelay = await reducedPage.evaluate(() => {
    const status = document.querySelector("#copy-status");
    const style = status ? getComputedStyle(status) : null;
    return {
      visibleClass: status?.classList.contains("is-visible") ?? false,
      opacity: Number(style?.opacity ?? 0),
      animationName: style?.animationName ?? "none",
      text: status?.textContent?.trim() ?? "",
    };
  });

  if (
    reducedCopyState.animationName !== "none" ||
    !reducedCopyAfterDelay.visibleClass ||
    reducedCopyAfterDelay.opacity <= 0.5 ||
    reducedCopyAfterDelay.animationName !== "none" ||
    reducedCopyAfterDelay.text !== "Скопировано"
  ) {
    throw new Error(
      `Reduced-motion copy feedback is not persistently visible: ${JSON.stringify({ reducedCopyState, reducedCopyAfterDelay })}`,
    );
  }

  await reducedPage.screenshot({
    path: "live-homepage-reduced-motion.png",
    fullPage: true,
  });

  const report = {
    socialState,
    copyState,
    videoState,
    consoleErrors,
    reducedMotion: {
      copyState: reducedCopyState,
      copyAfterDelay: reducedCopyAfterDelay,
      videoState: reducedVideoState,
      consoleErrors: reducedConsoleErrors,
    },
  };

  fs.writeFileSync("live-homepage-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
