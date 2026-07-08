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

// ---------- Editable placeholder (experiment area) ----------
document.querySelectorAll("[data-placeholder]").forEach((box) => {
  const text = box.querySelector("p");
  box.addEventListener("click", () => {
    text.setAttribute("contenteditable", "true");
    box.classList.add("is-editing");
    text.focus();
  });
  text.addEventListener("blur", () => {
    text.removeAttribute("contenteditable");
    box.classList.remove("is-editing");
  });
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Theme (light / dark) ----------
const themeToggle = document.getElementById("theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const rootEl = document.documentElement;

function applyTheme(theme) {
  if (theme === "dark") rootEl.setAttribute("data-theme", "dark");
  else rootEl.removeAttribute("data-theme");
  themeToggle.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  if (themeMeta) themeMeta.content = theme === "dark" ? "#131316" : "#f6f6f7";
}

function switchTheme(theme, origin) {
  if (reducedMotion) {
    applyTheme(theme);
    return;
  }

  // Preferred: the new theme sweeps across the page as a circle
  // growing out of the toggle (View Transitions API)
  if (document.startViewTransition && origin) {
    rootEl.classList.add("theme-snap");
    const vt = document.startViewTransition(() => applyTheme(theme));
    vt.ready
      .then(() => {
        rootEl.classList.remove("theme-snap");
        const radius = Math.hypot(
          Math.max(origin.x, window.innerWidth - origin.x),
          Math.max(origin.y, window.innerHeight - origin.y)
        );
        rootEl.animate(
          {
            clipPath: [
              `circle(0px at ${origin.x}px ${origin.y}px)`,
              `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
            ],
          },
          {
            duration: 700,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => rootEl.classList.remove("theme-snap"));
    return;
  }

  // Fallback: one soft cross-fade of every color on the page
  rootEl.classList.add("theme-fading");
  applyTheme(theme);
  setTimeout(() => rootEl.classList.remove("theme-fading"), 650);
}

// Sync button state with the theme the head script picked before paint
applyTheme(rootEl.getAttribute("data-theme") === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
  const next = rootEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
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
  switchTheme(e.matches ? "dark" : "light", null);
});
