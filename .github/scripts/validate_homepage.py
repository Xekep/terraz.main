from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "index.html"
EFFECTS_CSS = ROOT / "assets/css/homepage-interactions.css"
VIDEO_CSS = ROOT / "assets/css/static-video.css"
MOTION_CSS = ROOT / "assets/css/motion-preferences.css"
LOGO_CSS = ROOT / "assets/css/logo-drawing.css"
LOGO_JS = ROOT / "assets/js/logo-animation.js"
LOGO_SVG = ROOT / "assets/images/terraz-logo.svg"
JS = ROOT / "assets/js/index.js"


class HomepageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.social_icons: list[set[str]] = []
        self.copy_status_text: list[str] = []
        self.video_attributes: dict[str, str | None] = {}
        self.video_sources: list[dict[str, str | None]] = []
        self.logo_host: dict[str, str | None] = {}
        self._inside_copy_status = False
        self._inside_background_video = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        classes = set((attributes.get("class") or "").split())
        if "social-link__icon" in classes:
            self.social_icons.append(classes)
        if attributes.get("id") == "copy-status":
            self._inside_copy_status = True
        if attributes.get("id") == "hero-logo":
            self.logo_host = attributes
        if tag == "video" and attributes.get("id") == "hero-video-element":
            self.video_attributes = attributes
            self._inside_background_video = True
        if tag == "source" and self._inside_background_video:
            self.video_sources.append(attributes)

    def handle_endtag(self, tag: str) -> None:
        if tag == "span" and self._inside_copy_status:
            self._inside_copy_status = False
        if tag == "video" and self._inside_background_video:
            self._inside_background_video = False

    def handle_data(self, data: str) -> None:
        if self._inside_copy_status and data.strip():
            self.copy_status_text.append(data.strip())


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    css = EFFECTS_CSS.read_text(encoding="utf-8")
    video_css = VIDEO_CSS.read_text(encoding="utf-8")
    motion_css = MOTION_CSS.read_text(encoding="utf-8")
    logo_css = LOGO_CSS.read_text(encoding="utf-8")
    logo_js = LOGO_JS.read_text(encoding="utf-8")
    logo_svg = LOGO_SVG.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")

    parser = HomepageParser()
    parser.feed(html)

    required_icons = {"vk", "youtube", "discord", "telegram", "twitch"}
    actual_icons = {
        class_name.removeprefix("social-link__icon--")
        for classes in parser.social_icons
        for class_name in classes
        if class_name.startswith("social-link__icon--")
    }
    require(actual_icons == required_icons, "Homepage must render all five social icons")
    require(".png" not in css, "Social icons must not use square PNG assets")
    require("brightness(0) invert(1)" not in css, "The old white-tile icon filter must not return")

    require('terraz-assets" content="20260725-5' in html, "Homepage assets version was not bumped")
    require(parser.logo_host.get("role") == "img", "Logo host must expose image semantics")
    require("terraz-logo.svg?v=20260725-5" in (parser.logo_host.get("data-logo-src") or ""), "Inline logo source is stale")
    require("<object" not in html, "Opaque object-based logo canvas must not return")
    require("logo-drawing.css?v=20260725-5" in html, "Logo drawing stylesheet is not linked")
    require("logo-animation.js?v=20260725-5" in html, "Logo drawing script is not linked")

    require('class="title-letter"' in logo_svg, "Original TerraZ logo path must be restored")
    require('viewBox="0 0 255 150"' in logo_svg, "Original TerraZ logo proportions changed")
    require('class="logo-stroke"' not in logo_svg, "Replacement centerline logo must not return")
    require("M158.15,358.55" in logo_svg, "Original TerraZ path geometry changed")

    require("fetch(source" in logo_js and "DOMParser" in logo_js, "Logo SVG must be loaded as text")
    require("document.importNode" in logo_js and "replaceChildren" in logo_js, "Logo SVG must be inserted inline")
    require('querySelectorAll("style, script, title")' in logo_js, "Embedded SVG animation must be removed")
    require('querySelector(".title-letter")' in logo_js, "Original logo path must be used as the final shape")
    require('MASK_ID = "terraz-logo-reveal-mask"' in logo_js, "Logo reveal mask is missing")
    require("REVEAL_PATHS = [" in logo_js and logo_js.count('classList.add("logo-reveal-stroke")') == 1, "Mask brush paths are missing")
    require("buildRevealMask" in logo_js and 'finalPath.setAttribute("mask"' in logo_js, "Original logo is not revealed through a mask")
    require('drawing.id = "terraz-logo-reveal-" + index' in logo_js, "Mask animations must be individually identifiable")
    require('direction: "normal"' in logo_js and "iterations: 1" in logo_js, "Mask strokes must draw once forward")
    require("nextDelay += duration + STROKE_GAP" in logo_js, "Mask strokes must run sequentially")
    require("alternate" not in logo_js and "reverse" not in logo_js, "Reverse logo animation must not return")
    require('finalPath.style.fill = "none"' in logo_js, "Original logo must remain unfilled")
    require('finalPath.style.stroke = "#ffffff"' in logo_js, "Original logo must be white")
    require('finalPath.style.strokeWidth = "1.15"' in logo_js, "Original logo line must stay thin")
    require('logoHost.dataset.logoMode = "masked-original"' in logo_js, "Masked original logo mode is not exposed")
    require("background: transparent !important" in logo_css, "Logo container must stay transparent")
    require("box-shadow: none" in logo_css and "filter: none" in logo_css, "Logo must not have a plate or glow")

    require("@keyframes section-in" in css, "Staggered section entrance animation is missing")
    require("Скопировано" in " ".join(parser.copy_status_text), "Copy status text is missing")
    require("@keyframes copy-fade" in css and ".copy-status.is-visible" in css, "Smooth copy feedback animation is missing")
    require("copy-fade 1.65s" in css, "Copy feedback duration changed")

    require("video-control__icon" in html and "video-control__speaker" in html, "Video controls must use SVG icons")
    require("width: 32px" in css and "opacity: .38" in css, "Video controls are not subtle and compact")
    require("dataset.state" in js and "dataset.muted" in js, "Video control state switching is missing")

    require(parser.video_attributes.get("data-loop-start") == "12", "Background video must start at 12 seconds")
    require("autoplay" in parser.video_attributes and "muted" in parser.video_attributes, "Background video autoplay setup is incomplete")
    require("playsinline" in parser.video_attributes, "Background video must play inline on mobile")
    require(len(parser.video_sources) == 1, "Background video must have exactly one source")
    require(parser.video_sources[0].get("src") == "https://d.terraz.ru/static/Eye_of_Cthulhu_By_Cupquake_Terraria_Speed_Art.mp4", "Static background video URL is incorrect")
    require(parser.video_sources[0].get("type") == "video/mp4", "Background video MIME type is missing")
    require("scale(1.2)" in video_css and "object-fit: cover" in video_css, "Desktop background video zoom changed")
    require("@media (max-width: 768px), (hover: none) and (pointer: coarse)" in video_css, "Mobile video media query is missing")
    require("scale(1);" in video_css, "Mobile background video must use scale 1")
    require("scale(1.02)" not in video_css, "Old background video zoom must not return")
    require("DEFAULT_LOOP_START = 12" in js, "Static video loop start is missing")
    require("YT.Player" not in js and "iframe_api" not in js, "YouTube player code must not return")

    require("motion-preferences.css?v=20260725-5" in html, "Motion compatibility stylesheet is not current")
    require("section-in .72s" in motion_css, "Section animations must remain enabled with reduced motion")
    require("copy-fade 1.65s" in motion_css, "Copy animation must remain enabled with reduced motion")
    require("animation: none !important" not in motion_css, "Motion compatibility must not disable requested animations")

    print("Homepage regression checks passed")


if __name__ == "__main__":
    main()
