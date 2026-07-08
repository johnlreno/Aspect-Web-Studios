/* Aspect Web Studios — interactions */

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

// ---------- Background tone shifting per section ----------
const toneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const tone = entry.target.dataset.bg;
        document.body.className = tone;
      }
    });
  },
  { threshold: 0.4 }
);

document.querySelectorAll("[data-bg]").forEach((el) => toneObserver.observe(el));

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
  2: "Every site is designed and coded from scratch for your brand.",
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

document.querySelectorAll(".demo-add").forEach((btn) => {
  btn.addEventListener("click", () => {
    cartCount += 1;
    cartEl.textContent = cartCount;
    const original = btn.textContent;
    btn.textContent = "Added ✓";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 900);
  });
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

// ---------- Demo contact form ----------
const form = document.getElementById("contact-form");
const formNote = document.getElementById("form-note");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.name.value.trim() || "there";
  formNote.textContent = `Thanks, ${name}! This is a demo form — hook it up to your inbox later.`;
  form.reset();
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();
