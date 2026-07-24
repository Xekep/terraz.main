(function () {
  "use strict";

  var VIDEO_ID = "T3K2Fc4t93Y";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  var copyResetTimer = null;
  var player = null;
  var playerReady = false;
  var videoPaused = false;
  var videoMuted = true;
  var apiTimeout = null;

  function matchesMedia(query) {
    return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  }

  function shouldLoadVideo() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !matchesMedia(REDUCED_MOTION_QUERY) && !(connection && connection.saveData);
  }

  function setPauseButtonState(paused) {
    var pauseButton = document.getElementById("video-pause");
    if (!pauseButton) {
      return;
    }

    pauseButton.setAttribute(
      "aria-label",
      paused ? "Продолжить фоновое видео" : "Приостановить фоновое видео"
    );
    pauseButton.firstElementChild.textContent = paused ? "▶" : "Ⅱ";
  }

  function setVolumeButtonState(muted) {
    var volumeButton = document.getElementById("video-volume");
    if (!volumeButton) {
      return;
    }

    volumeButton.setAttribute(
      "aria-label",
      muted ? "Включить звук фонового видео" : "Выключить звук фонового видео"
    );
    volumeButton.firstElementChild.textContent = muted ? "×" : "●";
  }

  function markVideoReady() {
    document.body.classList.add("video-ready");
    window.clearTimeout(apiTimeout);
  }

  function handlePlayerReady(event) {
    playerReady = true;
    markVideoReady();

    var frame = event.target.getIframe();
    if (frame) {
      frame.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      frame.title = "Фоновое видео TerraZ";
    }

    event.target.mute();
    event.target.seekTo(12, true);
    event.target.playVideo();
    videoMuted = true;
    videoPaused = false;
    setVolumeButtonState(videoMuted);
    setPauseButtonState(videoPaused);
  }

  function handlePlayerStateChange(event) {
    if (!window.YT || !window.YT.PlayerState) {
      return;
    }

    if (event.data === window.YT.PlayerState.PLAYING) {
      document.body.classList.add("has-video");
      videoPaused = false;
      setPauseButtonState(false);
      return;
    }

    if (event.data === window.YT.PlayerState.PAUSED) {
      videoPaused = true;
      setPauseButtonState(true);
      return;
    }

    if (event.data === window.YT.PlayerState.ENDED) {
      event.target.seekTo(12, true);
      event.target.playVideo();
    }
  }

  function handleAutoplayBlocked() {
    markVideoReady();
    videoPaused = true;
    setPauseButtonState(true);
  }

  function handlePlayerError() {
    document.body.classList.remove("has-video", "video-ready");
    document.body.classList.add("video-error");
  }

  function createYouTubePlayer() {
    var container = document.getElementById("hero-video");
    if (!container || !window.YT || typeof window.YT.Player !== "function") {
      return;
    }

    player = new window.YT.Player(container, {
      videoId: VIDEO_ID,
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 1,
        modestbranding: 1,
        mute: 1,
        origin: window.location.origin,
        playlist: VIDEO_ID,
        playsinline: 1,
        rel: 0,
        start: 12
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handlePlayerStateChange,
        onAutoplayBlocked: handleAutoplayBlocked,
        onError: handlePlayerError
      }
    });
  }

  function loadYouTubeApi() {
    if (!shouldLoadVideo()) {
      return;
    }

    if (window.YT && typeof window.YT.Player === "function") {
      createYouTubePlayer();
      return;
    }

    window.onYouTubeIframeAPIReady = createYouTubePlayer;

    var script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = handlePlayerError;
    document.head.appendChild(script);

    apiTimeout = window.setTimeout(function () {
      if (!playerReady) {
        handlePlayerError();
      }
    }, 12000);
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
    }, 1600);
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
      if (!playerReady || !player) {
        return;
      }

      if (videoPaused) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    });

    volumeButton.addEventListener("click", function () {
      if (!playerReady || !player) {
        return;
      }

      videoMuted = !videoMuted;
      if (videoMuted) {
        player.mute();
      } else {
        player.unMute();
      }
      setVolumeButtonState(videoMuted);
    });

    document.addEventListener("visibilitychange", function () {
      if (!playerReady || !player) {
        return;
      }

      if (document.hidden) {
        player.pauseVideo();
      } else if (!videoPaused) {
        player.playVideo();
      }
    });
  }

  function initialize() {
    setupClipboard();
    setupVideoControls();
    loadYouTubeApi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
}());
