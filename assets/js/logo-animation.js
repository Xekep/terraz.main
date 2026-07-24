(function () {
  "use strict";

  function animateLogoPath(logoHost, path) {
    var length = typeof path.getTotalLength === "function" ? path.getTotalLength() : 3000;

    path.getAnimations().forEach(function (animation) {
      animation.cancel();
    });

    path.style.animation = "none";
    path.style.fill = "none";
    path.style.fillOpacity = "0";
    path.style.stroke = "#ffffff";
    path.style.strokeWidth = "1.15";
    path.style.strokeLinecap = "round";
    path.style.strokeLinejoin = "round";
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.style.vectorEffect = "non-scaling-stroke";
    path.style.filter = "none";
    path.style.opacity = "1";

    var drawing = path.animate([
      {
        offset: 0,
        stroke: "#ffffff",
        strokeDashoffset: length,
        opacity: 0.28,
      },
      {
        offset: 0.14,
        stroke: "#ffffff",
        strokeDashoffset: length * 0.9,
        opacity: 1,
      },
      {
        offset: 0.55,
        stroke: "#ffffff",
        strokeDashoffset: length * 0.43,
        opacity: 1,
      },
      {
        offset: 0.86,
        stroke: "#ffffff",
        strokeDashoffset: length * 0.08,
        opacity: 1,
      },
      {
        offset: 1,
        stroke: "#ffffff",
        strokeDashoffset: 0,
        opacity: 1,
      },
    ], {
      duration: 4200,
      delay: 120,
      easing: "cubic-bezier(.42, .02, .2, 1)",
      fill: "forwards",
    });

    drawing.id = "terraz-logo-write";
    logoHost.dataset.drawingReady = "true";
    logoHost.dataset.pathLength = String(length);
  }

  async function setupLogoDrawing() {
    var logoHost = document.getElementById("hero-logo");
    if (!logoHost) {
      return;
    }

    var source = logoHost.dataset.logoSrc;
    if (!source) {
      logoHost.dataset.drawingReady = "fallback";
      return;
    }

    try {
      var response = await fetch(source, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Logo SVG request failed with HTTP " + response.status);
      }

      var svgText = await response.text();
      var parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
      if (parsed.querySelector("parsererror")) {
        throw new Error("Logo SVG could not be parsed");
      }

      parsed.querySelectorAll("style, script, title").forEach(function (node) {
        node.remove();
      });

      var svg = document.importNode(parsed.documentElement, true);
      svg.classList.add("hero__logo-svg");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.background = "transparent";
      svg.style.overflow = "visible";

      var path = svg.querySelector(".title-letter");
      if (!path) {
        throw new Error("Logo SVG path is missing");
      }

      logoHost.replaceChildren(svg);
      animateLogoPath(logoHost, path);
    } catch (error) {
      console.error("Unable to initialize TerraZ logo drawing", error);
      logoHost.dataset.drawingReady = "fallback";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupLogoDrawing, { once: true });
  } else {
    setupLogoDrawing();
  }
}());
