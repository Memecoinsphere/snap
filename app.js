/* Snapfake — static PWA decoy (Snapchat-style login lookalike).
 *
 * Cosmetic only: login fields do nothing real; private panel is local links.
 * No network calls from the app shell (CSP connect-src 'none').
 */

// ===== PASSCODE (change here) =====
const PASSCODE = "6767";
// ==================================

const decoyEl = document.getElementById("decoy");
const lockEl = document.getElementById("lock");
const panelEl = document.getElementById("panel");
const dotsEl = document.getElementById("dots");
const errorEl = document.getElementById("lockError");
const keypadEl = document.getElementById("keypad");
const lockPanelBtn = document.getElementById("lockPanelBtn");
const snapLoginBtn = document.getElementById("snapLoginBtn");
const snapError = document.getElementById("snapError");
const snapForm = document.getElementById("snapForm");

let entered = "";
let view = "decoy"; // decoy | lock | panel

/* ---------- Views ---------- */
function show(name) {
  view = name;
  decoyEl.hidden = name !== "decoy";
  lockEl.hidden = name !== "lock";
  panelEl.hidden = name !== "panel";
  decoyEl.setAttribute("aria-hidden", name === "decoy" ? "false" : "true");
  if (name === "lock") {
    entered = "";
    updateDots();
    errorEl.hidden = true;
  }
  if (name === "decoy") {
    if (snapError) snapError.hidden = true;
  }
}

function updateDots() {
  const dots = dotsEl.querySelectorAll(".dot");
  dots.forEach((d, i) => {
    d.classList.toggle("filled", i < entered.length);
  });
}

function onDigit(d) {
  if (view !== "lock" || entered.length >= 4) return;
  errorEl.hidden = true;
  entered += d;
  updateDots();
  if (entered.length === 4) {
    if (entered === PASSCODE) {
      show("panel");
    } else {
      errorEl.hidden = false;
      entered = "";
      setTimeout(updateDots, 180);
    }
  }
}

function onDelete() {
  if (view !== "lock" || !entered.length) return;
  entered = entered.slice(0, -1);
  errorEl.hidden = true;
  updateDots();
}

keypadEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-k]");
  if (!btn) return;
  const k = btn.getAttribute("data-k");
  if (k === "del") onDelete();
  else onDigit(k);
});

lockPanelBtn.addEventListener("click", () => {
  show("decoy");
});

/* Cosmetic login — never authenticates */
function showFakeLoginError() {
  if (snapError) snapError.hidden = false;
}

if (snapLoginBtn) {
  snapLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showFakeLoginError();
  });
}
if (snapForm) {
  snapForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showFakeLoginError();
  });
}

/* ---------- Hidden gesture: double-tap in top ~15% strip ---------- */
const TOP_STRIP_RATIO = 0.15;
const DOUBLE_TAP_MS = 350;
let lastTopTapAt = 0;

function isTopStrip(clientY) {
  const h = window.innerHeight || document.documentElement.clientHeight;
  return clientY <= h * TOP_STRIP_RATIO;
}

function onPointerDown(e) {
  if (view !== "decoy") return;
  if (typeof e.button === "number" && e.button !== 0) return;
  const y = e.clientY;
  if (!isTopStrip(y)) {
    lastTopTapAt = 0;
    return;
  }
  const now = performance.now();
  if (lastTopTapAt && now - lastTopTapAt <= DOUBLE_TAP_MS) {
    lastTopTapAt = 0;
    show("lock");
  } else {
    lastTopTapAt = now;
  }
}

decoyEl.addEventListener("pointerdown", onPointerDown, { passive: true });

/* ---------- Boot ---------- */
show("decoy");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  });
}
