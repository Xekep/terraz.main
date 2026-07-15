#!/usr/bin/env python3
"""Validate the static TerraZ site without third-party dependencies."""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]
IGNORED_SCHEMES = {"data", "mailto", "steam", "tel", "javascript"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[tuple[str, str]] = []
        self.has_title = False
        self.html_language: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)

        if tag == "html":
            self.html_language = values.get("lang")
        elif tag == "title":
            self.has_title = True

        for attribute in ("href", "src"):
            value = values.get(attribute)
            if value:
                self.references.append((attribute, value))


def resolve_local_reference(page: Path, reference: str) -> Path | None:
    parsed = urlparse(reference)

    if parsed.scheme or parsed.netloc or reference.startswith("#"):
        return None
    if parsed.scheme in IGNORED_SCHEMES:
        return None

    clean_path = unquote(parsed.path)
    if not clean_path:
        return None

    if clean_path.startswith("/"):
        candidate = ROOT / clean_path.lstrip("/")
    else:
        candidate = page.parent / clean_path

    candidate = candidate.resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return candidate

    return candidate


def reference_exists(candidate: Path) -> bool:
    if candidate.exists():
        return True
    if candidate.suffix:
        return False
    if candidate.with_suffix(".html").exists():
        return True
    return (candidate / "index.html").exists()


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

    for attribute, reference in parser.references:
        parsed = urlparse(reference)
        if parsed.scheme in IGNORED_SCHEMES:
            continue

        candidate = resolve_local_reference(page, reference)
        if candidate is None:
            continue

        if not reference_exists(candidate):
            errors.append(
                f"{relative_page}: broken local {attribute}={reference!r} "
                f"(resolved to {candidate.relative_to(ROOT) if candidate.is_relative_to(ROOT) else candidate})"
            )

    return errors


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        print("No HTML files found", file=sys.stderr)
        return 1

    errors = [error for page in pages for error in validate_page(page)]

    if errors:
        print("Static site validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Validated {len(pages)} HTML pages successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
