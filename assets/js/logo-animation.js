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

      path.getAnimations().forEach(function (animation) {
        animation.cancel();
      });

      path.style.animation = "none";
      path.style.fill = "rgba(31, 184, 178, .12)";
      path.style.fillOpacity = "0";
      path.style.stroke = "#1fb8b2";
      path.style.strokeLinecap = "round";
      path.style.strokeLinejoin = "round";
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);

      var drawing = path.animate([
        {
          offset: 0,
          fillOpacity: 0,
          stroke: "#1fb8b2",
          strokeDashoffset: length,
        },
        {
          offset: 0.58,
          fillOpacity: 0.03,
          stroke: "#71e7df",
          strokeDashoffset: length * 0.31,
        },
        {
          offset: 0.88,
          fillOpacity: 0.08,
          stroke: "#d9ffff",
          strokeDashoffset: length * 0.045,
        },
        {
          offset: 1,
          fillOpacity: 0.12,
          stroke: "#efffff",
          strokeDashoffset: 0,
        },
      ], {
        duration: 3800,
        delay: 180,
        easing: "cubic-bezier(.4, 0, .2, 1)",
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
