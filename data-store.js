/* ===========================================================
   SLOCO–YSG — shared data layer
   Used by BOTH the public site (render.js) and the admin
   dashboard (admin/admin.js), so edits made in the dashboard
   are immediately reflected on the public site when previewed
   in the same browser.

   Persistence model (this is a static site — no server/database):
     1. content.json  → the shipped baseline content.
     2. localStorage["sloco_content_v1"] → local edits made in
        the admin dashboard on THIS browser/device. When present,
        it overrides the baseline everywhere.
     3. The admin dashboard can export the merged result as a
        content.json file you download and redeploy, so edits
        become the new baseline for every visitor.
=========================================================== */

(function (global) {
  "use strict";

  var STORAGE_KEY = "sloco_content_v1";
  var BASE_PATH = (function () {
    // works whether this script is loaded from / or /admin/
    var script = document.currentScript || (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
    return script.src.replace(/data-store\.js.*$/, "");
  })();

  function contentUrl() {
    return BASE_PATH + "content.json?_=" + Date.now();
  }

  async function fetchBaseline() {
    var res = await fetch(BASE_PATH + "content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load content.json");
    return res.json();
  }

  function readLocalOverride() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("SLOCO store: could not read local override", e);
      return null;
    }
  }

  function writeLocalOverride(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function clearLocalOverride() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasLocalOverride() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  async function load() {
    var local = readLocalOverride();
    if (local) return { data: local, source: "local" };
    var baseline = await fetchBaseline();
    return { data: baseline, source: "baseline" };
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9);
  }

  global.SlocoStore = {
    STORAGE_KEY: STORAGE_KEY,
    load: load,
    fetchBaseline: fetchBaseline,
    readLocalOverride: readLocalOverride,
    writeLocalOverride: writeLocalOverride,
    clearLocalOverride: clearLocalOverride,
    hasLocalOverride: hasLocalOverride,
    uid: uid
  };
})(window);
