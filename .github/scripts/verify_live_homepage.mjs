import fs from "node:fs";
import puppeteer from "puppeteer-core";

const liveUrl = process.env.LIVE_URL || "https://terraz.ru/";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
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
    const visible =
      icon.linkWidth >= 30 &&
      icon.linkHeight >= 30 &&
      icon.iconWidth >= 16 &&
      icon.iconHeight >= 16 &&
      icon.backgroundImage !== "none" &&
      icon.iconDisplay !== "none" &&
      icon.iconVisibility !== "hidden" &&
      icon.iconOpacity > 0;

    if (!visible) {
      throw new Error(`Social icon is not visibly rendered: ${JSON.stringify(icon)}`);
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

  const videoState = await page.evaluate(() => ({
    container: Boolean(document.querySelector("#hero-video")),
    controls: Boolean(document.querySelector("#video-controls")),
    apiScript: Array.from(document.scripts).some((script) =>
      script.src.includes("youtube.com/iframe_api"),
    ),
  }));

  if (!videoState.container || !videoState.controls || !videoState.apiScript) {
    throw new Error(`YouTube background bootstrap is incomplete: ${JSON.stringify(videoState)}`);
  }

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
