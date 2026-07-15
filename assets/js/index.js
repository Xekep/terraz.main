(function ($, window, document) {
  "use strict";

  var VIDEO_URL = "https://www.youtube.com/watch?v=T3K2Fc4t93Y";
  var FALLBACK_IMAGE = "assets/images/1.jpg";
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isLikelyMobile = window.matchMedia && window.matchMedia("(pointer: coarse), (max-width: 767px)").matches;

  function improveDocumentMetadata() {
    document.documentElement.lang = "ru";

    var viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute("content", "width=device-width, initial-scale=1");
    }
  }

  function loadVisualRefinements() {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "assets/css/visual-refinements.css";
    document.head.appendChild(link);
  }

  function addAccessibilityStyles() {
    var style = document.createElement("style");
    style.textContent = [
      ".social-link:focus-visible{outline:3px solid rgba(31,184,178,.9);outline-offset:4px}",
      ".hero .front-content .controls button{border:0;background:transparent;padding:0;color:inherit}",
      "@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  function setupComposition() {
    var container = document.querySelector(".hero-1 .front-content .container-mid");
    if (!container) {
      return;
    }

    var cycleWrapper = container.querySelector(".cycle-wrapper");
    var cycle = container.querySelector("#cycle");
    var socialRow = null;
    var addressRow = null;
    var paragraphs = container.getElementsByTagName("p");
    var index;

    for (index = 0; index < paragraphs.length; index += 1) {
      if (!socialRow && paragraphs[index].querySelector('a[href*="vk.com"]')) {
        socialRow = paragraphs[index];
      }
      if (!addressRow && paragraphs[index].querySelector("url")) {
        addressRow = paragraphs[index];
      }
    }

    container.classList.add("hero-composition");

    if (cycleWrapper) {
      cycleWrapper.classList.add("hero-message-block");
    }

    if (cycle) {
      cycle.innerHTML =
        '<div class="slide hero-message">' +
          '<h1>ИГРАЙ<br>УЖЕ СЕЙЧАС</h1>' +
          '<div class="hero-subtitle">Лучший русскоязычный сервер Terraria</div>' +
        "</div>";
    }

    if (addressRow) {
      addressRow.classList.add("server-address-row");

      var copyPanel = addressRow.querySelector("mark");
      if (copyPanel) {
        copyPanel.classList.add("server-copy");

        if (!copyPanel.querySelector(".copy-action")) {
          var copyAction = document.createElement("span");
          copyAction.className = "copy-action";
          copyAction.setAttribute("aria-hidden", "true");
          copyAction.innerHTML =
            '<i class="fa fa-files-o" aria-hidden="true"></i>' +
            '<span class="copy-action-label">Копировать</span>';
          copyPanel.appendChild(copyAction);
        }
      }
    }

    if (socialRow) {
      socialRow.classList.add("social-links-row");
    }

    var secondaryLinks = container.querySelector(".hero-secondary-links");
    if (!secondaryLinks) {
      secondaryLinks = document.createElement("nav");
      secondaryLinks.className = "hero-secondary-links";
      secondaryLinks.setAttribute("aria-label", "Дополнительные способы подключения");
      secondaryLinks.innerHTML =
        '<a href="steam://rungameid/105600// -j s.terraz.ru -p 7777">Запустить через Steam</a>' +
        '<span aria-hidden="true">•</span>' +
        '<a href="https://fun.terraz.ru/">FUN.TERRAZ.RU</a>';
    }

    if (cycleWrapper && addressRow) {
      cycleWrapper.insertAdjacentElement("afterend", addressRow);
    }

    if (addressRow) {
      addressRow.insertAdjacentElement("afterend", secondaryLinks);
    } else if (cycleWrapper) {
      cycleWrapper.insertAdjacentElement("afterend", secondaryLinks);
    }

    if (socialRow) {
      secondaryLinks.insertAdjacentElement("afterend", socialRow);
    }
  }

  function labelSocialLinks() {
    var labels = [
      ["vk.com", "TerraZ во ВКонтакте"],
      ["youtube.com", "TerraZ на YouTube"],
      ["/conference", "Конференция TerraZ в Discord"],
      ["t.me", "Обсуждение TerraZ в Telegram"],
      ["twitch.tv", "TerraZ на Twitch"]
    ];

    $(".front-content a[href]").each(function () {
      var link = this;
      var href = link.getAttribute("href") || "";

      labels.some(function (item) {
        if (href.indexOf(item[0]) === -1) {
          return false;
        }

        link.classList.add("social-link");
        link.setAttribute("aria-label", item[1]);
        link.setAttribute("title", item[1]);
        return true;
      });
    });
  }

  function showCopiedState(statusElement, trigger) {
    if (statusElement) {
      statusElement.classList.add("copied");
      statusElement.setAttribute("aria-live", "polite");
    }

    if (trigger) {
      trigger.classList.add("is-copied");
      var actionLabel = trigger.querySelector(".copy-action-label");
      if (actionLabel) {
        actionLabel.textContent = "Скопировано";
      }
    }

    window.setTimeout(function () {
      if (statusElement) {
        statusElement.classList.remove("copied");
      }

      if (trigger) {
        trigger.classList.remove("is-copied");
        var actionLabel = trigger.querySelector(".copy-action-label");
        if (actionLabel) {
          actionLabel.textContent = "Копировать";
        }
      }
    }, 1300);
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      console.error("Copy failed", error);
    }

    document.body.removeChild(textarea);
    return copied;
  }

  function setupClipboard() {
    var serverAddress = document.querySelector("url");
    var copiedStatus = document.getElementById("copy");
    var trigger = document.querySelector(".server-copy") || serverAddress;

    if (!serverAddress || !trigger) {
      return;
    }

    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", "Скопировать адрес сервера S.TERRAZ.RU:7777");

    function completeCopy() {
      showCopiedState(copiedStatus, trigger);
    }

    function copyAddress() {
      var text = serverAddress.textContent.trim();

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(completeCopy).catch(function (error) {
          console.error("Copy failed", error);
          if (fallbackCopy(text)) {
            completeCopy();
          }
        });
        return;
      }

      if (fallbackCopy(text)) {
        completeCopy();
      }
    }

    trigger.addEventListener("click", copyAddress);
    trigger.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        copyAddress();
      }
    });
  }

  function showStaticBackground() {
    var background = $(".bg-image");

    $(".bg-video").empty();

    if ($.fn.vegas) {
      background.vegas({
        slides: [{ src: FALLBACK_IMAGE }],
        timer: false,
        transitionDuration: prefersReducedMotion ? 0 : 500
      });
      return;
    }

    background.css({
      backgroundImage: "url(" + FALLBACK_IMAGE + ")",
      backgroundPosition: "center",
      backgroundSize: "cover",
      opacity: 1
    });
  }

  function setupVideoBackground() {
    if (prefersReducedMotion || isLikelyMobile || !$.fn.mb_YTPlayer) {
      showStaticBackground();
      return;
    }

    var player = $("<div>", {
      id: "bg-youtube",
      class: "player showOn-video-bg"
    });

    player.attr("data-property", JSON.stringify({
      videoURL: VIDEO_URL,
      containment: ".bg-video",
      autoPlay: true,
      mute: true,
      startAt: 12,
      stopAt: 208,
      loop: true,
      opacity: 1,
      stopMovieOnBlur: false,
      showControls: false
    }));

    $(".bg-video").empty().append(player);

    try {
      player.mb_YTPlayer();
    } catch (error) {
      console.error("Video background failed", error);
      showStaticBackground();
      return;
    }

    var controls = $(
      '<div class="controls" aria-label="Управление фоновым видео">' +
        '<button type="button" class="pause-button ti-control-pause" aria-label="Приостановить фоновое видео"></button>' +
        '<button type="button" class="volume-button fa fa-volume-off" aria-label="Включить звук фонового видео"></button>' +
      "</div>"
    );

    $(".hero .front-content").append(controls);

    controls.find(".volume-button").on("click", function () {
      var button = $(this);
      if (player.hasClass("isMuted")) {
        player.YTPUnmute();
        button.removeClass("fa-volume-off").addClass("fa-volume-up");
        button.attr("aria-label", "Выключить звук фонового видео");
      } else {
        player.YTPMute();
        button.removeClass("fa-volume-up").addClass("fa-volume-off");
        button.attr("aria-label", "Включить звук фонового видео");
      }
    });

    controls.find(".pause-button").on("click", function () {
      var button = $(this);
      if (button.hasClass("ti-control-pause")) {
        player.YTPPause();
        button.removeClass("ti-control-pause").addClass("ti-control-play");
        button.attr("aria-label", "Продолжить фоновое видео");
      } else {
        player.YTPPlay();
        button.removeClass("ti-control-play").addClass("ti-control-pause");
        button.attr("aria-label", "Приостановить фоновое видео");
      }
    });

    window.setTimeout(function () {
      controls.addClass("show");
    }, 300);
  }

  function setupParallax() {
    if (prefersReducedMotion || isLikelyMobile || !$.fn.parallax) {
      return;
    }

    var hero = $(".hero").parallax({
      scalarX: 24,
      scalarY: 15,
      frictionX: 0.1,
      frictionY: 0.1
    });

    $(".hero").on("mouseenter", function () {
      hero.parallax("enable");
    }).on("mouseleave", function () {
      hero.parallax("disable");
    });
  }

  function revealPage() {
    $("#page-loader").addClass("hide-this");

    window.setTimeout(function () {
      $(".hero .background-content.page-enter-animated").addClass("show");
    }, prefersReducedMotion ? 0 : 150);

    window.setTimeout(function () {
      $(".hero .front-content.page-enter-animated").addClass("show");
    }, prefersReducedMotion ? 0 : 550);
  }

  improveDocumentMetadata();
  loadVisualRefinements();
  addAccessibilityStyles();

  $(function () {
    setupComposition();
    labelSocialLinks();
    setupClipboard();
    setupVideoBackground();
    setupParallax();
  });

  $(window).on("load", function () {
    window.setTimeout(revealPage, prefersReducedMotion ? 0 : 250);
  });
}(window.jQuery, window, document));