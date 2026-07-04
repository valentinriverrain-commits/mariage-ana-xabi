# 🎬 Site du film de mariage

Site une page à partager. Déroulé : **loader 0→100 %** → **photos qui montent du bas vers le haut** → **le film**.

## Lancer / prévisualiser en local
Dans ce dossier :
```
python -m http.server 8778
```
Puis ouvrir http://localhost:8778

> Il faut un petit serveur (comme ci-dessus) plutôt qu'un double-clic sur `index.html`, sinon la vidéo peut ne pas se charger.

## Partager en ligne (gratuit)
Glisser-déposer **tout le dossier `Site`** sur :
- **Netlify Drop** → https://app.netlify.com/drop
- ou **Cloudflare Pages**, **GitHub Pages**, **Vercel**…

Tu obtiens un lien à envoyer aux invités.

## Remplacer la vidéo (montage final)
Quand le montage 1920×1080 est prêt :
1. Exporter en **MP4 (H.264)**.
2. Remplacer le fichier `assets/video/film.mp4` (garder le même nom).
3. (optionnel) Changer l'image d'attente : attribut `poster=` dans `index.html`.

## Changer les photos de l'animation
- Les images sont dans `assets/photos/`.
- La liste affichée est en haut de `main.js` (constante `PHOTOS`). Ajoute / retire / réordonne les chemins.

## Page galerie (`galerie.html`)
- 2ᵉ page : grande photo au centre (viseur à coins), pellicule de toutes les photos à droite, photo active encadrée en doré, et compteur « numéro / total ».
- Navigation : clic sur une vignette, molette, ou flèches du clavier.
- Pour ajouter tes photos : dépose-les dans `assets/photos/` puis ajoute leurs chemins dans la constante `PHOTOS` en haut de `galerie.js` (le total se met à jour tout seul).
- On y accède via le lien « Galerie → » en bas à droite de la page du film ; retour avec la flèche en haut à gauche.

## Régler le tempo
Dans `main.js`, en haut :
- `LOADER_MIN_MS` — durée minimale du loader (défaut 3200 ms).
- `MONTAGE_MS` — durée de l'animation photos avant le film (défaut 6000 ms).

## Détails
- Police fournie : `assets/fonts/davinci-italic.otf` (utilisée pour le %).
- Couleur dorée et grain « film » réglables dans `styles.css` (variable `--gold`, classe `.grain`).
- Cliquer pendant l'intro passe directement au film.
- Responsive : 3 colonnes sur ordinateur, 2 sur mobile.
