(function () {
  "use strict";

  var DEFAULT_LOOP_START = 12;
  var copyResetTimer = null;
  var videoElement = null;
  var videoReady = false;
  var videoMuted = true;
  var userPaused = false;
  var pausedByVisibility = false;

  function getLoopStart() {
    if (!videoElement) {
      return DEFAULT_LOOP_START;
    }

    var configuredStart = Number(videoElement.dataset.loopStart);
    var requestedStart = Number.isFinite(configuredStart) ? configuredStart : DEFAULT_LOOP_START;

    if (Number.isFinite(videoElement.duration) && videoElement.duration > 0) {
      return Math.min(Math.max(requestedStart, 0), Math.max(videoElement.duration - 0.25, 0));
    }

    return Math.max(requestedStart, 0);
  }

  function seekToLoopStart() {
    if (!videoElement || videoElement.readyState < 1) {
      return;
    }

    try {
      videoElement.currentTime = getLoopStart();
    } catch (error) {
      console.error("Не удалось установить старт фонового видео", error);
    }
  }

  function setPauseButtonState(paused) {
    var pauseButton = document.getElementById("video-pause");
    if (!pauseButton) {
      return;
    }

    pauseButton.dataset.state = paused ? "paused" : "playing";
    pauseButton.setAttribute("aria-pressed", paused ? "true" : "false");
    pauseButton.setAttribute(
      "aria-label",
      paused ? "Продолжить фоновое видео" : "Приостановить фоновое видео"
    );
  }

  function setVolumeButtonState(muted) {
    var volumeButton = document.getElementById("video-volume");
    if (!volumeButton) {
      return;
    }

    volumeButton.dataset.muted = muted ? "true" : "false";
    volumeButton.setAttribute("aria-pressed", muted ? "false" : "true");
    volumeButton.setAttribute(
      "aria-label",
      muted ? "Включить звук фонового видео" : "Выключить звук фонового видео"
    );
  }

  function markVideoReady() {
    videoReady = true;
    document.body.classList.add("video-ready");
  }

  function handleVideoError(error) {
    document.body.classList.remove("has-video", "video-ready");
    document.body.classList.add("video-error");

    if (error) {
      console.error("Не удалось загрузить фоновое видео", error);
    }
  }

  function handleAutoplayBlocked(error) {
    markVideoReady();
    userPaused = true;
    setPauseButtonState(true);

    if (error && error.name !== "NotAllowedError" && error.name !== "AbortError") {
      handleVideoError(error);
    }
  }

  function playBackgroundVideo() {
    if (!videoElement) {
      return;
    }

    var playback = videoElement.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(handleAutoplayBlocked);
    }
  }

  function handleLoadedMetadata() {
    seekToLoopStart();
    markVideoReady();

    if (!userPaused && !document.hidden) {
      playBackgroundVideo();
    }
  }

  function handleVideoPlaying() {
    markVideoReady();
    document.body.classList.remove("video-error");
    document.body.classList.add("has-video");
    setPauseButtonState(false);
  }

  function handleVideoEnded() {
    seekToLoopStart();

    if (!userPaused && !document.hidden) {
      playBackgroundVideo();
    }
  }

  function setupStaticVideo() {
    videoElement = document.getElementById("hero-video-element");
    if (!videoElement) {
      return;
    }

    videoElement.autoplay = true;
    videoElement.defaultMuted = true;
    videoElement.muted = true;
    videoElement.volume = 1;
    videoMuted = true;

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("canplay", markVideoReady);
    videoElement.addEventListener("playing", handleVideoPlaying);
    videoElement.addEventListener("pause", function () {
      setPauseButtonState(true);
    });
    videoElement.addEventListener("ended", handleVideoEnded);
    videoElement.addEventListener("error", function () {
      handleVideoError(videoElement.error);
    });

    setVolumeButtonState(true);
    setPauseButtonState(false);

    if (videoElement.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      videoElement.preload = "auto";
      videoElement.load();
    }
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

  function showCopyStatus(button, status, success) {
    var label = button.querySelector(".server-copy__label");
    var icon = button.querySelector(".server-copy__icon");
    var message = success ? "Скопировано" : "Не скопировано";

    window.clearTimeout(copyResetTimer);
    button.classList.toggle("is-copied", success);
    status.textContent = message;
    status.classList.remove("is-visible");
    void status.offsetWidth;
    status.classList.add("is-visible");

    if (label) {
      label.textContent = message;
    }
    if (icon) {
      icon.textContent = success ? "✓" : "!";
    }

    copyResetTimer = window.setTimeout(function () {
      button.classList.remove("is-copied");
      status.classList.remove("is-visible");
      if (label) {
        label.textContent = "Копировать";
      }
      if (icon) {
        icon.textContent = "⧉";
      }
    }, 1700);
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
          showCopyStatus(button, status, true);
        }).catch(function () {
          showCopyStatus(button, status, fallbackCopy(address));
        });
        return;
      }

      showCopyStatus(button, status, fallbackCopy(address));
    });
  }

  function setupVideoControls() {
    var pauseButton = document.getElementById("video-pause");
    var volumeButton = document.getElementById("video-volume");
    if (!pauseButton || !volumeButton) {
      return;
    }

    pauseButton.addEventListener("click", function () {
      if (!videoElement || !videoReady) {
        return;
      }

      if (videoElement.paused) {
        userPaused = false;
        pausedByVisibility = false;
        playBackgroundVideo();
      } else {
        userPaused = true;
        videoElement.pause();
      }
    });

    volumeButton.addEventListener("click", function () {
      if (!videoElement || !videoReady) {
        return;
      }

      videoMuted = !videoMuted;
      videoElement.muted = videoMuted;
      setVolumeButtonState(videoMuted);
    });

    document.addEventListener("visibilitychange", function () {
      if (!videoElement || !videoReady) {
        return;
      }

      if (document.hidden && !videoElement.paused) {
        pausedByVisibility = true;
        videoElement.pause();
        return;
      }

      if (!document.hidden && pausedByVisibility && !userPaused) {
        pausedByVisibility = false;
        playBackgroundVideo();
      }
    });
  }

  function initialize() {
    setupClipboard();
    setupStaticVideo();
    setupVideoControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
}());