/* =========================================================
   Galerie — photo au centre + pellicule à droite
   Ordre ALÉATOIRE à chaque visite.
   TOLÉRANT AUX SUPPRESSIONS : supprime les fichiers que tu ne
   veux pas dans assets/photos/ — la galerie s'adapte toute seule.
   ========================================================= */

// Toutes les photos possibles. Tu peux en retirer / en ajouter librement.
const PHOTOS_LIST = [
  // Photos existantes
  "assets/photos/d01.jpg", "assets/photos/d02.jpg", "assets/photos/d03.jpg",
  "assets/photos/d04.jpg", "assets/photos/d05.jpg",
  "assets/photos/g01.jpg", "assets/photos/g02.jpg", "assets/photos/g03.jpg",
  "assets/photos/g04.jpg", "assets/photos/g05.jpg", "assets/photos/g06.jpg",
  "assets/photos/g07.jpg", "assets/photos/g08.jpg",
  // Photos uploadées
  "assets/photos/w01.jpg", "assets/photos/w02.jpg", "assets/photos/w03.jpg",
  "assets/photos/w04.jpg", "assets/photos/w05.jpg", "assets/photos/w06.jpg",
  "assets/photos/w07.jpg", "assets/photos/w08.jpg", "assets/photos/w09.jpg",
  "assets/photos/w10.jpg", "assets/photos/w11.jpg", "assets/photos/w12.jpg",
  "assets/photos/w13.jpg", "assets/photos/w14.jpg", "assets/photos/w15.jpg",
  "assets/photos/w16.jpg", "assets/photos/w17.jpg", "assets/photos/w18.jpg",
  "assets/photos/w19.jpg", "assets/photos/w20.jpg", "assets/photos/w21.jpg",
  // Images extraites de la vidéo
  "assets/photos/v01.jpg", "assets/photos/v02.jpg", "assets/photos/v03.jpg",
  "assets/photos/v04.jpg", "assets/photos/v05.jpg", "assets/photos/v06.jpg",
  "assets/photos/v07.jpg", "assets/photos/v08.jpg", "assets/photos/v09.jpg",
  "assets/photos/v10.jpg",
];

// Mélange aléatoire (Fisher-Yates)
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const el = (id) => document.getElementById(id);
const mainImg    = el("main");
const stripInner = el("stripInner");

// Ne garde que les photos réellement présentes (préchargement),
// puis mélange → ordre aléatoire sans image cassée.
Promise.all(
  PHOTOS_LIST.map((src) => new Promise((resolve) => {
    const im = new Image();
    im.onload  = () => resolve(src);
    im.onerror = () => resolve(null);
    im.src = src;
  }))
).then((loaded) => {
  const PHOTOS = shuffle(loaded.filter(Boolean));
  if (PHOTOS.length) initGallery(PHOTOS);
});

function initGallery(PHOTOS) {
  let index = 0;

  // Construit la pellicule
  const thumbs = PHOTOS.map((src, i) => {
    const t = document.createElement("img");
    t.className = "thumb";
    t.src = src;
    t.alt = "";
    t.addEventListener("click", () => setActive(i));
    stripInner.appendChild(t);
    return t;
  });

  function setActive(i) {
    index = (i + PHOTOS.length) % PHOTOS.length;
    mainImg.style.opacity = 0;
    const src = PHOTOS[index];
    const pre = new Image();
    pre.onload = () => { mainImg.src = src; mainImg.style.opacity = 1; };
    pre.src = src;
    thumbs.forEach((t, k) => t.classList.toggle("active", k === index));
    centerStrip();
  }

  // Garde la vignette active centrée sans laisser de vide.
  function centerStrip() {
    const active = thumbs[index];
    if (!active) return;
    const vh = window.innerHeight;
    const total = stripInner.scrollHeight;
    let t = vh / 2 - (active.offsetTop + active.offsetHeight / 2);
    const min = Math.min(0, vh - total);
    t = Math.max(min, Math.min(0, t));
    stripInner.style.transform = `translateY(${t}px)`;
  }

  /* ---------- Navigation ---------- */
  const next = () => setActive(index + 1);
  const prev = () => setActive(index - 1);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); next(); }
    if (e.key === "ArrowUp"   || e.key === "ArrowLeft")  { e.preventDefault(); prev(); }
  });

  let wheelLock = false;
  window.addEventListener("wheel", (e) => {
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => { wheelLock = false; }, 280);
    (e.deltaY > 0) ? next() : prev();
  }, { passive: true });

  window.addEventListener("resize", centerStrip);

  setActive(0);
}
