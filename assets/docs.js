// =============================================================================
// Smart Supply Pro Docs — Runtime
// Theme toggle, mobile nav drawer, active-link marking, and Mermaid init.
// Lives outside the Pandoc template so regex/`$` characters never collide with
// Pandoc's variable syntax during the build.
// =============================================================================

// Guarded: the landing pages load docs.js but no Mermaid, so the global is absent.
if (typeof mermaid !== "undefined") {
  mermaid.initialize({ startOnLoad: true });
}

// Theme toggle flips the attribute tokens.css keys off and persists the choice.
var toggle = document.querySelector(".theme-toggle");
if (toggle) {
  toggle.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("ssp-theme", next); } catch (e) {}
  });
}

var menu = document.querySelector(".menu-btn");
if (menu) {
  menu.addEventListener("click", function () {
    document.querySelector(".layout").classList.toggle("nav-open");
  });
}

// Mark the current page in the sidebar at runtime, avoiding per-page build logic.
(function () {
  var here = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".sidebar a").forEach(function (a) {
    if (a.getAttribute("href").replace(/index\.html$/, "") === here) {
      a.setAttribute("aria-current", "page");
    }
  });
})();
