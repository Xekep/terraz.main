#!/usr/bin/env python3
"""Validate the static TerraZ site without third-party dependencies."""

from __future__ import annotations

import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]
IGNORED_SCHEMES = {"data", "mailto", "steam", "tel", "javascript"}
SIZE_LIMITS = {
    "index.html": 50_000,
    "assets/css/style.css": 60_000,
    "assets/js/index.js": 25_000,
}
LEGACY_REFERENCES = {
    "bootstrap",
    "jquery",
    "vegas",
    "parallax",
    "cycle2",
    "mgGlitch",
    "font-awesome",
    "themify-icons",
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[tuple[str, str]] = []
        self.ids: list[str] = []
        self.errors: list[str] = []
        self.has_title = False
        self.html_language: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)

        if tag == "html":
            self.html_language = values.get("lang")
        elif tag == "title":
            self.has_title = True
        elif tag == "style":
            self.errors.append("inline <style> is not allowed")
        elif tag == "script" and not values.get("src"):
            self.errors.append("inline <script> is not allowed")
        elif tag == "img" and "alt" not in values:
            self.errors.append("<img> is missing alt attribute")

        element_id = values.get("id")
        if element_id:
            self.ids.append(element_id)

        for attribute, value in attrs:
            if attribute == "style":
                self.errors.append(f"inline style attribute on <{tag}> is not allowed")
            if attribute.lower().startswith("on"):
                self.errors.append(f"inline event handler {attribute!r} on <{tag}> is not allowed")

            if attribute not in {"href", "src"}:
                continue
            if value is None or not value.strip():
                self.errors.append(f"empty {attribute} on <{tag}>")
                continue
            self.references.append((attribute, value))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)


def resolve_local_reference(page: Path, reference: str) -> Path | None:
    parsed = urlparse(reference)

    if parsed.scheme in IGNORED_SCHEMES:
        return None
    if parsed.scheme or parsed.netloc or reference.startswith("#"):
        return None

    clean_path = unquote(parsed.path)
    if not clean_path:
        return None

    candidate = ROOT / clean_path.lstrip("/") if clean_path.startswith("/") else page.parent / clean_path
    return candidate.resolve()


def reference_exists(candidate: Path) -> bool:
    if candidate.exists():
        return True
    if candidate.suffix:
        return False
    if candidate.with_suffix(".html").exists():
        return True
    return (candidate / "index.html").exists()


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def validate_page(page: Path) -> list[str]:
    parser = PageParser()
    errors: list[str] = []

    try:
        parser.feed(page.read_text(encoding="utf-8"))
    except (OSError, UnicodeError) as error:
        return [f"{page.relative_to(ROOT)}: cannot read UTF-8 HTML: {error}"]

    relative_page = page.relative_to(ROOT)

    if not parser.has_title:
        errors.append(f"{relative_page}: missing <title>")
    if not parser.html_language:
        errors.append(f"{relative_page}: missing html lang attribute")

    errors.extend(f"{relative_page}: {error}" for error in parser.errors)

    duplicate_ids = sorted(element_id for element_id, count in Counter(parser.ids).items() if count > 1)
    for element_id in duplicate_ids:
        errors.append(f"{relative_page}: duplicate id={element_id!r}")

    for attribute, reference in parser.references:
        candidate = resolve_local_reference(page, reference)
        if candidate is None:
            continue

        try:
            candidate.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(f"{relative_page}: local {attribute} escapes repository: {reference!r}")
            continue

        if not reference_exists(candidate):
            errors.append(
                f"{relative_page}: broken local {attribute}={reference!r} "
                f"(resolved to {display_path(candidate)})"
            )

    return errors


def validate_size_limits() -> list[str]:
    errors: list[str] = []
    for relative_path, limit in SIZE_LIMITS.items():
        path = ROOT / relative_path
        if not path.exists():
            errors.append(f"{relative_path}: required file is missing")
            continue
        size = path.stat().st_size
        if size > limit:
            errors.append(f"{relative_path}: {size} bytes exceeds {limit}-byte budget")
    return errors


def validate_main_page_dependencies() -> list[str]:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    return [
        f"index.html: legacy dependency reference remains: {reference}"
        for reference in sorted(LEGACY_REFERENCES)
        if reference.lower() in index.lower()
    ]


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        print("No HTML files found", file=sys.stderr)
        return 1

    errors = [error for page in pages for error in validate_page(page)]
    errors.extend(validate_size_limits())
    errors.extend(validate_main_page_dependencies())

    if errors:
        print("Static site validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Validated {len(pages)} HTML pages successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
