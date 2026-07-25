(function () {
  "use strict";

  var TOTAL_DRAWING_DURATION = 4200;
  var DRAWING_DELAY = 120;
  var MASK_ID = "terraz-logo-reveal-mask";
  var REVEAL_STROKE_WIDTH = 8;

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

  function buildRevealMask(svg, finalGroup, finalPath) {
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

    var revealPath = finalPath.cloneNode(false);
    revealPath.removeAttribute("class");
    revealPath.removeAttribute("mask");
    revealPath.removeAttribute("style");
    revealPath.classList.add("logo-reveal-stroke");
    revealPath.setAttribute("fill", "none");
    revealPath.setAttribute("stroke", "white");
    revealPath.setAttribute("stroke-width", String(REVEAL_STROKE_WIDTH));
    revealPath.setAttribute("stroke-linecap", "round");
    revealPath.setAttribute("stroke-linejoin", "round");
    mask.appendChild(revealPath);

    defs.appendChild(mask);
    finalGroup.setAttribute("mask", "url(#" + MASK_ID + ")");
    return revealPath;
  }

  function animateRevealStroke(logoHost, path) {
    var length = typeof path.getTotalLength === "function" ? path.getTotalLength() : 3000;
    path.style.transitionProperty = "none";
    path.style.transitionDuration = "0s";
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.dataset.logoOrder = "0";
    path.dataset.logoLength = String(length);

    var drawing = path.animate([
      { strokeDashoffset: length },
      { strokeDashoffset: 0 }
    ], {
      duration: TOTAL_DRAWING_DURATION,
      delay: DRAWING_DELAY,
      easing: "cubic-bezier(.42, .02, .2, 1)",
      fill: "forwards",
      direction: "normal",
      iterations: 1
    });

    drawing.id = "terraz-logo-reveal";
    drawing.finished.then(function () {
      path.style.strokeDashoffset = "0";
    }).catch(function () {});

    logoHost.dataset.drawingReady = "true";
    logoHost.dataset.pathLength = String(length);
    logoHost.dataset.strokeCount = "1";
    logoHost.dataset.drawingDuration = String(TOTAL_DRAWING_DURATION);
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
      var revealPath = buildRevealMask(svg, finalGroup, finalPath);
      logoHost.replaceChildren(svg);
      animateRevealStroke(logoHost, revealPath);
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
