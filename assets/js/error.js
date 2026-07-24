(function () {
  "use strict";

  var remaining = 7;
  var output = document.getElementById("seconds");
  if (!output) {
    return;
  }

  var timer = window.setInterval(function () {
    remaining -= 1;
    output.textContent = String(remaining);

    if (remaining > 0) {
      return;
    }

    window.clearInterval(timer);
    document.body.classList.add("is-leaving");
    window.setTimeout(function () {
      window.location.replace("/");
    }, 450);
  }, 1000);
}());
