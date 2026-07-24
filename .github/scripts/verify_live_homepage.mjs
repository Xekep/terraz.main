import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const expectedVideoUrl =
  "https://d.terraz.ru/static/Eye_of_Cthulhu_By_Cupquake_Terraria_Speed_Art.mp4";
const url = new URL(liveUrl);
url.searchParams.set("browser_probe", runId);

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

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(url.origin, ["clipboard-read", "clipboard-write"]);

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await page.goto(url.href, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  if (!response || !response.ok()) {
    throw new Error(`Live homepage returned HTTP ${response?.status() ?? "unknown"}`);
  }

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

  const copyState = await page.evaluate(() => {
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
      copyIcon: icon?.textContent?.trim() ?? "",
    };
  });

  if (
    !copyState.copiedClass ||
    !copyState.statusVisibleClass ||
    copyState.text !== "Скопировано" ||
    copyState.opacity <= 0.5 ||
    copyState.animationName === "none" ||
    copyState.copyIcon !== "✓"
  ) {
    throw new Error(`Copy feedback is not visibly animated: ${JSON.stringify(copyState)}`);
  }

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

  const videoState = await page.evaluate((expectedSource) => {
    const video = document.querySelector("#hero-video-element");
    const style = video ? getComputedStyle(video) : null;

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
      objectFit: style?.objectFit ?? "",
      transform: style?.transform ?? "none",
      controls: Boolean(document.querySelector("#video-controls")),
      youtubeApiScript: Array.from(document.scripts).some((script) =>
        script.src.includes("youtube.com/iframe_api"),
      ),
      youtubeIframe: Boolean(document.querySelector("#hero-video iframe")),
    };
  }, expectedVideoUrl);

  if (
    !videoState.exists ||
    videoState.source !== expectedVideoUrl ||
    videoState.loopStart !== "12" ||
    videoState.currentTime < 11.5 ||
    videoState.readyState < 2 ||
    videoState.paused ||
    !videoState.muted ||
    videoState.objectFit !== "cover" ||
    videoState.transform === "none" ||
    !videoState.controls ||
    videoState.youtubeApiScript ||
    videoState.youtubeIframe
  ) {
    throw new Error(`Static background video is incomplete: ${JSON.stringify(videoState)}`);
  }

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

  fs.writeFileSync(
    "live-homepage-report.json",
    JSON.stringify({ socialState, copyState, videoState, consoleErrors }, null, 2),
  );

  console.log(JSON.stringify({ socialState, copyState, videoState, consoleErrors }, null, 2));
} finally {
  await browser.close();
}
