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

      logoDocument.documentElement.style.backgroundColor = "transparent";
      logoDocument.documentElement.style.overflow = "visible";

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
      logoObject.dataset.drawingReady = "true";
      logoObject.dataset.pathLength = String(length);
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
