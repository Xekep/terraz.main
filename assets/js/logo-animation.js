(function () {
  "use strict";

  var TOTAL_DRAWING_DURATION = 4200;
  var DRAWING_DELAY = 120;
  var STROKE_GAP = 35;

  function prepareStroke(path, length) {
    path.getAnimations().forEach(function (animation) {
      animation.cancel();
    });

    path.style.transitionProperty = "none";
    path.style.transitionDuration = "0s";
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
  }

  function animateLogoStrokes(logoHost, strokes) {
    var lengths = strokes.map(function (path) {
      return typeof path.getTotalLength === "function" ? path.getTotalLength() : 100;
    });
    var totalLength = lengths.reduce(function (sum, length) {
      return sum + length;
    }, 0);
    var availableDuration = TOTAL_DRAWING_DURATION - STROKE_GAP * Math.max(strokes.length - 1, 0);
    var nextDelay = DRAWING_DELAY;

    strokes.forEach(function (path, index) {
      var length = lengths[index];
      var duration = Math.max(180, availableDuration * length / totalLength);

      prepareStroke(path, length);
      path.dataset.logoOrder = String(index);
      path.dataset.logoLength = String(length);

      var drawing = path.animate([
        {
          strokeDashoffset: length,
          opacity: index === 0 ? 0.28 : 1,
        },
        {
          strokeDashoffset: 0,
          opacity: 1,
        },
      ], {
        duration: duration,
        delay: nextDelay,
        easing: "cubic-bezier(.42, .02, .2, 1)",
        fill: "forwards",
        direction: "normal",
        iterations: 1,
      });

      drawing.id = "terraz-logo-write-" + index;
      nextDelay += duration + STROKE_GAP;
    });

    logoHost.dataset.drawingReady = "true";
    logoHost.dataset.pathLength = String(totalLength);
    logoHost.dataset.strokeCount = String(strokes.length);
    logoHost.dataset.drawingDuration = String(nextDelay - DRAWING_DELAY - STROKE_GAP);
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

      var strokes = Array.from(svg.querySelectorAll(".logo-stroke"));
      strokes.sort(function (left, right) {
        return Number(left.dataset.order) - Number(right.dataset.order);
      });
      if (strokes.length < 2) {
        throw new Error("Logo SVG single-pass strokes are missing");
      }

      logoHost.replaceChildren(svg);
      animateLogoStrokes(logoHost, strokes);
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
