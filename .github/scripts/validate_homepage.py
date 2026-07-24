from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "index.html"
EFFECTS_CSS = ROOT / "assets/css/homepage-interactions.css"
JS = ROOT / "assets/js/index.js"


class HomepageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.social_icons: list[set[str]] = []
        self.copy_status_text: list[str] = []
        self._inside_copy_status = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        classes = set((attributes.get("class") or "").split())
        if "social-link__icon" in classes:
            self.social_icons.append(classes)
        if attributes.get("id") == "copy-status":
            self._inside_copy_status = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "span" and self._inside_copy_status:
            self._inside_copy_status = False

    def handle_data(self, data: str) -> None:
        if self._inside_copy_status and data.strip():
            self.copy_status_text.append(data.strip())


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    css = EFFECTS_CSS.read_text(encoding="utf-8")
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
    require("new window.YT.Player" in js, "YouTube IFrame API player is missing")
    require("onAutoplayBlocked" in js, "Autoplay fallback handling is missing")
    require("body.video-ready .video-controls" in css, "Manual video start controls are missing")
    require("display: block !important" in css, "Touch viewport video override is missing")

    print("Homepage regression checks passed")


if __name__ == "__main__":
    main()
