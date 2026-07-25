(function () {
  "use strict";

  var TOTAL_DRAWING_DURATION = 4200;
  var DRAWING_DELAY = 120;
  var STROKE_GAP = 30;
  var MASK_ID = "terraz-logo-reveal-mask";
  var REVEAL_PATHS = [
    "M27 43 C23 33 28 26 38 26 C54 26 67 39 82 40 C99 42 116 42 129 36",
    "M58 21 C58 49 58 82 60 123 C67 109 74 101 83 98 C94 95 103 89 103 83 C103 78 98 75 92 76 C81 77 74 86 74 97 C74 106 81 111 90 110 C100 108 109 100 113 88",
    "M104 110 C104 99 104 88 105 81 C108 85 111 88 116 88 C121 88 124 85 128 82",
    "M130 110 C130 99 130 88 131 81 C134 85 137 88 142 88 C147 88 151 85 155 82",
    "M179 82 C172 78 162 79 157 85 C150 93 152 105 161 110 C170 114 179 107 180 97 C181 89 177 83 170 81",
    "M180 111 C181 98 181 86 182 79",
    "M188 40 C198 46 208 42 216 32 C215 55 207 78 196 101 C190 112 184 124 181 133 C200 125 218 112 226 95 C230 88 230 83 227 82 C224 81 222 84 223 88 C224 91 227 91 229 88"
  ];

  function createSvgNode(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function prepareFinalLogo(finalPath) {
    finalPath.getAnimations().forEach(function (animation) {
      animation.cancel();
    });
    finalPath.removeAttribute("mask");
    finalPath.style.transitionProperty = "none";
    finalPath.style.transitionDuration = "0s";
    finalPath.style.animation = "none";
    finalPath.style.fill = "none";
    finalPath.style.fillOpacity = "0";
    finalPath.style.stroke = "#ffffff";
    finalPath.style.strokeWidth = "1.15";
    finalPath.style.strokeLinecap = "round";
    finalPath.style.strokeLinejoin = "round";
    finalPath.style.vectorEffect = "non-scaling-stroke";
    finalPath.style.filter = "none";
    finalPath.style.opacity = "1";
  }

  function wrapFinalLogo(finalPath) {
    var finalGroup = createSvgNode("g");
    finalGroup.classList.add("logo-final-shape");
    finalPath.parentNode.insertBefore(finalGroup, finalPath);
    finalGroup.appendChild(finalPath);
    return finalGroup;
  }

  function buildRevealMask(svg, finalGroup) {
    var defs = svg.querySelector("defs") || createSvgNode("defs");
    if (!defs.parentNode) {
      svg.insertBefore(defs, svg.firstChild);
    }

    var oldMask = defs.querySelector("#" + MASK_ID);
    if (oldMask) {
      oldMask.remove();
    }

    var viewBox = svg.viewBox.baseVal;
    var mask = createSvgNode("mask");
    mask.id = MASK_ID;
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    mask.setAttribute("maskContentUnits", "userSpaceOnUse");
    mask.setAttribute("x", String(viewBox.x));
    mask.setAttribute("y", String(viewBox.y));
    mask.setAttribute("width", String(viewBox.width));
    mask.setAttribute("height", String(viewBox.height));
    mask.style.maskType = "luminance";

    var background = createSvgNode("rect");
    background.setAttribute("x", String(viewBox.x));
    background.setAttribute("y", String(viewBox.y));
    background.setAttribute("width", String(viewBox.width));
    background.setAttribute("height", String(viewBox.height));
    background.setAttribute("fill", "black");
    mask.appendChild(background);

    var revealGroup = createSvgNode("g");
    revealGroup.setAttribute("fill", "none");
    revealGroup.setAttribute("stroke", "white");
    revealGroup.setAttribute("stroke-width", "18");
    revealGroup.setAttribute("stroke-linecap", "round");
    revealGroup.setAttribute("stroke-linejoin", "round");

    var revealPaths = REVEAL_PATHS.map(function (data, index) {
      var path = createSvgNode("path");
      path.classList.add("logo-reveal-stroke");
      path.dataset.order = String(index);
      path.setAttribute("d", data);
      revealGroup.appendChild(path);
      return path;
    });

    mask.appendChild(revealGroup);
    defs.appendChild(mask);
    finalGroup.setAttribute("mask", "url(#" + MASK_ID + ")");
    return revealPaths;
  }

  function animateRevealStrokes(logoHost, strokes) {
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
      path.style.transitionProperty = "none";
      path.style.transitionDuration = "0s";
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      path.dataset.logoOrder = String(index);
      path.dataset.logoLength = String(length);

      var drawing = path.animate([
        { strokeDashoffset: length },
        { strokeDashoffset: 0 }
      ], {
        duration: duration,
        delay: nextDelay,
        easing: "cubic-bezier(.42, .02, .2, 1)",
        fill: "forwards",
        direction: "normal",
        iterations: 1
      });

      drawing.id = "terraz-logo-reveal-" + index;
      drawing.finished.then(function () {
        path.style.strokeDashoffset = "0";
      }).catch(function () {});
      nextDelay += duration + STROKE_GAP;
    });

    logoHost.dataset.drawingReady = "true";
    logoHost.dataset.pathLength = String(totalLength);
    logoHost.dataset.strokeCount = String(strokes.length);
    logoHost.dataset.drawingDuration = String(nextDelay - DRAWING_DELAY - STROKE_GAP);
    logoHost.dataset.logoMode = "masked-original";
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

      var finalPath = svg.querySelector(".title-letter");
      if (!finalPath) {
        throw new Error("Original TerraZ logo path is missing");
      }

      prepareFinalLogo(finalPath);
      var finalGroup = wrapFinalLogo(finalPath);
      var revealPaths = buildRevealMask(svg, finalGroup);
      logoHost.replaceChildren(svg);
      animateRevealStrokes(logoHost, revealPaths);
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
