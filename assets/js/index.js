(function () {
  "use strict";

  var VIDEO_ID = "T3K2Fc4t93Y";
  var MOBILE_QUERY = "(pointer: coarse), (max-width: 767px)";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  var copyResetTimer = null;
  var playerFrame = null;
  var videoPaused = false;
  var videoMuted = true;

  function matchesMedia(query) {
    return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  }

  function shouldLoadVideo() {
    return !matchesMedia(MOBILE_QUERY) && !matchesMedia(REDUCED_MOTION_QUERY);
  }

  function sendPlayerCommand(command) {
    if (!playerFrame || !playerFrame.contentWindow) {
      return;
    }

    playerFrame.contentWindow.postMessage(JSON.stringify({
      event: "command",
      func: command,
      args: []
    }), "https://www.youtube-nocookie.com");
  }

  function createVideoBackground() {
    var container = document.getElementById("hero-video");
    if (!container || !shouldLoadVideo()) {
      return;
    }

    var query = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "0",
      disablekb: "1",
      enablejsapi: "1",
      fs: "0",
      iv_load_policy: "3",
      loop: "1",
      modestbranding: "1",
      playlist: VIDEO_ID,
      playsinline: "1",
      rel: "0",
      start: "12"
    });

    if (window.location.origin && window.location.origin !== "null") {
      query.set("origin", window.location.origin);
    }

    playerFrame = document.createElement("iframe");
    playerFrame.src = "https://www.youtube-nocookie.com/embed/" + VIDEO_ID + "?" + query.toString();
    playerFrame.title = "Фоновое видео TerraZ";
    playerFrame.tabIndex = -1;
    playerFrame.allow = "autoplay; encrypted-media; picture-in-picture";
    playerFrame.referrerPolicy = "strict-origin-when-cross-origin";
    playerFrame.setAttribute("aria-hidden", "true");

    playerFrame.addEventListener("load", function () {
      document.body.classList.add("has-video");
      sendPlayerCommand("mute");
      sendPlayerCommand("playVideo");
    });

    container.replaceChildren(playerFrame);
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      console.error("Не удалось скопировать адрес сервера", error);
    }

    textarea.remove();
    return copied;
  }

  function showCopyStatus(button, status, message) {
    var label = button.querySelector(".server-copy__label");

    window.clearTimeout(copyResetTimer);
    button.classList.add("is-copied");
    status.textContent = message;
    status.classList.add("is-visible");

    if (label) {
      label.textContent = "Скопировано";
    }

    copyResetTimer = window.setTimeout(function () {
      button.classList.remove("is-copied");
      status.classList.remove("is-visible");

      if (label) {
        label.textContent = "Копировать";
      }
    }, 1500);
  }

  function setupClipboard() {
    var button = document.getElementById("server-copy");
    var status = document.getElementById("copy-status");
    if (!button || !status) {
      return;
    }

    button.addEventListener("click", function () {
      var address = button.dataset.address || "S.TERRAZ.RU:7777";
      var modernCopy = navigator.clipboard && window.isSecureContext
        ? navigator.clipboard.writeText(address)
        : null;

      if (modernCopy) {
        modernCopy.then(function () {
          showCopyStatus(button, status, "Адрес скопирован");
        }).catch(function () {
          if (fallbackCopy(address)) {
            showCopyStatus(button, status, "Адрес скопирован");
          } else {
            showCopyStatus(button, status, "Не удалось скопировать");
          }
        });
        return;
      }

      showCopyStatus(
        button,
        status,
        fallbackCopy(address) ? "Адрес скопирован" : "Не удалось скопировать"
      );
    });
  }

  function setupVideoControls() {
    var pauseButton = document.getElementById("video-pause");
    var volumeButton = document.getElementById("video-volume");
    if (!pauseButton || !volumeButton) {
      return;
    }

    pauseButton.addEventListener("click", function () {
      videoPaused = !videoPaused;
      sendPlayerCommand(videoPaused ? "pauseVideo" : "playVideo");
      pauseButton.setAttribute(
        "aria-label",
        videoPaused ? "Продолжить фоновое видео" : "Приостановить фоновое видео"
      );
      pauseButton.firstElementChild.textContent = videoPaused ? "▶" : "Ⅱ";
    });

    volumeButton.addEventListener("click", function () {
      videoMuted = !videoMuted;
      sendPlayerCommand(videoMuted ? "mute" : "unMute");
      volumeButton.setAttribute(
        "aria-label",
        videoMuted ? "Включить звук фонового видео" : "Выключить звук фонового видео"
      );
      volumeButton.firstElementChild.textContent = videoMuted ? "×" : "●";
    });

    document.addEventListener("visibilitychange", function () {
      if (!playerFrame) {
        return;
      }

      if (document.hidden) {
        sendPlayerCommand("pauseVideo");
      } else if (!videoPaused) {
        sendPlayerCommand("playVideo");
      }
    });
  }

  function initialize() {
    setupClipboard();
    setupVideoControls();
    createVideoBackground();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
}());
