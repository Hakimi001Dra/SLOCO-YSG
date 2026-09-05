(function () {
  "use strict";

  var ICONS = {
    home: '<svg viewBox="0 0 40 40"><path d="M4 20 L20 6 L36 20" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 18 V33 H31 V18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 33 V23 H23 V33" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    target: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="1.6" fill="currentColor"/></svg>',
    shield: '<svg viewBox="0 0 40 40"><path d="M20 4 32 10 32 20 C32 29 27 33 20 36 C13 33 8 29 8 20 L8 10 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    heart: '<svg viewBox="0 0 40 40"><path d="M20 34 C10 27 4 20 4 13 C4 8 8 4 13 4 C16.5 4 19 6 20 9 C21 6 23.5 4 27 4 C32 4 36 8 36 13 C36 20 30 27 20 34 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    book: '<svg viewBox="0 0 40 40"><path d="M6 8 C10 6 16 6 20 9 C24 6 30 6 34 8 V32 C30 30 24 30 20 33 C16 30 10 30 6 32 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 9 V33" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    star: '<svg viewBox="0 0 40 40"><path d="M20 4 L24.5 15 36 16 27 23.5 30 35 20 28 10 35 13 23.5 4 16 15.5 15 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  function esc(s) {
    return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  }

  function render(data) {
    document.title = data.site.title;
    var favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = data.site.favicon;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && data.site.description) metaDesc.setAttribute("content", data.site.description);

    renderNav(data);
    renderHero(data.hero);
    renderAbout(data.about);
    renderLedger(data.ledger);
    renderFeatured(data.featured);
    renderPrograms(data.programs);
    renderGallery(data.gallery);
    renderTeam(data.team);
    renderReport(data.report);
    renderPartners(data.partners);
    renderContact(data.contact);
    renderFooter(data.footer, data.site);

    document.getElementById("year").textContent = new Date().getFullYear();
    initInteractivity();
  }

  function renderNav(data) {
    document.getElementById("brandMark").src = data.site.logo;
    document.getElementById("brandName").textContent = data.site.brandName;
    document.getElementById("brandSub").textContent = data.site.brandSub;
  }

  function renderHero(hero) {
    var root = document.getElementById("hero");
    document.querySelector(".hero-media img").src = hero.image;
    root.querySelector(".dossier-tag").textContent = hero.tag;
    root.querySelector(".hero-title").innerHTML =
      esc(hero.titleLine1) + "<br>" + esc(hero.titleLine2);
    root.querySelector(".hero-sub").textContent = hero.subtitle;
    var p = root.querySelector(".btn-primary");
    p.textContent = hero.ctaPrimary.label; p.href = hero.ctaPrimary.href;
    var g = root.querySelector(".btn-ghost");
    g.textContent = hero.ctaGhost.label; g.href = hero.ctaGhost.href;

    var strip = document.getElementById("heroStats");
    strip.innerHTML = hero.stats.map(function (s) {
      return '<div class="stat-item"><span class="stat-num" data-count="' + s.value +
        '" data-suffix="' + esc(s.suffix) + '">0</span><span class="stat-label">' +
        esc(s.label) + "</span></div>";
    }).join("");
  }

  function renderAbout(about) {
    var root = document.getElementById("about");
    root.querySelector(".eyebrow").textContent = about.eyebrow;
    root.querySelector(".about-copy h2").textContent = about.heading;
    root.querySelector(".about-copy .lede").textContent = about.lede;
    root.querySelector(".about-copy .body-text").textContent = about.body;

    root.querySelector(".mvv-grid").innerHTML = about.mvv.map(function (m) {
      return '<div class="mvv-card"><span class="mvv-icon" aria-hidden="true">' +
        (ICONS[m.icon] || ICONS.star) + '</span><h3>' + esc(m.title) +
        '</h3><p>' + esc(m.text) + '</p></div>';
    }).join("");

    var fig = about.figure;
    root.querySelector(".portrait-card img").src = fig.image;
    root.querySelector(".portrait-card img").alt = fig.name + " — " + fig.role;
    root.querySelector(".portrait-card figcaption strong").innerHTML =
      esc(fig.name) + (fig.suffix ? ", " + esc(fig.suffix) : "");
    root.querySelector(".portrait-card figcaption span").textContent = fig.role;
    root.querySelector(".quote-card p").textContent = "\u201C" + fig.quote + "\u201D";
  }

  function renderLedger(ledger) {
    var root = document.getElementById("impact");
    root.querySelector(".eyebrow").textContent = ledger.eyebrow;
    root.querySelector(".ledger-title").textContent = ledger.heading;
    root.querySelector(".ledger-lede").textContent = ledger.lede;
    root.querySelector(".ledger-table").innerHTML = ledger.rows.map(function (r) {
      return '<div class="ledger-row"><span class="ledger-figure">' + esc(r.figure) +
        '</span><span class="ledger-desc">' + r.desc + "</span></div>";
    }).join("");
  }

  function renderFeatured(f) {
    var root = document.getElementById("featured");
    root.querySelector(".eyebrow").textContent = f.eyebrow;
    root.querySelector(".featured-copy h2").textContent = f.heading;
    root.querySelector(".featured-copy .lede").textContent = f.lede;
    root.querySelector(".featured-copy .body-text").innerHTML = f.body;
    root.querySelector(".callout").innerHTML = f.callout;
    var link = root.querySelector(".text-link");
    link.textContent = f.linkLabel; link.href = f.linkHref;

    var classes = ["fg-a", "fg-b", "fg-c"];
    root.querySelector(".featured-gallery").innerHTML = f.images.map(function (src, i) {
      return '<img src="' + src + '" alt="" class="' + (classes[i] || "") + '">';
    }).join("");
  }

  function renderPrograms(programs) {
    var root = document.getElementById("programs");
    root.querySelector(".eyebrow").textContent = programs.eyebrow;
    root.querySelector("h2").textContent = programs.heading;
    root.querySelector(".lede").innerHTML = programs.lede;

    var chips = ['<button class="filter-chip is-active" data-filter="all">All</button>']
      .concat(programs.categories.map(function (c) {
        return '<button class="filter-chip" data-filter="' + esc(c) + '">' + esc(c) + "</button>";
      }));
    document.getElementById("filterRow").innerHTML = chips.join("");

    document.getElementById("register").innerHTML = programs.items.map(function (item) {
      return '<article class="reg-row" data-tags="' + esc((item.tags || [item.tag]).join(" ")) + '">' +
        '<button class="reg-head" aria-expanded="false">' +
        '<span class="reg-num">' + esc(item.num) + '</span>' +
        '<span class="reg-title">' + esc(item.title) + '</span>' +
        '<span class="reg-tag">' + esc(item.tag) + '</span>' +
        '<span class="reg-chevron" aria-hidden="true">+</span>' +
        '</button><div class="reg-body">' + item.body + '</div></article>';
    }).join("");
  }

  function renderGallery(gallery) {
    var root = document.getElementById("gallery");
    root.querySelector(".eyebrow").textContent = gallery.eyebrow;
    root.querySelector(".gallery-title").textContent = gallery.heading;
    document.getElementById("galleryGrid").innerHTML = gallery.images.map(function (img) {
      return '<figure class="gallery-item"><img src="' + img.src + '" alt="' + esc(img.alt) + '" loading="lazy"></figure>';
    }).join("");
  }

  function initials(name) {
    var parts = name.replace(/,.*/, "").trim().split(/\s+/).filter(Boolean);
    var first = parts[0] ? parts[0][0] : "";
    var last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }

  function renderTeam(team) {
    var root = document.getElementById("team");
    root.querySelector(".eyebrow").textContent = team.eyebrow;
    root.querySelector("h2").textContent = team.heading;
    root.querySelector(".lede").textContent = team.lede;

    document.getElementById("teamGrid").innerHTML = team.members.map(function (m) {
      var cls = "team-card" + (m.isLead ? " lead-card" : "");
      var tag = m.isLead ? '<span class="team-role-tag">Office Head</span>' : "";
      var avatar = m.photo
        ? '<img class="team-avatar" src="' + esc(m.photo) + '" alt="">'
        : '<span class="team-avatar team-avatar-fallback" aria-hidden="true">' + esc(initials(m.name)) + '</span>';
      var nameLine = esc(m.name) + (m.suffix ? ' <small>' + esc(m.suffix) + '</small>' : "");
      var contacts = "";
      if (m.phone) contacts += '<a href="tel:' + esc(m.phone) + '">' + formatPhone(m.phone) + '</a>';
      if (m.email) contacts += '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>';
      return '<div class="' + cls + '">' + tag + avatar + '<h3>' + nameLine + '</h3><p>' +
        esc(m.role) + '</p>' + contacts + '</div>';
    }).join("");
  }

  function formatPhone(p) {
    var digits = p.replace(/^\+234/, "0");
    return digits.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
  }

  function renderReport(report) {
    var root = document.getElementById("report");
    root.querySelector(".eyebrow").textContent = report.eyebrow;
    root.querySelector("h2").textContent = report.heading;
    root.querySelector(".lede").textContent = report.lede;
    root.querySelector(".report-copy .body-text").textContent = report.body;
    var link = root.querySelector(".btn-primary");
    link.textContent = report.linkLabel; link.href = report.linkHref;
    root.querySelector(".report-link-text").textContent = report.linkText;
    root.querySelector(".report-visual img").src = report.image;
  }

  function renderPartners(partners) {
    var root = document.querySelector(".partners");
    root.querySelector(".partners-label").textContent = partners.label;
    root.querySelector(".partners-strip").innerHTML = partners.items.map(function (p) {
      return "<span>" + esc(p) + "</span>";
    }).join("");
  }

  function renderContact(contact) {
    var root = document.getElementById("contact");
    root.querySelector(".eyebrow").textContent = contact.eyebrow;
    root.querySelector("h2").textContent = contact.heading;
    root.querySelector(".lede").textContent = contact.lede;
    document.getElementById("contactList").innerHTML =
      '<li><span>Email</span><a href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + '</a></li>' +
      '<li><span>Phone</span>' + contact.phones.map(function (ph) {
        return '<a href="tel:' + esc(ph.replace(/\s/g, "")) + '">' + esc(ph) + '</a>';
      }).join(" &middot; ") + '</li>' +
      '<li><span>Web</span><a href="' + esc(contact.website) + '" target="_blank" rel="noopener">' + esc(contact.websiteLabel) + '</a></li>';
  }

  function renderFooter(footer, site) {
    document.getElementById("footerBrandName").textContent = site.brandName;
    document.getElementById("footerTagline").textContent = footer.tagline;
    document.getElementById("footerNote").textContent = footer.note;
  }

  /* ================= interactivity (re-runs after each render) ================= */
  function initInteractivity() {
    var header = document.getElementById("siteHeader");
    function onScroll() {
      if (window.scrollY > 40) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    document.removeEventListener("scroll", window.__slocoScroll || function () {});
    window.__slocoScroll = onScroll;
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    toggle.onclick = function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    nav.querySelectorAll("a").forEach(function (a) {
      a.onclick = function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      };
    });

    var revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (elx) { io.observe(elx); });
    } else {
      revealEls.forEach(function (elx) { elx.classList.add("is-visible"); });
    }

    var statNums = document.querySelectorAll(".stat-num");
    function animateCount(elx) {
      var target = parseInt(elx.getAttribute("data-count"), 10) || 0;
      var suffix = elx.getAttribute("data-suffix") || "";
      var duration = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        elx.textContent = Math.round(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (statNums.length) {
      if ("IntersectionObserver" in window) {
        var statIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { animateCount(entry.target); statIO.unobserve(entry.target); }
          });
        }, { threshold: 0.4 });
        statNums.forEach(function (elx) { statIO.observe(elx); });
      } else { statNums.forEach(animateCount); }
    }

    var regRows = document.querySelectorAll(".reg-row");
    regRows.forEach(function (row) {
      var head = row.querySelector(".reg-head");
      var body = row.querySelector(".reg-body");
      head.onclick = function () {
        var isOpen = row.classList.contains("is-open");
        regRows.forEach(function (r) {
          if (r !== row) {
            r.classList.remove("is-open");
            r.querySelector(".reg-head").setAttribute("aria-expanded", "false");
            r.querySelector(".reg-body").style.maxHeight = null;
          }
        });
        if (isOpen) {
          row.classList.remove("is-open");
          head.setAttribute("aria-expanded", "false");
          body.style.maxHeight = null;
        } else {
          row.classList.add("is-open");
          head.setAttribute("aria-expanded", "true");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      };
    });

    var chips = document.querySelectorAll(".filter-chip");
    chips.forEach(function (chip) {
      chip.onclick = function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        var filter = chip.getAttribute("data-filter");
        regRows.forEach(function (row) {
          var tags = row.getAttribute("data-tags") || "";
          var match = filter === "all" || tags.indexOf(filter) !== -1;
          row.classList.toggle("is-hidden", !match);
        });
      };
    });

    var form = document.getElementById("contactForm");
    var note = document.getElementById("formNote");
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        note.textContent = "Thank you — your message has been noted. The office will reach out to " +
          document.getElementById("femail").value + " shortly.";
        form.reset();
      };
    }

    // card tilt / magnetic hover on interactive cards
    initTilt();
  }

  function initTilt() {
    var cards = document.querySelectorAll(".mvv-card, .team-card, .gallery-item, .partners-strip span");
    cards.forEach(function (card) {
      if (card.__tiltBound) return;
      card.__tiltBound = true;
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", (y * -6).toFixed(2) + "deg");
        card.style.setProperty("--tilt-y", (x * 6).toFixed(2) + "deg");
        card.style.setProperty("--glow-x", (e.clientX - rect.left) + "px");
        card.style.setProperty("--glow-y", (e.clientY - rect.top) + "px");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  async function boot() {
    try {
      var result = await SlocoStore.load();
      render(result.data);
      if (result.source === "local") {
        console.info("SLOCO site: rendering local admin-edited content (this browser only).");
      }
    } catch (err) {
      console.error(err);
      document.body.innerHTML = '<p style="padding:80px;font-family:sans-serif">Could not load site content (content.json). If you are opening this file directly, please serve the folder with a local web server instead of double-clicking index.html.</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
