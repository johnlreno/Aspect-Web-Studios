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

  // lock in the current (expanded) box size, and pin the content to its
  // natural pixel width so the links don't reflow/squish as the box shrinks
  const rect = siteNav.getBoundingClientRect();
  const contentWidth = navContent.getBoundingClientRect().width;
  siteNav.style.width = `${rect.width}px`;
  siteNav.style.height = `${rect.height}px`;
  navContent.style.width = `${contentWidth}px`;
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
    navContent.style.width = "";
    return;
  }

  // Measure the natural size with transitions off (the nav has a CSS width
  // on phones, so clearing the inline width would otherwise *animate* toward
  // it and the measurement would read the still-tiny box), then snap back to
  // the bubble size and animate up to the target in the same frame.
  siteNav.classList.remove("is-collapsed");
  document.body.classList.remove("nav-is-collapsed");
  siteNav.style.transition = "none";
  siteNav.style.width = "";
  siteNav.style.height = "";
  navContent.style.width = "";
  const target = siteNav.getBoundingClientRect();
  const contentWidth = navContent.getBoundingClientRect().width;

  // pin the content at its final width so it keeps its finished layout
  // (instead of squishing vertically) while the box grows around it
  navContent.style.width = `${contentWidth}px`;

  const size = bubbleSize();
  siteNav.style.width = `${size}px`;
  siteNav.style.height = `${size}px`;
  void siteNav.offsetWidth; // commit the bubble-sized start state, unanimated

  siteNav.style.transition = "";
  siteNav.style.width = `${target.width}px`;
  siteNav.style.height = `${target.height}px`;

  siteNav.addEventListener("transitionend", function cleanUp(e) {
    // child fades (orb, content) bubble up here too — wait for the box itself
    if (e.target !== siteNav || e.propertyName !== "width") return;
    siteNav.removeEventListener("transitionend", cleanUp);
    if (!navCollapsed) {
      siteNav.style.width = "";
      siteNav.style.height = "";
      navContent.style.width = "";
    }
  });
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
  if (!el.dataset.count) return; // static symbols (like the $ card) don't count
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
  2: "Premium, custom design at a fair, negotiable price — never thousands for a cookie-cutter template.",
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

// ---------- Section snap: pages click into place when scrolling settles ----------
// After the visitor stops scrolling (or lifts their finger on touch), the
// section owning half or more of the screen glides into place, centered.
// The animation adapts to scroll speed — flicks land quickly, gentle scrolls
// settle calmly. The live-demo section is exempt so the demo sites can be
// browsed freely.
(function () {
  if (reducedMotion) return;

  const sections = Array.from(document.querySelectorAll("main > section"));
  const demoSection = document.getElementById("demo");
  const rootStyle = document.documentElement.style;

  let touchActive = false;
  let snapping = false;
  let snapRaf = 0;
  let settleTimer = null;

  // Rolling scroll speed in px/ms. `velocity` is a smoothed instantaneous
  // reading; `peakSpeed` decays with a short half-life so a flick still
  // registers as "fast" once the momentum has died down and we snap.
  let lastY = window.scrollY;
  let lastT = performance.now();
  let velocity = 0;
  let peakSpeed = 0;

  function trackVelocity() {
    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0 && dt < 200) {
      const inst = (window.scrollY - lastY) / dt;
      velocity = velocity * 0.65 + inst * 0.35;
      peakSpeed = Math.max(Math.abs(inst), peakSpeed * Math.pow(0.5, dt / 180));
    } else {
      velocity = 0;
      peakSpeed = 0;
    }
    lastY = window.scrollY;
    lastT = now;
  }

  function dominantSection() {
    const vh = window.innerHeight;
    let best = null;
    let bestVisible = 0;
    for (const section of sections) {
      const r = section.getBoundingClientRect();
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible > bestVisible) {
        bestVisible = visible;
        best = section;
      }
    }
    // only snap when one page clearly owns the screen (half or more)…
    if (!best || bestVisible < vh / 2) return null;
    // …and never while the demo-website page has the screen
    if (best === demoSection) return null;
    return best;
  }

  function snapTargetFor(section) {
    const vh = window.innerHeight;
    const rect = section.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    let target;
    if (rect.height <= vh) {
      // page fits on screen: center it
      target = top - (vh - rect.height) / 2;
    } else {
      // page taller than the screen: never force scrolling past its edges
      target = Math.min(Math.max(window.scrollY, top), top + rect.height - vh);
    }
    const max = document.documentElement.scrollHeight - vh;
    return Math.max(0, Math.min(target, max));
  }

  function cancelSnap() {
    snapping = false;
    cancelAnimationFrame(snapRaf);
    clearTimeout(settleTimer);
    rootStyle.scrollBehavior = "";
  }

  function animateSnap(target) {
    const from = window.scrollY;
    const distance = target - from;
    if (Math.abs(distance) < 2) return;

    // Fast scrolls get a shorter trip; slow scrolls a calmer one
    let duration = 340 + Math.min(Math.abs(distance), window.innerHeight) * 0.4;
    if (peakSpeed > 2) duration *= 0.5;
    else if (peakSpeed > 0.8) duration *= 0.72;
    duration = Math.min(850, Math.max(220, duration));

    // Arriving out of motion: launch quick, land soft — the page already has
    // momentum. From near-rest: ease in and out so nothing jerks.
    const ease =
      peakSpeed > 0.8
        ? (t) => 1 - Math.pow(1 - t, 4)
        : (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    snapping = true;
    rootStyle.scrollBehavior = "auto"; // keep CSS smooth-scroll from re-easing our frames
    const start = performance.now();

    (function step(now) {
      if (!snapping) return;
      const t = Math.min((now - start) / duration, 1);
      window.scrollTo(0, from + distance * ease(t));
      if (t < 1) {
        snapRaf = requestAnimationFrame(step);
      } else {
        snapping = false;
        rootStyle.scrollBehavior = "";
        velocity = 0;
        peakSpeed = 0;
        lastY = window.scrollY;
        lastT = performance.now();
      }
    })(start);
  }

  function queueSnap() {
    clearTimeout(settleTimer);
    if (touchActive || snapping) return;
    settleTimer = setTimeout(() => {
      if (touchActive || snapping) return;
      const section = dominantSection();
      if (section) animateSnap(snapTargetFor(section));
    }, 120);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (snapping) return; // ignore our own animation frames
      trackVelocity();
      queueSnap();
    },
    { passive: true }
  );

  // While a finger is on the screen the page follows it exactly — no snapping
  // until release (then momentum runs out, then the settle timer fires)
  window.addEventListener(
    "touchstart",
    () => {
      touchActive = true;
      cancelSnap();
    },
    { passive: true }
  );
  function touchDone(e) {
    if (e.touches.length === 0) {
      touchActive = false;
      queueSnap();
    }
  }
  window.addEventListener("touchend", touchDone, { passive: true });
  window.addEventListener("touchcancel", touchDone, { passive: true });

  // Fresh input takes control back from a snap already in flight
  window.addEventListener("wheel", cancelSnap, { passive: true });
  window.addEventListener("keydown", (e) => {
    const scrollKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
    if (scrollKeys.includes(e.key)) cancelSnap();
  });
})();

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

function radiusFrom(origin) {
  const ox = origin ? origin.x : window.innerWidth - 38;
  const oy = origin ? origin.y : 36;
  return {
    x: ox,
    y: oy,
    r: Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)),
  };
}

// Phones (and browsers without View Transitions): the snapshot-based circle
// reveal animates at a low frame rate on iOS, so it moved like stop motion.
// Instead, the text and UI snap to the new theme in a single frame while the
// new background color floods outward from the toggle as a clip-path circle
// on a plain solid layer behind the content (z-index 0, under main/nav) —
// clipping a solid div is compositor-only work, so it stays at full frame
// rate, and nothing on screen is ever covered.
function backgroundFlood(theme, origin) {
  // fast repeat-toggles: clear any flood still in flight
  document.querySelectorAll(".theme-fill").forEach((el) => el.remove());

  const o = radiusFrom(origin);
  const oldBg = getComputedStyle(document.body).backgroundColor;

  // full-screen layer holding the old background color…
  const keeper = document.createElement("div");
  keeper.className = "theme-fill";
  keeper.style.background = oldBg;

  // …with the new color flooding over it as a growing circle
  const flood = document.createElement("div");
  flood.className = "theme-fill";

  document.body.append(keeper, flood);

  rootEl.classList.add("theme-snap");
  applyTheme(theme);
  requestAnimationFrame(() => rootEl.classList.remove("theme-snap"));

  // read the body's new background now that the theme has swapped
  flood.style.background = getComputedStyle(document.body).backgroundColor;

  const grow = flood.animate(
    { clipPath: [`circle(0px at ${o.x}px ${o.y}px)`, `circle(${o.r}px at ${o.x}px ${o.y}px)`] },
    { duration: 620, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
  );
  grow.onfinish = () => {
    keeper.remove();
    flood.remove();
  };
}

// The full snapshot reveal is desktop-only: iOS animates View Transitions
// at a visibly low frame rate, so touch devices get the compositor-friendly
// background flood above instead
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

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
  backgroundFlood(theme, origin);
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
