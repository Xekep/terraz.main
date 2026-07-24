(function () {
  "use strict";

  function setupLogoDrawing() {
    var logoObject = document.getElementById("hero-logo-object");
    if (!logoObject) {
      return;
    }

    function activateDrawing() {
      var logoDocument = logoObject.contentDocument;
      if (!logoDocument) {
        return;
      }

      var path = logoDocument.querySelector(".title-letter");
      if (!path) {
        return;
      }

      var length = typeof path.getTotalLength === "function" ? path.getTotalLength() : 3000;
      path.style.setProperty("--logo-path-length", String(length));

      var style = logoDocument.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = [
        ".title-letter {",
        "  fill: rgba(31, 184, 178, .12) !important;",
        "  stroke: #efffff !important;",
        "  stroke-linecap: round;",
        "  stroke-linejoin: round;",
        "  stroke-dasharray: var(--logo-path-length) !important;",
        "  stroke-dashoffset: var(--logo-path-length) !important;",
        "  animation: terraz-logo-write 3.8s cubic-bezier(.4, 0, .2, 1) .18s forwards !important;",
        "}",
        "@keyframes terraz-logo-write {",
        "  0% { fill-opacity: 0; stroke: #1fb8b2; stroke-dashoffset: var(--logo-path-length); }",
        "  58% { fill-opacity: .03; stroke: #71e7df; }",
        "  88% { fill-opacity: .08; }",
        "  100% { fill-opacity: .12; stroke: #efffff; stroke-dashoffset: 0; }",
        "}",
      ].join("\n");
      logoDocument.documentElement.appendChild(style);

      path.style.animation = "none";
      path.getBoundingClientRect();
      path.style.animation = "";
      logoObject.dataset.drawingReady = "true";
    }

    logoObject.addEventListener("load", activateDrawing, { once: true });
    if (logoObject.contentDocument && logoObject.contentDocument.readyState === "complete") {
      activateDrawing();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupLogoDrawing, { once: true });
  } else {
    setupLogoDrawing();
  }
}());
