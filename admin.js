(function () {
  "use strict";

  // ⚠️ IMPORTANT — read before publishing this repo publicly on GitHub:
  // This passcode is plain text in a client-side file. If this repo (or the
  // deployed site) is public, ANYONE can read it via "view source" or the
  // repo itself — it only stops casual/accidental edits on a shared device,
  // it is NOT real authentication. Change it below, and do not treat it as
  // a security boundary. For real access control, put this dashboard behind
  // a real login (a small backend, or a host-level password/IP allowlist).
  var ADMIN_PASSCODE = "sloco2026";
  var AUTH_KEY = "sloco_admin_auth";

  var state = { content: null, dirty: false, section: "overview" };

  /* ---------------- path get/set helpers ---------------- */
  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split(".");
    var o = obj;
    for (var i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = val;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  // content.json stores plain filenames (e.g. "hero-outreach.jpg") that sit
  // right next to both index.html and admin.html, so previews can use them
  // as-is — this only normalises full URLs/data-URIs, no path math needed.
  function adminSrc(v) {
    return v;
  }

  /* ---------------- toast ---------------- */
  function toast(msg, isError) {
    var stack = document.getElementById("toastStack");
    var t = document.createElement("div");
    t.className = "toast" + (isError ? " is-error" : "");
    t.textContent = msg;
    stack.appendChild(t);
    setTimeout(function () {
      t.style.opacity = "0"; t.style.transform = "translateY(6px)"; t.style.transition = "all .3s ease";
      setTimeout(function () { t.remove(); }, 320);
    }, 3200);
  }

  function markDirty() {
    state.dirty = true;
    document.getElementById("dirtyPill").hidden = false;
  }
  function markClean() {
    state.dirty = false;
    document.getElementById("dirtyPill").hidden = true;
  }

  /* ---------------- image field helper ----------------
     "Upload photo" embeds a resized copy of the picture directly into the
     field's value, so it shows up immediately once you click "Save changes"
     — no extra steps. It also downloads a plain image file to your computer
     at the same time: if you'd rather keep content.json small and host the
     picture as a real file (like the ones already in the repo), upload that
     downloaded file to GitHub and paste its filename into the field instead
     of the long embedded text. Either way works; embedding is just the
     easiest default. ---------------- */
  function slugifyFilename(name, ext) {
    var base = name.replace(/\.[^.]+$/, "");
    var slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) slug = "photo";
    return slug + "-" + Math.random().toString(36).slice(2, 6) + "." + ext;
  }

  function resizeImage(file, maxW, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxW / img.width);
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);

        var isPng = /png/i.test(file.type);
        var mime = isPng ? "image/png" : "image/jpeg";
        var ext = isPng ? "png" : "jpg";
        var filename = slugifyFilename(file.name, ext);
        var dataUrl = canvas.toDataURL(mime, isPng ? undefined : 0.85);

        canvas.toBlob(function (blob) {
          cb({ filename: filename, dataUrl: dataUrl, blob: blob });
        }, mime, isPng ? undefined : 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function downloadBlob(blob, filename) {
    var objectUrl = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = objectUrl; a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 4000);
  }

  function imageFieldHTML(fieldId, label, value, note) {
    return (
      '<div class="field"><label>' + esc(label) + '</label>' +
      '<div class="image-field">' +
      '<div class="preview" id="' + fieldId + '-preview">' + (value ? '<img src="' + esc(adminSrc(value)) + '">' : "&mdash;") + "</div>" +
      '<div class="image-field-controls">' +
      '<input type="text" id="' + fieldId + '-text" value="' + esc(value) + '" placeholder="photo-filename.jpg or paste a URL">' +
      '<div><label class="btn btn-outline btn-sm" style="cursor:pointer;">Upload photo<input type="file" accept="image/*" id="' + fieldId + '-file" hidden></label></div>' +
      '<p class="field-note">Shows up as soon as you click Save changes. A plain file also downloads, in case you\'d rather host it on GitHub instead.' + (note ? " " + esc(note) : "") + "</p>" +
      "</div></div></div>"
    );
  }

  function wireImageField(fieldId, onChange) {
    var text = document.getElementById(fieldId + "-text");
    var file = document.getElementById(fieldId + "-file");
    var preview = document.getElementById(fieldId + "-preview");
    function setPreview(v) { preview.innerHTML = v ? '<img src="' + esc(adminSrc(v)) + '">' : "&mdash;"; }
    text.addEventListener("input", function () { setPreview(text.value); onChange(text.value); markDirty(); });
    file.addEventListener("change", function () {
      if (!file.files[0]) return;
      resizeImage(file.files[0], 1100, function (result) {
        text.value = result.dataUrl;
        setPreview(result.dataUrl);
        onChange(result.dataUrl); markDirty();
        downloadBlob(result.blob, result.filename);
        toast("Photo added — click Save changes to see it live. (A lightweight copy, " + result.filename + ", also downloaded if you'd rather use a real file on GitHub instead.)");
      });
    });
  }

  /* ---------------- generic delegated binding for simple data-path fields ---------------- */
  function wirePanelInputs(root) {
    root.querySelectorAll("[data-path]").forEach(function (el) {
      var evt = (el.tagName === "SELECT" || el.type === "checkbox") ? "change" : "input";
      el.addEventListener(evt, function () {
        var val = el.type === "checkbox" ? el.checked : (el.type === "number" ? Number(el.value) : el.value);
        setPath(state.content, el.getAttribute("data-path"), val);
        markDirty();
      });
    });
  }

  /* ================================================================
     SIDEBAR
  ================================================================= */
  var NAV = [
    { type: "link", key: "overview", label: "Overview" },
    { type: "group", label: "Homepage" },
    { type: "link", key: "hero", label: "Hero & Stats" },
    { type: "link", key: "about", label: "About / Mission" },
    { type: "link", key: "ledger", label: "Impact Ledger" },
    { type: "link", key: "featured", label: "Featured Project" },
    { type: "group", label: "Collections" },
    { type: "link", key: "programs", label: "Programs (13)" },
    { type: "link", key: "gallery", label: "Photo Gallery" },
    { type: "link", key: "team", label: "Team & Contacts" },
    { type: "link", key: "partners", label: "Partners" },
    { type: "group", label: "Site Settings" },
    { type: "link", key: "identity", label: "Site Identity" },
    { type: "link", key: "report", label: "Impact Report" },
    { type: "link", key: "contact", label: "Contact Section" },
    { type: "link", key: "footer", label: "Footer" }
  ];

  function renderSidebar() {
    var nav = document.getElementById("sidebarNav");
    nav.innerHTML = NAV.map(function (item) {
      if (item.type === "group") return '<div class="sidebar-group">' + esc(item.label) + "</div>";
      return '<button class="sidebar-link' + (state.section === item.key ? " is-active" : "") +
        '" data-section="' + item.key + '"><span class="dot"></span>' + esc(item.label) + "</button>";
    }).join("");
    nav.querySelectorAll("[data-section]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.section = btn.getAttribute("data-section");
        renderSidebar();
        renderPanel();
      });
    });
  }

  /* ================================================================
     PANEL DISPATCH
  ================================================================= */
  function setTitle(title, subtitle) {
    document.getElementById("panelTitle").textContent = title;
    document.getElementById("panelSubtitle").textContent = subtitle || "";
  }

  function renderPanel() {
    var panel = document.getElementById("appPanel");
    panel.innerHTML = "";
    var fns = {
      overview: renderOverview, hero: renderHeroPanel, about: renderAboutPanel,
      ledger: renderLedgerPanel, featured: renderFeaturedPanel, programs: renderProgramsPanel,
      gallery: renderGalleryPanel, team: renderTeamPanel, report: renderReportPanel,
      partners: renderPartnersPanel, contact: renderContactPanel, footer: renderFooterPanel,
      identity: renderIdentityPanel
    };
    (fns[state.section] || renderOverview)(panel);
  }

  /* ================================================================
     OVERVIEW
  ================================================================= */
  function renderOverview(panel) {
    setTitle("Overview", "A quick summary of everything on the site right now.");
    var c = state.content;
    panel.innerHTML =
      '<div class="overview-grid">' +
      overviewCard(c.programs.items.length, "Programs listed") +
      overviewCard(c.team.members.length, "Team members") +
      overviewCard(c.gallery.images.length, "Gallery photos") +
      overviewCard(c.partners.items.length, "Partners listed") +
      "</div>" +
      '<h3 style="margin-bottom:14px;">Jump to a section</h3>' +
      '<div class="overview-links">' +
      NAV.filter(function (n) { return n.type === "link" && n.key !== "overview"; }).map(function (n) {
        return '<button class="overview-link" data-goto="' + n.key + '"><strong>' + esc(n.label) +
          "</strong><span>Edit this section</span></button>";
      }).join("") +
      "</div>";
    panel.querySelectorAll("[data-goto]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.section = btn.getAttribute("data-goto");
        renderSidebar(); renderPanel();
      });
    });
  }
  function overviewCard(num, label) {
    return '<div class="overview-card"><div class="num">' + num + '</div><div class="lbl">' + esc(label) + "</div></div>";
  }

  /* ================================================================
     HERO & STATS
  ================================================================= */
  function renderHeroPanel(panel) {
    setTitle("Hero & Stats", "The first thing visitors see, plus the four headline numbers.");
    var h = state.content.hero;
    panel.innerHTML =
      fieldCard("Hero content", "", [
        imageFieldHTML("hero-image", "Background photo", h.image),
        textField("hero.tag", "File tag line", h.tag),
        textField("hero.titleLine1", "Headline — line 1", h.titleLine1),
        textField("hero.titleLine2", "Headline — line 2", h.titleLine2),
        textareaField("hero.subtitle", "Subheading", h.subtitle),
        '<div class="field-grid">' +
        textField("hero.ctaPrimary.label", "Primary button label", h.ctaPrimary.label) +
        textField("hero.ctaPrimary.href", "Primary button link", h.ctaPrimary.href) +
        textField("hero.ctaGhost.label", "Secondary button label", h.ctaGhost.label) +
        textField("hero.ctaGhost.href", "Secondary button link", h.ctaGhost.href) +
        "</div>"
      ].join(""));

    panel.innerHTML += listEditorShell("heroStats", "Headline stats (4 shown in the strip)", "Add stat");
    wirePanelInputs(panel);
    wireImageField("hero-image", function (v) { h.image = v; });

    renderListEditor({
      mount: panel.querySelector("#list-heroStats"),
      items: h.stats,
      rowView: function (item) { return { title: item.label, subtitle: item.value + (item.suffix || ""), tag: "" }; },
      onAdd: function () { openItemModal("Add stat", statFields(), {}, function (v) { h.stats.push(v); renderPanel(); }); },
      onEdit: function (i) { openItemModal("Edit stat", statFields(), h.stats[i], function (v) { h.stats[i] = v; renderPanel(); }); },
      onDelete: function (i) { h.stats.splice(i, 1); renderPanel(); },
      onMove: function (i, dir) { moveInArray(h.stats, i, dir); renderPanel(); }
    });
  }
  function statFields() {
    return [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "value", label: "Value (number)", type: "number", required: true },
      { key: "suffix", label: "Suffix (e.g. + or %)", type: "text" }
    ];
  }

  /* ================================================================
     ABOUT
  ================================================================= */
  function renderAboutPanel(panel) {
    setTitle("About / Mission", "The office description, Mission/Vision/Values cards, and the leader profile.");
    var a = state.content.about;
    panel.innerHTML =
      fieldCard("Section intro", "", [
        textField("about.eyebrow", "Eyebrow label", a.eyebrow),
        textField("about.heading", "Heading", a.heading),
        textareaField("about.lede", "Lede paragraph", a.lede),
        textareaField("about.body", "Body paragraph", a.body)
      ].join("")) +
      listEditorShell("mvv", "Mission / Vision / Core Values cards", "Add card") +
      fieldCard("Leader profile", "", [
        imageFieldHTML("about-figure-image", "Portrait photo", a.figure.image),
        textField("about.figure.name", "Full name", a.figure.name),
        textField("about.figure.suffix", "Suffix / honorific", a.figure.suffix),
        textareaField("about.figure.role", "Role / title", a.figure.role),
        textareaField("about.figure.quote", "Pull quote", a.figure.quote)
      ].join(""));

    wirePanelInputs(panel);
    wireImageField("about-figure-image", function (v) { a.figure.image = v; });

    renderListEditor({
      mount: panel.querySelector("#list-mvv"),
      items: a.mvv,
      rowView: function (item) { return { title: item.title, subtitle: item.text, tag: item.icon }; },
      onAdd: function () { openItemModal("Add card", mvvFields(), { icon: "star" }, function (v) { a.mvv.push(v); renderPanel(); }); },
      onEdit: function (i) { openItemModal("Edit card", mvvFields(), a.mvv[i], function (v) { a.mvv[i] = v; renderPanel(); }); },
      onDelete: function (i) { a.mvv.splice(i, 1); renderPanel(); },
      onMove: function (i, dir) { moveInArray(a.mvv, i, dir); renderPanel(); }
    });
  }
  function mvvFields() {
    return [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "text", label: "Description", type: "textarea", required: true },
      { key: "icon", label: "Icon", type: "select", options: ["home", "target", "shield", "heart", "book", "star"] }
    ];
  }

  /* ================================================================
     IMPACT LEDGER
  ================================================================= */
  function renderLedgerPanel(panel) {
    setTitle("Impact Ledger", "The 'Impact at a Glance' stat rows.");
    var l = state.content.ledger;
    panel.innerHTML =
      fieldCard("Section intro", "", [
        textField("ledger.eyebrow", "Eyebrow label", l.eyebrow),
        textareaField("ledger.heading", "Heading", l.heading),
        textareaField("ledger.lede", "Lede paragraph", l.lede)
      ].join("")) +
      listEditorShell("ledgerRows", "Ledger rows", "Add row");
    wirePanelInputs(panel);
    renderListEditor({
      mount: panel.querySelector("#list-ledgerRows"),
      items: l.rows,
      rowView: function (item) { return { title: item.figure, subtitle: item.desc.replace(/<[^>]+>/g, ""), tag: "" }; },
      onAdd: function () { openItemModal("Add row", ledgerFields(), {}, function (v) { l.rows.push(v); renderPanel(); }); },
      onEdit: function (i) { openItemModal("Edit row", ledgerFields(), l.rows[i], function (v) { l.rows[i] = v; renderPanel(); }); },
      onDelete: function (i) { l.rows.splice(i, 1); renderPanel(); },
      onMove: function (i, dir) { moveInArray(l.rows, i, dir); renderPanel(); }
    });
  }
  function ledgerFields() {
    return [
      { key: "figure", label: "Figure (big number)", type: "text", required: true },
      { key: "desc", label: "Description — you can use <strong>bold</strong>", type: "textarea", required: true }
    ];
  }

  /* ================================================================
     FEATURED PROJECT
  ================================================================= */
  function renderFeaturedPanel(panel) {
    setTitle("Featured Project", "The spotlight section for the newest / flagship outreach.");
    var f = state.content.featured;
    panel.innerHTML = fieldCard("Content", "", [
      textField("featured.eyebrow", "Eyebrow label", f.eyebrow),
      textField("featured.heading", "Heading", f.heading),
      textareaField("featured.lede", "Lede paragraph", f.lede),
      textareaField("featured.body", "Body paragraph", f.body),
      textareaField("featured.callout", "Callout — you can use <strong>bold</strong>", f.callout),
      '<div class="field-grid">' +
      textField("featured.linkLabel", "Link label", f.linkLabel) +
      textField("featured.linkHref", "Link target", f.linkHref) +
      "</div>",
      imageFieldHTML("featured-img-0", "Photo 1 (large)", f.images[0] || ""),
      imageFieldHTML("featured-img-1", "Photo 2", f.images[1] || ""),
      imageFieldHTML("featured-img-2", "Photo 3", f.images[2] || "")
    ].join(""));
    wirePanelInputs(panel);
    [0, 1, 2].forEach(function (i) {
      wireImageField("featured-img-" + i, function (v) { f.images[i] = v; });
    });
  }

  /* ================================================================
     PROGRAMS (13)
  ================================================================= */
  function renderProgramsPanel(panel) {
    setTitle("Programs", "The full register of community outreach projects.");
    var p = state.content.programs;
    panel.innerHTML =
      fieldCard("Section intro", "", [
        textField("programs.eyebrow", "Eyebrow label", p.eyebrow),
        textField("programs.heading", "Heading", p.heading),
        textareaField("programs.lede", "Lede — you can use <em>italics</em>", p.lede)
      ].join("")) +
      fieldCard("Categories", "Used for the filter chips and each program's tag. Programs referencing a removed category will keep the text but lose the filter link.",
        tagListHTML("programCategories", p.categories)) +
      listEditorShell("programs", "Program register (" + p.items.length + ")", "Add program");
    wirePanelInputs(panel);
    wireTagList(panel, "programCategories", p.categories, function () { renderPanel(); });

    renderListEditor({
      mount: panel.querySelector("#list-programs"),
      items: p.items,
      rowView: function (item) { return { title: item.num + " — " + item.title, subtitle: stripHtml(item.body).slice(0, 90) + "…", tag: item.tag }; },
      onAdd: function () {
        openItemModal("Add program", programFields(p.categories), { num: String(p.items.length + 1).padStart(2, "0"), tags: [] },
          function (v) { p.items.push(v); renderPanel(); });
      },
      onEdit: function (i) {
        openItemModal("Edit program", programFields(p.categories), p.items[i], function (v) { p.items[i] = v; renderPanel(); });
      },
      onDelete: function (i) { p.items.splice(i, 1); renderPanel(); },
      onMove: function (i, dir) { moveInArray(p.items, i, dir); renderPanel(); }
    });
  }
  function programFields(categories) {
    return [
      { key: "num", label: "Number (e.g. 01)", type: "text", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "tag", label: "Primary category (badge shown)", type: "select", options: categories, required: true },
      { key: "tags", label: "All categories (controls filter chips)", type: "chipselect", options: categories },
      { key: "body", label: "Full description — HTML paragraphs, e.g. <p>Some text.</p>", type: "textarea", big: true, required: true }
    ];
  }
  function stripHtml(s) { var d = document.createElement("div"); d.innerHTML = s || ""; return d.textContent || ""; }

  /* ================================================================
     GALLERY
  ================================================================= */
  function renderGalleryPanel(panel) {
    setTitle("Photo Gallery", "The masonry gallery of field photographs.");
    var g = state.content.gallery;
    panel.innerHTML =
      fieldCard("Section intro", "", [
        textField("gallery.eyebrow", "Eyebrow label", g.eyebrow),
        textField("gallery.heading", "Heading", g.heading)
      ].join("")) +
      listEditorShell("gallery", "Photos (" + g.images.length + ")", "Add photo");
    wirePanelInputs(panel);
    renderListEditor({
      mount: panel.querySelector("#list-gallery"),
      items: g.images,
      thumb: true,
      rowView: function (item) { return { title: item.alt || "(no description)", subtitle: item.src, tag: "", thumb: item.src }; },
      onAdd: function () { openItemModal("Add photo", galleryFields(), {}, function (v) { g.images.push(v); renderPanel(); }); },
      onEdit: function (i) { openItemModal("Edit photo", galleryFields(), g.images[i], function (v) { g.images[i] = v; renderPanel(); }); },
      onDelete: function (i) { g.images.splice(i, 1); renderPanel(); },
      onMove: function (i, dir) { moveInArray(g.images, i, dir); renderPanel(); }
    });
  }
  function galleryFields() {
    return [
      { key: "src", label: "Photo", type: "image", required: true },
      { key: "alt", label: "Description (for accessibility & captions)", type: "text", required: true }
    ];
  }

  /* ================================================================
     TEAM
  ================================================================= */
  function renderTeamPanel(panel) {
    setTitle("Team & Contacts", "Project leads and office staff, with phone/email.");
    var t = state.content.team;
    panel.innerHTML =
      fieldCard("Section intro", "", [
        textField("team.eyebrow", "Eyebrow label", t.eyebrow),
        textField("team.heading", "Heading", t.heading),
        textareaField("team.lede", "Lede paragraph", t.lede)
      ].join("")) +
      listEditorShell("team", "Staff (" + t.members.length + ")", "Add team member");
    wirePanelInputs(panel);
    renderListEditor({
      mount: panel.querySelector("#list-team"),
      items: t.members,
      thumb: true,
      rowView: function (item) {
        return {
          title: item.name + (item.isLead ? "  ★ Office Head" : ""),
          subtitle: item.role, tag: "", thumb: item.photo || ""
        };
      },
      onAdd: function () { openItemModal("Add team member", teamFields(), {}, function (v) { t.members.push(v); renderPanel(); }); },
      onEdit: function (i) { openItemModal("Edit team member", teamFields(), t.members[i], function (v) { t.members[i] = v; renderPanel(); }); },
      onDelete: function (i) { t.members.splice(i, 1); renderPanel(); },
      onMove: function (i, dir) { moveInArray(t.members, i, dir); renderPanel(); }
    });
  }
  function teamFields() {
    return [
      { key: "photo", label: "Photo (optional)", type: "image" },
      { key: "name", label: "Full name", type: "text", required: true },
      { key: "suffix", label: "Suffix / honorific (e.g. SDMSS)", type: "text" },
      { key: "role", label: "Role", type: "text", required: true },
      { key: "phone", label: "Phone (e.g. +2348012345678)", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "isLead", label: "Highlight as Office Head", type: "checkbox" }
    ];
  }

  /* ================================================================
     SITE IDENTITY
  ================================================================= */
  function renderIdentityPanel(panel) {
    setTitle("Site Identity", "The logo, favicon, browser tab title and search-result description.");
    var s = state.content.site;
    panel.innerHTML = fieldCard("Branding", "", [
      imageFieldHTML("site-logo", "Logo (shown in the header, circular)", s.logo),
      imageFieldHTML("site-favicon", "Favicon (browser tab icon)", s.favicon, "Use a small square image, ideally 64×64px."),
      textField("site.brandName", "Brand name (shown next to the logo)", s.brandName),
      textField("site.brandSub", "Brand sub-label", s.brandSub)
    ].join("")) + fieldCard("Browser & search", "", [
      textField("site.title", "Browser tab title", s.title),
      textareaField("site.description", "Search-result description (SEO)", s.description)
    ].join(""));
    wirePanelInputs(panel);
    wireImageField("site-logo", function (v) { s.logo = v; });
    wireImageField("site-favicon", function (v) { s.favicon = v; });
  }

  /* ================================================================
     REPORT
  ================================================================= */
  function renderReportPanel(panel) {
    setTitle("Impact Report", "The 'Impact Beyond Office' document call-to-action.");
    var r = state.content.report;
    panel.innerHTML = fieldCard("Content", "", [
      textField("report.eyebrow", "Eyebrow label", r.eyebrow),
      textField("report.heading", "Heading", r.heading),
      textareaField("report.lede", "Lede paragraph", r.lede),
      textareaField("report.body", "Body paragraph", r.body),
      '<div class="field-grid">' +
      textField("report.linkLabel", "Button label", r.linkLabel) +
      textField("report.linkHref", "Report URL", r.linkHref) +
      textField("report.linkText", "Displayed link text", r.linkText) +
      "</div>",
      imageFieldHTML("report-image", "Cover image", r.image)
    ].join(""));
    wirePanelInputs(panel);
    wireImageField("report-image", function (v) { r.image = v; });
  }

  /* ================================================================
     PARTNERS
  ================================================================= */
  function renderPartnersPanel(panel) {
    setTitle("Partners", "The list of partner organisations shown in the strip.");
    var p = state.content.partners;
    panel.innerHTML =
      fieldCard("Label", "", textField("partners.label", "Section label", p.label)) +
      fieldCard("Partners (" + p.items.length + ")", "Press Enter or click + to add a partner.", tagListHTML("partnersList", p.items));
    wirePanelInputs(panel);
    wireTagList(panel, "partnersList", p.items, function () { renderPanel(); });
  }

  /* ================================================================
     CONTACT
  ================================================================= */
  function renderContactPanel(panel) {
    setTitle("Contact Section", "The 'Get Involved' section and contact details.");
    var c = state.content.contact;
    panel.innerHTML = fieldCard("Content", "", [
      textField("contact.eyebrow", "Eyebrow label", c.eyebrow),
      textField("contact.heading", "Heading", c.heading),
      textareaField("contact.lede", "Lede paragraph", c.lede),
      textField("contact.email", "Email address", c.email),
      textField("contact.phones.0", "Phone 1", c.phones[0] || ""),
      textField("contact.phones.1", "Phone 2", c.phones[1] || ""),
      '<div class="field-grid">' +
      textField("contact.website", "Website URL", c.website) +
      textField("contact.websiteLabel", "Website display text", c.websiteLabel) +
      "</div>"
    ].join(""));
    wirePanelInputs(panel);
  }

  /* ================================================================
     FOOTER
  ================================================================= */
  function renderFooterPanel(panel) {
    setTitle("Footer", "The closing tagline and note.");
    var f = state.content.footer;
    panel.innerHTML = fieldCard("Footer text", "", [
      textareaField("footer.tagline", "Tagline", f.tagline),
      textField("footer.note", "Note", f.note)
    ].join(""));
    wirePanelInputs(panel);
  }

  /* ================================================================
     SHARED FIELD BUILDERS
  ================================================================= */
  function fieldCard(title, hint, bodyHtml) {
    return '<div class="field-card">' + (title ? "<h3>" + esc(title) + "</h3>" : "") +
      (hint ? '<p class="card-hint">' + hint + "</p>" : "") + bodyHtml + "</div>";
  }
  function textField(path, label, value) {
    return '<div class="field"><label>' + esc(label) + '</label><input type="text" data-path="' + path + '" value="' + esc(value) + '"></div>';
  }
  function textareaField(path, label, value) {
    return '<div class="field"><label>' + esc(label) + '</label><textarea data-path="' + path + '">' + esc(value) + "</textarea></div>";
  }
  function tagListHTML(id, items) {
    return '<div class="tag-list" id="taglist-' + id + '">' + items.map(function (t, i) {
      return '<span class="tag-pill">' + esc(t) + ' <button data-remove="' + i + '" type="button">&times;</button></span>';
    }).join("") + '</div><div class="tag-add"><input type="text" id="add-' + id + '" placeholder="Add new…"><button class="btn btn-outline btn-sm" id="addbtn-' + id + '" type="button">Add</button></div>';
  }
  function wireTagList(root, id, arr, onChange) {
    root.querySelectorAll('#taglist-' + id + " [data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        arr.splice(Number(btn.getAttribute("data-remove")), 1);
        markDirty(); onChange();
      });
    });
    var input = root.querySelector("#add-" + id);
    var addBtn = root.querySelector("#addbtn-" + id);
    function addIt() {
      var v = input.value.trim();
      if (!v) return;
      arr.push(v); markDirty(); onChange();
    }
    addBtn.addEventListener("click", addIt);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addIt(); } });
  }

  function listEditorShell(key, title, addLabel) {
    return '<div class="list-toolbar"><h3>' + esc(title) + '</h3><button class="btn btn-primary btn-sm" id="add-' + key + '">+ ' + esc(addLabel) + '</button></div>' +
      '<div class="item-list" id="list-' + key + '"></div>';
  }

  function renderListEditor(cfg) {
    var mount = cfg.mount;
    var toolbarBtn = mount.parentElement.querySelector('[id^="add-"]');
    if (toolbarBtn) toolbarBtn.onclick = cfg.onAdd;
    if (!cfg.items.length) {
      mount.innerHTML = '<div class="empty-state">Nothing here yet. Click &ldquo;+ Add&rdquo; above to create the first one.</div>';
      return;
    }
    mount.innerHTML = cfg.items.map(function (item, i) {
      var v = cfg.rowView(item);
      var thumb = v.thumb ? '<img class="item-thumb" src="' + esc(adminSrc(v.thumb)) + '">' : "";
      return '<div class="item-row">' + thumb +
        '<div class="item-info"><strong>' + esc(v.title) + '</strong><span>' + esc(v.subtitle || "") + '</span></div>' +
        (v.tag ? '<span class="item-tag">' + esc(v.tag) + '</span>' : "") +
        '<div class="item-actions">' +
        '<button class="icon-btn" data-act="up" data-i="' + i + '" title="Move up">&uarr;</button>' +
        '<button class="icon-btn" data-act="down" data-i="' + i + '" title="Move down">&darr;</button>' +
        '<button class="icon-btn" data-act="edit" data-i="' + i + '" title="Edit">&#9998;</button>' +
        '<button class="icon-btn danger" data-act="del" data-i="' + i + '" title="Delete">&#10005;</button>' +
        "</div></div>";
    }).join("");
    mount.querySelectorAll("[data-act]").forEach(function (btn) {
      var i = Number(btn.getAttribute("data-i"));
      var act = btn.getAttribute("data-act");
      btn.addEventListener("click", function () {
        if (act === "edit") cfg.onEdit(i);
        else if (act === "del") { if (confirm("Delete this item? This can't be undone.")) cfg.onDelete(i); }
        else if (act === "up") cfg.onMove(i, -1);
        else if (act === "down") cfg.onMove(i, 1);
      });
    });
  }
  function moveInArray(arr, i, dir) {
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  /* ================================================================
     ITEM MODAL (add/edit dialog used by every collection)
  ================================================================= */
  var dialogDraft = {};
  var dialogOnSave = null;

  function openItemModal(title, fields, initial, onSave) {
    dialogDraft = clone(initial || {});
    dialogOnSave = onSave;
    document.getElementById("itemDialogTitle").textContent = title;
    var fieldsEl = document.getElementById("itemFields");
    fieldsEl.innerHTML = fields.map(function (f) { return renderDialogField(f, dialogDraft[f.key]); }).join("");

    fields.forEach(function (f) {
      if (f.type === "image") {
        wireImageField("dlg-" + f.key, function (v) { dialogDraft[f.key] = v; });
      }
    });
    fieldsEl.querySelectorAll("[data-key]").forEach(function (el) {
      var evt = (el.tagName === "SELECT" || el.type === "checkbox") ? "change" : "input";
      el.addEventListener(evt, function () {
        var key = el.getAttribute("data-key");
        dialogDraft[key] = el.type === "checkbox" ? el.checked : el.value;
      });
    });
    fieldsEl.querySelectorAll("[data-chipkey]").forEach(function (el) {
      el.addEventListener("change", function () {
        var key = el.getAttribute("data-chipkey");
        var group = fieldsEl.querySelectorAll('[data-chipkey="' + key + '"]');
        dialogDraft[key] = Array.prototype.filter.call(group, function (g) { return g.checked; }).map(function (g) { return g.value; });
      });
    });

    document.getElementById("itemDialog").showModal();
  }

  function renderDialogField(f, value) {
    value = value == null ? "" : value;
    if (f.type === "textarea") {
      return '<div class="field"><label>' + esc(f.label) + '</label><textarea data-key="' + f.key + '"' +
        (f.big ? ' style="min-height:150px;"' : "") + ">" + esc(value) + "</textarea></div>";
    }
    if (f.type === "select") {
      return '<div class="field"><label>' + esc(f.label) + '</label><select data-key="' + f.key + '">' +
        (f.options || []).map(function (o) { return '<option value="' + esc(o) + '"' + (o === value ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") +
        "</select></div>";
    }
    if (f.type === "chipselect") {
      var selected = Array.isArray(value) ? value : [];
      return '<div class="field"><label>' + esc(f.label) + '</label><div class="chip-select">' +
        (f.options || []).map(function (o) {
          return '<label><input type="checkbox" data-chipkey="' + f.key + '" value="' + esc(o) + '"' +
            (selected.indexOf(o) !== -1 ? " checked" : "") + "><span>" + esc(o) + "</span></label>";
        }).join("") + "</div></div>";
    }
    if (f.type === "checkbox") {
      return '<div class="field field-checkbox"><input type="checkbox" id="dlg-' + f.key + '" data-key="' + f.key + '"' +
        (value ? " checked" : "") + '><label for="dlg-' + f.key + '">' + esc(f.label) + "</label></div>";
    }
    if (f.type === "image") {
      return imageFieldHTML("dlg-" + f.key, f.label, value).replace('id="dlg-' + f.key + '-text"', 'id="dlg-' + f.key + '-text" data-key="' + f.key + '"');
    }
    return '<div class="field"><label>' + esc(f.label) + '</label><input type="text" data-key="' + f.key + '" value="' + esc(value) + '"></div>';
  }

  document.getElementById("itemForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (dialogOnSave) dialogOnSave(clone(dialogDraft));
    markDirty();
    document.getElementById("itemDialog").close();
  });
  document.getElementById("itemCancelBtn").addEventListener("click", function () {
    document.getElementById("itemDialog").close();
  });

  /* ================================================================
     TOP BAR ACTIONS
  ================================================================= */
  function wireTopbar() {
    document.getElementById("saveBtn").addEventListener("click", function () {
      SlocoStore.writeLocalOverride(state.content);
      markClean();
      toast("Saved. Open the live site in this browser to preview your changes.");
    });
    document.getElementById("exportBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state.content, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "content.json";
      a.click();
      toast("content.json downloaded — replace the file in your site folder to publish.");
    });
    document.getElementById("importBtn").addEventListener("click", function () {
      document.getElementById("importFile").click();
    });
    document.getElementById("importFile").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          if (!parsed.hero || !parsed.programs) throw new Error("shape");
          state.content = parsed;
          markDirty();
          renderPanel();
          toast("Imported. Review, then click Save changes.");
        } catch (err) {
          toast("That file doesn't look like a valid content.json.", true);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
    document.getElementById("resetBtn").addEventListener("click", async function () {
      if (!confirm("Discard local edits and reload the originally shipped content.json?")) return;
      SlocoStore.clearLocalOverride();
      state.content = await SlocoStore.fetchBaseline();
      markClean();
      renderPanel();
      toast("Reset to the shipped content.json.");
    });
  }

  /* ================================================================
     AUTH + BOOT
  ================================================================= */
  function showApp() {
    document.getElementById("loginScreen").hidden = true;
    document.getElementById("appShell").hidden = false;
    boot();
  }

  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var val = document.getElementById("loginPassword").value;
    if (val === ADMIN_PASSCODE) {
      localStorage.setItem(AUTH_KEY, "1");
      showApp();
    } else {
      document.getElementById("loginError").textContent = "Incorrect passcode. Please try again.";
    }
  });
  document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem(AUTH_KEY);
    location.reload();
  });
  document.getElementById("showSecurityNote").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("securityDialog").showModal();
  });
  document.getElementById("closeSecurityDialog").addEventListener("click", function () {
    document.getElementById("securityDialog").close();
  });

  window.addEventListener("beforeunload", function (e) {
    if (state.dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  async function boot() {
    var result = await SlocoStore.load();
    state.content = result.data;
    markClean();
    wireTopbar();
    renderSidebar();
    renderPanel();
  }

  if (localStorage.getItem(AUTH_KEY) === "1") showApp();
})();
