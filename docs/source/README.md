# Étoilebois — Pack d’intégration Phaser V1

Ce ZIP contient **des ressources techniques prototypes** et une **carte JSON de 64×48 tuiles (16 px)**. Il ne s’agit pas encore du jeu complet ni d’un rendu fidèle aux planches artistiques.

## Contenu
- `public/assets/ground/ground.png` : atlas 8×4, 32 tuiles de 16 px.
- `public/assets/props/` : 13 PNG transparents 80×80 px.
- `public/assets/characters/` : silhouettes temporaires Debby et Loyal, sans animations. **Ne pas les confondre avec les personnages validés.**
- `public/assets/references/` : planche de la Place des Lanternes, référence visuelle non découpée.
- `src/game/maps/place-des-lanternes.json` : plan de placement, objets et bâtiments logiques.
- `assets-manifest.json` : chemins, tailles et origines.
- `PROMPT_CODEX.md` : instructions d’intégration.

## Notes d’intégration
Copier `public/assets` dans le répertoire `public` de l’application Vite, `src/game/maps` dans le projet et charger le manifeste comme configuration. Pour la couche de sol, `this.load.spritesheet("ground", "/assets/ground/ground.png", {frameWidth:16,frameHeight:16})`. Les indices `ground[y][x]` correspondent aux frames 0–31, indexées par ligne. Pour les props 80×80, positionner au point d’ancrage au sol, pas au centre visuel. Les rectangles de bâtiment sont des emplacements réservés et doivent être remplacés par de vrais assets découpés.

**Important :** les 4 directions de marche et les spritesheets validées n’existent pas encore comme fichiers exploitables. Il faudra les produire avant de considérer les personnages terminés. Ne pas annoncer de fonctionnalités complètes avant tests.
