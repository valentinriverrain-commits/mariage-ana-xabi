/* =========================================================
   Le film du mariage — desktop
   1) Loader 0 → 100%
   2) Les 9 photos arrivent une par une du bas (en diagonale)
      et s'empilent au centre ; la photo du dessus s'agrandit
   3) Le film en plein écran (lecteur personnalisé plus tard)
   ========================================================= */

// 8 photos de fond de la pile (modifiable : fichiers de assets/photos)
const PHOTOS_BG = [
  "assets/photos/g04.jpg", "assets/photos/d03.jpg", "assets/photos/g07.jpg",
  "assets/photos/g01.jpg", "assets/photos/g06.jpg", "assets/photos/d01.jpg",
  "assets/photos/g02.jpg", "assets/photos/d04.jpg",
];
// Photo du DESSUS = 1re image de la vidéo → l'agrandissement enchaîne sans coupure.
// (À remplacer en même temps que la vidéo finale.)
const PHOTO_TOP = "assets/photos/poster.jpg";

// Pile : les photos arrivent dans l'axe central, SANS décalage, juste une rotation.
const REST = [
  { r: -6 }, { r: 5 }, { r: -4 }, { r: 7 },
  { r: -3 }, { r: 6 }, { r: -5 }, { r: 4 },
];

// Tempo (ms) — animation ralentie
const LOADER_MIN_MS = 2800;
const STEP_MS       = 340;   // écart entre l'arrivée de chaque photo
const SETTLE_MS     = 1400;  // temps de vol d'une photo
const HOLD_MS       = 1000;  // pause une fois la pile formée, avant l'agrandissement
const ZOOM_MS       = 1600;  // durée de l'agrandissement

const el = (id) => document.getElementById(id);
const loader    = el("loader");
const montage   = el("montage");
const filmStage = el("film-stage");
const percentEl = el("percent");
const ring      = document.querySelector(".ring-progress");
const RING_LEN  = 452.39;

let stage = "loader";
const ALL = [...PHOTOS_BG, PHOTO_TOP];

/* ---------- 1) LOADER ---------- */
let loadProgress = 0, loaded = 0;
const total = ALL.length;
ALL.forEach((src) => {
  const img = new Image();
  img.onload = img.onerror = () => { loaded++; loadProgress = loaded / total; };
  img.src = src;
});
el("film").load();

const startTime = performance.now();
let shown = 0;
function tick(now) {
  const timeFrac = Math.min((now - startTime) / LOADER_MIN_MS, 1);
  let target = Math.min(timeFrac, 0.15 + loadProgress * 0.85);
  if (timeFrac >= 1 && loadProgress >= 1) target = 1;
  shown += (target - shown) * 0.08;
  if (target === 1 && shown > 0.999) shown = 1;
  percentEl.textContent = Math.round(shown * 100) + "%";
  ring.style.strokeDashoffset = RING_LEN * (1 - shown);
  if (shown >= 1) { setTimeout(goMontage, 400); return; }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------- 2) PILE DE PHOTOS ---------- */
let topCard = null;

function makeCard(src, z) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.zIndex = z;
  const im = document.createElement("img");
  im.src = src; im.alt = "";
  card.appendChild(im);
  return card;
}
const center = (extra) => `translate(-50%, -50%) ${extra}`;
// Repos : centré, seule la rotation varie → pile
const rest = (p) => center(`rotate(${p.r}deg) scale(1)`);
// Départ : sous l'écran, sur l'axe central, même rotation, même taille (pas de fondu, pas de diagonale)
const start = (p) => center(`translateY(${window.innerHeight * 0.92}px) rotate(${p.r}deg) scale(1)`);

function goMontage() {
  if (stage !== "loader") return;
  stage = "montage";
  loader.classList.add("fade-out");
  montage.hidden = false;
  setTimeout(() => { loader.hidden = true; }, 800);
  setTimeout(() => { el("frame").style.opacity = 1; }, 300); // le viseur apparaît

  const stackEl = el("stack");
  const cards = [];

  // 8 cartes de fond + la carte du dessus (poster) en dernier
  ALL.forEach((src, i) => {
    const p = (i < REST.length) ? REST[i] : { r: 0 };
    const card = makeCard(src, i + 1);
    card.style.transform = start(p);
    card.style.opacity = 1;            // sans fondu
    stackEl.appendChild(card);
    cards.push({ card, p });
  });
  topCard = cards[cards.length - 1].card;

  // Arrivée une par une, du bas, dans l'axe central → empilement
  cards.forEach(({ card, p }, i) => {
    setTimeout(() => { card.style.transform = rest(p); }, 120 + i * STEP_MS);
  });

  const lastArrival = 120 + (cards.length - 1) * STEP_MS + SETTLE_MS;
  setTimeout(zoomTop, lastArrival + HOLD_MS);
}

/* ---------- Agrandissement de la photo du dessus ---------- */
function zoomTop() {
  if (!topCard || stage === "film") return;
  el("frame").style.opacity = 0;   // le viseur disparaît avant l'agrandissement
  // estompe les autres photos derrière
  el("stack").querySelectorAll(".card").forEach((c) => {
    if (c !== topCard) c.style.opacity = 0;
  });
  const r = topCard.getBoundingClientRect();
  const scale = Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.04;
  topCard.classList.add("zoom");
  topCard.style.transform = `translate(-50%, -50%) scale(${scale})`;
  // la vidéo prend le relais quand l'agrandissement est presque fini
  setTimeout(goFilm, ZOOM_MS - 120);
}

/* ---------- 3) LE FILM (plein écran) ---------- */
function goFilm() {
  if (stage === "film") return;
  stage = "film";
  filmStage.hidden = false;
  if (typeof buildTicks === "function" && filmDur) buildTicks();  // (re)génère la règle une fois visible
  filmStage.classList.add("fade-in");        // crossfade depuis la photo agrandie (même image)
  document.body.classList.add("playing");
  setTimeout(() => { montage.hidden = true; }, 800);
  const f = el("film");
  const pr = f.play();
  if (pr && pr.catch) pr.catch(() => {});
}

/* ---------- Passer l'intro (clic) ---------- */
document.addEventListener("click", () => { if (stage !== "film") goFilm(); });

/* =========================================================
   Barre de chapitres (règle façon pellicule)
   - petits traits réguliers + grands traits = chapitres
   - effet "loupe" : les traits grandissent près du curseur
   - vignette de la frame au survol + clic pour naviguer
   ========================================================= */

// Chapitres : `t` = position dans le film (0 = début, 1 = fin).
// 👉 Ajuste ces valeurs / noms quand tu auras les vrais minutages.
const CHAPTERS = [
  { t: 0.00, label: "Plan drone" },
  { t: 0.20, label: "Cérémonie" },
  { t: 0.46, label: "Sortie des mariés" },
  { t: 0.68, label: "Vin d'honneur" },
  { t: 0.86, label: "Soirée" },
];

const film      = el("film");
const scrubber  = el("scrubber");
const ticksWrap = el("scrubTicks");
const preview   = el("scrubPreview");
const thumb     = el("scrubThumb");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let filmDur = 0;
let ticks = [];        // { el, bar, frac, chapter }

function buildTicks() {
  ticksWrap.innerHTML = "";
  ticks = [];
  const w = ticksWrap.clientWidth;
  const n = Math.max(28, Math.floor(w / 9));   // ~1 trait tous les 9px

  // Les chapitres tombent EXACTEMENT sur un trait de la grille (grands traits centrés)
  const chapterIdx = new Set(CHAPTERS.map((ch) => Math.round(ch.t * (n - 1))));

  for (let i = 0; i < n; i++) {
    const frac = i / (n - 1);
    ticks.push(addTick(frac, chapterIdx.has(i)));
  }
}

function addTick(frac, isChapter) {
  const t = document.createElement("span");
  t.className = "tick" + (isChapter ? " tick--chapter" : "");
  t.style.left = (frac * 100) + "%";
  const bar = document.createElement("b");
  bar.className = "tick-bar";
  t.appendChild(bar);
  ticksWrap.appendChild(t);
  return { el: t, bar, frac, chapter: isChapter };
}

// Effet loupe : chaque trait grandit selon sa distance au curseur.
// `cx` = position (lissée) du curseur, `s` = intensité globale 0→1 (fondu entrée/sortie).
function magnify(cx, width, s) {
  const R = 92;   // rayon d'influence (px)
  for (const t of ticks) {
    const d = Math.abs(t.frac * width - cx);
    const k = Math.max(0, 1 - d / R);
    const ease = k * k * (3 - 2 * k);
    const amp = ease * s;
    const scale = 1 + amp * (t.chapter ? 1.3 : 1.9);
    t.bar.style.transform = `scaleY(${scale})`;
    t.bar.style.opacity = (t.chapter ? 0.75 : 0.3) + amp * 0.6;
  }
}

/* --- Animation fluide : la vague suit le curseur avec un léger retard,
       et l'effet monte/descend en fondu (pas de saut) --- */
let animId = 0;
let targetCx = null;   // position visée (null = curseur hors barre)
let dispCx = 0;        // position affichée (lissée vers targetCx)
let strength = 0;      // intensité affichée (lissée vers 0 ou 1)
let stripW = 1;        // largeur de la zone des traits (mise en cache)
let needInit = true;   // pour caler la vague sous le curseur à la 1re frame

function frame() {
  const targetS = (targetCx === null) ? 0 : 1;
  strength += (targetS - strength) * 0.16;                 // fondu de l'intensité
  if (targetCx !== null) dispCx += (targetCx - dispCx) * 0.26;   // la vague rattrape le curseur

  magnify(dispCx, stripW, strength);

  // On s'arrête quand l'effet est complètement retombé
  if (targetS === 0 && strength < 0.003) {
    strength = 0;
    magnify(dispCx, stripW, 0);
    animId = 0;
    return;
  }
  animId = requestAnimationFrame(frame);
}
function ensureLoop() {
  if (!reduceMotion && !animId) animId = requestAnimationFrame(frame);
}

function onMove(e) {
  const rect = ticksWrap.getBoundingClientRect();
  stripW = rect.width;
  const cx = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
  const frac = rect.width ? cx / rect.width : 0;
  const t = frac * filmDur;

  targetCx = cx;
  if (needInit) { dispCx = cx; needInit = false; }   // 1re frame : pas de balayage depuis 0

  // vignette : position + frame correspondante
  let x = e.clientX - scrubber.getBoundingClientRect().left - preview.offsetWidth / 2;
  x = Math.max(6, Math.min(scrubber.clientWidth - preview.offsetWidth - 6, x));
  preview.style.left = x + "px";
  if (filmDur && !thumb.seeking && Math.abs((thumb.currentTime || 0) - t) > 0.15) {
    try { thumb.currentTime = t; } catch (_) {}
  }

  if (reduceMotion) magnify(cx, rect.width, 1);   // sans animation : direct
  else ensureLoop();
}

scrubber.addEventListener("mouseenter", () => { preview.classList.add("show"); needInit = true; });
scrubber.addEventListener("mousemove", onMove);
scrubber.addEventListener("mouseleave", () => {
  preview.classList.remove("show");
  targetCx = null;           // déclenche le fondu de sortie
  needInit = true;
  if (reduceMotion) magnify(dispCx, stripW, 0);
  else ensureLoop();
});
scrubber.addEventListener("click", (e) => {
  e.stopPropagation();                 // ne pas déclencher le "passer l'intro"
  if (!filmDur) return;
  const rect = ticksWrap.getBoundingClientRect();
  const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  film.currentTime = frac * filmDur;
  const pr = film.play(); if (pr && pr.catch) pr.catch(() => {});
});

function initScrub() {
  filmDur = film.duration || 0;
  if (!filmStage.hidden) buildTicks();   // sinon, généré par goFilm quand le film s'affiche
}
if (film.readyState >= 1 && film.duration) initScrub();
else film.addEventListener("loadedmetadata", initScrub);

let rz;
window.addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => { if (filmDur) buildTicks(); }, 200);
});
