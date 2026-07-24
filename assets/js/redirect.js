(function () {
  "use strict";

  var target = document.body.dataset.redirectUrl;
  if (!target) {
    return;
  }

  window.location.replace(target);
}());
