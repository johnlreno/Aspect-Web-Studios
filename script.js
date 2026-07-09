/* Aspect Web Studios — interactions */

// ---------- Start at the top on refresh, with a sweep-up effect ----------
// Reloads jump to leftover #hashes from nav clicks, and browsers restore
// the previous scroll position; take over both. Instead of snapping to the
// top, resume where the visitor left off and glide up to the hero.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

if (location.hash) {
  history.replaceState(null, "", location.pathname + location.search);
}

window.addEventListener("pagehide", () => {
  sessionStorage.setItem("aspect-scroll", String(window.scrollY));
});

const savedScroll = parseFloat(sessionStorage.getItem("aspect-scroll")) || 0;
sessionStorage.removeItem("aspect-scroll");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (savedScroll > 1 && !reducedMotion) {
  // resume the previous position instantly (bypassing CSS smooth scrolling)…
  const rootStyle = document.documentElement.style;
  rootStyle.scrollBehavior = "auto";
  window.scrollTo(0, savedScroll);

  // …but hand control back the moment the visitor scrolls themselves
  let sweepCancelled = false;
  const cancelSweep = () => (sweepCancelled = true);
  ["wheel", "touchstart", "keydown"].forEach((ev) =>
    window.addEventListener(ev, cancelSweep, { once: true, passive: true })
  );

  setTimeout(() => {
    const from = window.scrollY;
    const duration = Math.min(1300, 550 + from * 0.12);
    const start = performance.now();

    (function sweep(now) {
      if (sweepCancelled) {
        rootStyle.scrollBehavior = "";
        return;
      }
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out: quick launch, soft landing
      window.scrollTo(0, from * (1 - eased));
      if (t < 1) {
        requestAnimationFrame(sweep);
      } else {
        rootStyle.scrollBehavior = "";
      }
    })(performance.now());
  }, 180);
} else {
  window.scrollTo(0, 0);
}

// Smooth-scroll in-page links ourselves so the URL never gains a #hash
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});

// ---------- Scroll reveal ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---------- Nav section-indicator bubble ----------
const navPill = document.querySelector(".nav-pill");
const navLinksWrap = document.querySelector(".nav-links");

// which nav link each section lights up (in-between sections keep the nearest one)
const sectionToLink = {
  work: "#work",
  services: "#services",
  process: "#services",
  demo: "#demo",
  about: "#about",
  faq: "#about",
  contact: "#contact",
};

let pillLink = null;
let pillTimeouts = [];

function setNavPill(sectionId) {
  const href = sectionToLink[sectionId];

  if (!href) {
    // hero / unmapped: tuck the bubble away
    navPill.classList.remove("is-on", "pill-travel", "pill-arrive");
    pillLink = null;
    return;
  }

  const link = navLinksWrap.querySelector(`a[href="${href}"]`);
  if (!link || link === pillLink) return;

  const wasVisible = pillLink !== null;
  pillLink = link;
  navPill.style.left = `${link.offsetLeft - 11}px`;
  navPill.style.width = `${link.offsetWidth + 22}px`;

  pillTimeouts.forEach(clearTimeout);
  pillTimeouts = [];
  navPill.classList.remove("pill-travel", "pill-arrive");

  if (wasVisible) {
    // stretch while sliding to the next/previous section's link…
    void navPill.offsetWidth; // restart animations cleanly
    navPill.classList.add("pill-travel");
    pillTimeouts.push(
      setTimeout(() => {
        // …then squash-bounce on arrival
        navPill.classList.remove("pill-travel");
        navPill.classList.add("pill-arrive");
      }, 450),
      setTimeout(() => navPill.classList.remove("pill-arrive"), 1050)
    );
  }

  navPill.classList.add("is-on");
}

// keep the bubble aligned if the window resizes
window.addEventListener("resize", () => {
  if (!pillLink) return;
  navPill.style.transition = "none";
  navPill.style.left = `${pillLink.offsetLeft - 11}px`;
  navPill.style.width = `${pillLink.offsetWidth + 22}px`;
  void navPill.offsetWidth;
  navPill.style.transition = "";
});

// ---------- Nav collapse: hide the whole box down to a glowing bubble ----------
const siteNav = document.getElementById("site-nav");
const navContent = document.getElementById("nav-content");
const navClose = document.getElementById("nav-close");
const navOrb = document.getElementById("nav-orb");
let navCollapsed = false;

function bubbleSize() {
  return window.matchMedia("(max-width: 640px)").matches ? 44 : 46;
}

function collapseNav() {
  if (navCollapsed) return;
  navCollapsed = true;

  navContent.setAttribute("aria-hidden", "true");
  navContent.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
  navOrb.removeAttribute("tabindex");

  if (reducedMotion) {
    siteNav.classList.add("is-collapsed");
    document.body.classList.add("nav-is-collapsed");
    return;
  }

  // lock in the current (expanded) box size, then swap to the collapsed
  // padding/background instantly so it doesn't race the width/height animation
  const rect = siteNav.getBoundingClientRect();
  siteNav.style.width = `${rect.width}px`;
  siteNav.style.height = `${rect.height}px`;
  void siteNav.offsetWidth;
  siteNav.classList.add("is-collapsed");
  document.body.classList.add("nav-is-collapsed");

  const size = bubbleSize();
  requestAnimationFrame(() => {
    siteNav.style.width = `${size}px`;
    siteNav.style.height = `${size}px`;
  });
}

function expandNav() {
  if (!navCollapsed) return;
  navCollapsed = false;

  navContent.removeAttribute("aria-hidden");
  navContent.querySelectorAll("a, button").forEach((el) => el.removeAttribute("tabindex"));
  navOrb.setAttribute("tabindex", "-1");

  if (reducedMotion) {
    siteNav.classList.remove("is-collapsed");
    document.body.classList.remove("nav-is-collapsed");
    siteNav.style.width = "";
    siteNav.style.height = "";
    return;
  }

  // drop the collapsed padding/background instantly, measure the true
  // natural size that results, then snap back to the bubble and animate up
  siteNav.classList.remove("is-collapsed");
  document.body.classList.remove("nav-is-collapsed");
  siteNav.style.width = "";
  siteNav.style.height = "";
  const target = siteNav.getBoundingClientRect();

  const size = bubbleSize();
  siteNav.style.width = `${size}px`;
  siteNav.style.height = `${size}px`;
  void siteNav.offsetWidth;

  requestAnimationFrame(() => {
    siteNav.style.width = `${target.width}px`;
    siteNav.style.height = `${target.height}px`;
  });

  siteNav.addEventListener(
    "transitionend",
    () => {
      if (!navCollapsed) {
        siteNav.style.width = "";
        siteNav.style.height = "";
      }
    },
    { once: true }
  );
}

navClose.addEventListener("click", collapseNav);
navOrb.addEventListener("click", expandNav);

// keep the collapsed bubble sized correctly if the viewport changes breakpoint
window.addEventListener("resize", () => {
  if (!navCollapsed) return;
  const size = bubbleSize();
  siteNav.style.transition = "none";
  siteNav.style.width = `${size}px`;
  siteNav.style.height = `${size}px`;
  void siteNav.offsetWidth;
  siteNav.style.transition = "";
});

// ---------- Background tone + nav bubble, driven by scroll position ----------
// (scroll-position based rather than IntersectionObserver: thresholds can
// never fire for sections taller than the viewport)
const toneSections = Array.from(document.querySelectorAll("[data-bg]"));
let toneTicking = false;

function updateSectionState() {
  const marker = window.innerHeight * 0.45;
  let active = toneSections[0];
  for (const section of toneSections) {
    if (section.getBoundingClientRect().top <= marker) active = section;
  }
  document.body.className = active.dataset.bg;
  setNavPill(active.id);
}

window.addEventListener(
  "scroll",
  () => {
    if (toneTicking) return;
    toneTicking = true;
    requestAnimationFrame(() => {
      updateSectionState();
      toneTicking = false;
    });
  },
  { passive: true }
);

updateSectionState();

// ---------- Animated stat counters ----------
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(easeOut(progress) * target);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll(".stat-num").forEach((el) => statObserver.observe(el));

// ---------- Stat cards: tap to learn more ----------
const statNotes = {
  1: "Most projects go from first call to launch in about two weeks.",
  2: "Fast sites rank higher and convert better — every build is tuned for speed.",
  3: "You work directly with the person building your site — no handoffs.",
};

const statNote = document.getElementById("stat-note");

document.querySelectorAll(".stat").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".stat").forEach((b) => b.classList.remove("is-open"));
    btn.classList.add("is-open");
    statNote.style.opacity = 0;
    setTimeout(() => {
      statNote.textContent = statNotes[btn.dataset.stat];
      statNote.style.opacity = 1;
    }, 200);
  });
});

// ---------- Pencil demo: panel navigation ----------
function showDemoPanel(name) {
  document.querySelectorAll(".demo-link").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.panel === name);
  });
  document.querySelectorAll(".demo-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === name);
  });
}

document.querySelectorAll(".demo-link").forEach((btn) => {
  btn.addEventListener("click", () => showDemoPanel(btn.dataset.panel));
});

document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => showDemoPanel(btn.dataset.goto));
});

// ---------- Pencil demo: cart ----------
let cartCount = 0;
const cartEl = document.getElementById("demo-cart-count");
const cartLine = document.getElementById("demo-cart");

document.querySelectorAll(".demo-add").forEach((btn) => {
  btn.addEventListener("click", () => {
    cartCount += 1;
    cartEl.textContent = cartCount;
    cartLine.classList.remove("is-bumped");
    void cartLine.offsetWidth; // restart the bump animation
    cartLine.classList.add("is-bumped");
    const original = btn.textContent;
    btn.textContent = "Added ✓";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 900);
  });
});

// ---------- Pencil demo: click a pencil to sharpen it ----------
document.querySelectorAll(".demo-hero-art .pencil").forEach((pencil) => {
  pencil.addEventListener("click", () => {
    pencil.classList.add("is-sharpening");
    pencil.addEventListener(
      "animationend",
      () => pencil.classList.remove("is-sharpening"),
      { once: true }
    );
  });
});

// ---------- Pencil demo: newsletter signup ----------
const newsForm = document.getElementById("demo-news");

newsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  newsForm.innerHTML = '<span class="demo-news-done">You\'re in! 📬 Welcome to the pencil club.</span>';
});

// ---------- FAQ: only one open at a time ----------
const faqItems = document.querySelectorAll(".faq details");

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) {
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    }
  });
});

// ---------- Barber demo: panel navigation ----------
function showDemo2Panel(name) {
  document.querySelectorAll(".demo2-link").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.panel2 === name);
  });
  document.querySelectorAll(".demo2-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel2 === name);
  });
}

document.querySelectorAll(".demo2-link").forEach((btn) => {
  btn.addEventListener("click", () => showDemo2Panel(btn.dataset.panel2));
});

document.querySelectorAll("[data-goto2]").forEach((btn) => {
  btn.addEventListener("click", () => showDemo2Panel(btn.dataset.goto2));
});

// ---------- Barber demo: booking ----------
const confirmBtn = document.getElementById("demo2-confirm");
const bookNote = document.getElementById("demo2-note");
let pickedSlot = null;

document.querySelectorAll(".slot").forEach((slot) => {
  slot.addEventListener("click", () => {
    document.querySelectorAll(".slot").forEach((s) => s.classList.remove("is-picked"));
    slot.classList.add("is-picked");
    pickedSlot = slot.textContent;
    confirmBtn.disabled = false;
    bookNote.textContent = "";
  });
});

confirmBtn.addEventListener("click", () => {
  if (!pickedSlot) return;
  bookNote.textContent = `Chair held for ${pickedSlot}. See you then. 💈`;
  confirmBtn.disabled = true;
  document.querySelectorAll(".slot").forEach((s) => s.classList.remove("is-picked"));
  pickedSlot = null;
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Theme (light / dark) ----------
const themeToggle = document.getElementById("theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const rootEl = document.documentElement;

// Source of truth for the intended theme. Tracked separately because the
// animated swap lands late (after the wipe/transition), so reading the DOM
// attribute mid-animation would give a stale value if the user toggles fast.
let currentTheme = rootEl.getAttribute("data-theme") === "dark" ? "dark" : "light";

function applyTheme(theme) {
  if (theme === "dark") rootEl.setAttribute("data-theme", "dark");
  else rootEl.removeAttribute("data-theme");
  themeToggle.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  if (themeMeta) themeMeta.content = theme === "dark" ? "#131316" : "#f6f6f7";
}

// Touch devices choke on the View Transitions snapshot; give them the
// lightweight circle wipe below instead
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

function radiusFrom(origin) {
  const ox = origin ? origin.x : window.innerWidth - 38;
  const oy = origin ? origin.y : 36;
  return {
    x: ox,
    y: oy,
    r: Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)),
  };
}

// Cheap, always-smooth transition: a single solid overlay wipes across as
// an expanding circle, we swap the theme while it fully covers the screen
// (no color pop), then fade the overlay away to reveal the new page. Only
// clip-path and opacity animate — both run on the compositor, so it stays
// fluid on phones where the View Transitions snapshot stutters.
function circleWipe(theme, origin) {
  const o = radiusFrom(origin);
  const overlay = document.createElement("div");
  overlay.className = "theme-wipe";
  overlay.style.background = theme === "dark" ? "#131316" : "#f6f6f7";
  document.body.appendChild(overlay);

  const grow = overlay.animate(
    {
      clipPath: [`circle(0px at ${o.x}px ${o.y}px)`, `circle(${o.r}px at ${o.x}px ${o.y}px)`],
    },
    { duration: 430, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
  );

  grow.onfinish = () => {
    // Screen is fully covered — swap instantly (theme-snap kills the body's
    // 1.1s background transition so nothing eases underneath the cover)
    rootEl.classList.add("theme-snap");
    applyTheme(theme);
    requestAnimationFrame(() => rootEl.classList.remove("theme-snap"));

    const fade = overlay.animate(
      { opacity: [1, 0] },
      { duration: 340, easing: "ease", fill: "forwards" }
    );
    fade.onfinish = () => overlay.remove();
  };
}

function switchTheme(theme, origin) {
  if (reducedMotion) {
    applyTheme(theme);
    return;
  }

  // Desktop: the new theme sweeps in as a circle revealing the fully-formed
  // page (View Transitions API)
  if (!coarsePointer && document.startViewTransition && origin) {
    rootEl.classList.add("theme-snap");
    const vt = document.startViewTransition(() => applyTheme(theme));
    vt.ready
      .then(() => {
        rootEl.classList.remove("theme-snap");
        const o = radiusFrom(origin);
        rootEl.animate(
          {
            clipPath: [`circle(0px at ${o.x}px ${o.y}px)`, `circle(${o.r}px at ${o.x}px ${o.y}px)`],
          },
          {
            duration: 700,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {
        rootEl.classList.remove("theme-snap");
        applyTheme(theme);
      });
    return;
  }

  // Phones, tablets, and browsers without View Transitions
  circleWipe(theme, origin);
}

// Sync button state with the theme the head script picked before paint
applyTheme(currentTheme);

themeToggle.addEventListener("click", () => {
  const next = currentTheme === "dark" ? "light" : "dark";
  currentTheme = next;
  try {
    localStorage.setItem("aws-theme", next);
  } catch (e) {}
  const rect = themeToggle.getBoundingClientRect();
  switchTheme(next, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
});

// Follow live device-theme changes unless the visitor chose one manually
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  try {
    if (localStorage.getItem("aws-theme")) return;
  } catch (err) {}
  currentTheme = e.matches ? "dark" : "light";
  switchTheme(currentTheme, null);
});
