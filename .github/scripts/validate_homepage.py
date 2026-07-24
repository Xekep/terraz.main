from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "index.html"
EFFECTS_CSS = ROOT / "assets/css/homepage-interactions.css"
VIDEO_CSS = ROOT / "assets/css/static-video.css"
MOTION_CSS = ROOT / "assets/css/motion-preferences.css"
JS = ROOT / "assets/js/index.js"


class HomepageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.social_icons: list[set[str]] = []
        self.copy_status_text: list[str] = []
        self.video_attributes: dict[str, str | None] = {}
        self.video_sources: list[dict[str, str | None]] = []
        self._inside_copy_status = False
        self._inside_background_video = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        classes = set((attributes.get("class") or "").split())

        if "social-link__icon" in classes:
            self.social_icons.append(classes)

        if attributes.get("id") == "copy-status":
            self._inside_copy_status = True

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
    require(css.count("data:image/svg+xml;base64,") == 5, "All social icons must use transparent embedded SVGs")
    require(".png" not in css, "Social icons must not use square PNG assets")
    require("filter: none" in css, "Social icons must not be flattened by a color filter")
    require("brightness(0) invert(1)" not in css, "The old white-tile icon filter must not return")
    require("Скопировано" in " ".join(parser.copy_status_text), "Copy status text is missing")
    require("@keyframes copy-pop" in css and ".copy-status.is-visible" in css, "Copy animation is missing")

    require(parser.video_attributes.get("data-loop-start") == "12", "Background video must start at 12 seconds")
    require("autoplay" in parser.video_attributes, "Background video autoplay attribute is missing")
    require("muted" in parser.video_attributes, "Background video must start muted")
    require("playsinline" in parser.video_attributes, "Background video must play inline on mobile")
    require(len(parser.video_sources) == 1, "Background video must have exactly one source")
    require(
        parser.video_sources[0].get("src")
        == "https://d.terraz.ru/static/Eye_of_Cthulhu_By_Cupquake_Terraria_Speed_Art.mp4",
        "Static background video URL is incorrect",
    )
    require(parser.video_sources[0].get("type") == "video/mp4", "Background video MIME type is missing")
    require("scale(1.02)" in video_css and "object-fit: cover" in video_css, "Background video crop or zoom changed")
    require("DEFAULT_LOOP_START = 12" in js, "Static video loop start is missing")
    require("handleVideoEnded" in js and "seekToLoopStart" in js, "Static video loop handling is missing")
    require("hero-video-element" in js, "Static video element is not initialized")
    require("prefers-reduced-motion" not in js, "System animation settings must not disable video loading")
    require("YT.Player" not in js and "iframe_api" not in js, "YouTube player code must not return")

    require("motion-preferences.css?v=20260724-6" in html, "Reduced-motion compatibility stylesheet is not linked")
    require(".hero__video-element" in motion_css, "Reduced-motion video override is missing")
    require("display: block !important" in motion_css, "Reduced-motion mode must keep the video visible")
    require(".copy-status.is-visible" in motion_css, "Reduced-motion copy feedback override is missing")
    require("opacity: 1 !important" in motion_css, "Reduced-motion copy feedback must remain visible")
    require("animation: none !important" in motion_css, "Reduced-motion copy feedback must not animate")
    require("body.video-ready .video-controls" in css, "Manual video start controls are missing")
    require("display: block !important" in css, "Touch viewport video override is missing")

    print("Homepage regression checks passed")


if __name__ == "__main__":
    main()
