# Correction graphique D.1 — version 0.5.1

Base conservée : `c7dff6183bdb091240ee0ac8b63b1f11c44952a8`, livraison graphique D1–D9. Branche de correction : `fix/phase-d1-qualite-visuelle`. Cette étape corrige le rendu réel ; elle ne remplace pas le projet et n'ajoute aucun gameplay.

## Comparaison visuelle

Ouvrir [le comparatif avant/après PC et mobile](comparatif-d1.html). Les captures avant sont des fichiers intacts de la version 0.5.0. Les captures après sont produites par Playwright dans les mêmes formats : PC 1280×800, mobile 390×844. Une vue globale 2048×1634 contrôle l'intégrité des quatre façades ; un téléphone 320×640 contrôle les petits écrans.

Mesures du DOM après correction, enregistrées dans `D1-MESURES-desktop.json` et `D1-MESURES-mobile.json` :

| Élément | Avant | Après |
|---|---|---|
| Dialogue PC | largeur 1100 px, environ 500 px de haut | 740×151 px, 21,5 % de la hauteur du monde |
| Dialogue mobile | panneau composite de près de 300 px de haut | 376×157 px, 20,8 % de la hauteur du monde |
| Portrait PC | environ 264×315 px | image 72×96 px dans un cadre 76×100 |
| Portrait mobile | environ 100×122 px | image 50×74 px dans un cadre 54×78 |
| HUD PC | 112 px de haut | 72 px |
| HUD mobile | 132 px de haut | 64 px, une ligne |
| Surface du monde PC | 1280×648 | 1280×702 |
| Surface du monde mobile | 390×678 | 390×754 |

Les valeurs « avant » approximatives proviennent du cadre composite et des captures conservées ; les valeurs après sont mesurées automatiquement. La taille du dialogue varie avec son texte et le nombre réel de choix.

## Corrections effectuées

### Dialogue

Le grand composite `dialogue_narratif.png` n'est plus affiché. Le cadre compact utilise la bordure/parchemin d'un élément validé existant, découpée en neuf zones ; aucune nouvelle illustration n'a été dessinée. Le fragment doré supérieur droit et la jonction verticale du composite disparaissent du rendu. Nom, texte et choix restent dynamiques, avec les mêmes callbacks.

Portrait et texte sont disposés dans une grille, avec texte de 15 px sur PC et 13 px sur mobile. Les boutons ne s'étirent plus inutilement sur toute la largeur. Les textes longs défilent dans leur zone, les choix restent accessibles et la fenêtre peut défiler si nécessaire. Les cibles des commandes mobiles du HUD mesurent au moins 44×44 px.

### Terrains

La neige fournie contient des pixels d'alpha faible, jusqu'à 35 sur les échantillons contrôlés : ces trous révélaient le fond sombre du moteur et produisaient les points parasites. Le sol de neige est désormais opaque, contrairement aux sprites qui conservent leur transparence.

La macrotexture V7 reste la source. Un filtrage spatial déterministe atténue ses détails isolés et son contraste avant le chargement GPU, sans ajouter de motif aléatoire. Le rendu conserve les coordonnées continues à l'échelle du village, sans mélanger des tuiles sans rapport. Les pavés utilisent un échantillonnage plus fin ; les raccords clairs sont limités aux bords extérieurs. Les anciens carreaux V6, visuellement discordants avec les pavés V7, ne recouvrent plus des tuiles entières. Les bandes de terre aux limites du décor se fondent progressivement dans la neige.

Le plan logique reste celui de `place-des-lanternes.json`, désormais suivi à sa résolution native de 16 px ; le JSON n'a pas été modifié. Les chemins, entrées, objets interactifs et collisions ne sont pas déplacés.

### Bâtiments et décorations

Les quatre façades sont affichées à des largeurs harmonisées de 180, 208, 208 et 224 unités monde, sans déformation de leur rapport largeur/hauteur. Les points d'entrée et les rectangles de collision sont inchangés. Les pins recouvrant une façade dans la planche de placement passent derrière celle-ci ; leur position et collision restent identiques. Les autres pins sont réduits à 64 unités de large pour moins concurrencer les façades.

Recadrages de production ciblés (coordonnées dans les PNG d'origine, aucune retouche des fichiers) :

| Décor | Rectangle x, y, largeur, hauteur | Défaut éliminé |
|---|---|---|
| Lampadaire | 61, 0, 82, 214 | morceau de poteau voisin ; halo brun opaque détouré selon la silhouette originale |
| Banc avec plaid | 0, 0, 177, 114 | débris sous le banc |
| Panneau | 27, 0, 108, 119 | fragment gris à gauche |
| Bonhomme de neige | 15, 12, 151, 195 | lanterne voisine et fragments supérieurs |
| Jardinière | 0, 0, 138, 95 | débordements latéraux |
| Clôture | 42, 24, 331, 74 | pieds/objets de la ligne précédente de la planche |
| Stand | 10, 8, 207, 228 | bordures et guirlande voisine |
| Brasero | 10, 0, 113, 129 | fragment de toiture et fond parasite autour du feu |

Les composantes détachées sont retirées ; les franges utiles d'un pixel sont conservées. Sur les façades, seuls les pixels de matte gris semi-transparents reliés à l'extérieur sont effacés avant l'isolation de la silhouette principale. Les couleurs opaques des bâtiments ne sont pas supprimées par une sélection globale de gris. Les lanternes gardent un éclairage doux, réduit et recentré sur leur verre.

### Personnages et HUD

L'échelle des sept humains est calculée sur la silhouette visible des poses d'origine, cible 52 unités monde, et non sur la hauteur variable des cellules PNG. Flocon garde une taille proportionnée de petit renard (31 unités). Un repère de pieds commun par atlas évite de recalculer un détourage différent à chaque frame. Sprites, visages, vêtements, directions et séquences d'animation sont conservés. Les étiquettes sont rapprochées des personnages.

Titre, date, compteur et boutons conservent leurs images validées dans un bandeau plus bas. Le fragment du bord gauche du compteur est exclu de l'affichage. Les informations de lieu et de quête prennent moins de place ; le journal garde les détails des objectifs. Les boutons restent accessibles au clavier et portent les mêmes libellés d'accessibilité.

## Fichiers du code modifiés

| Fichier | Rôle |
|---|---|
| `src/art/correction-d1.css` | dispositions compactes et responsive, dernière couche de styles |
| `src/art/Dialogue.tsx` | structure du panneau compact, portrait et actions |
| `src/art/pixels.ts` | filtrage du sol, isolation des silhouettes et bornes alpha |
| `src/art/prepare.ts` | recadrages, textures Canvas de présentation et métriques d'acteurs |
| `src/art/world.ts` | échelles des décors/façades, terrain continu et raccords |
| `src/art/actors.ts` | normalisation visuelle et pieds |
| `src/game/Game.ts` | choix des textures corrigées, profondeur et repères visuels |
| `src/main.tsx` | import des styles de correction uniquement |
| `package.json`, `package-lock.json` | numéro 0.5.1, aucune dépendance ajoutée |
| `tests/pixels.test.ts`, `tests/e2e/correction-d1.spec.ts` | contrôles de traitement et de rendu |

README, ce bilan, les mesures, le comparatif et les captures accompagnent ces changements. Les captures existantes des régressions sont actualisées par leurs parcours.

## Vérifications et limites

Les PNG validés restent identiques par empreinte. Aucun changement dans `src/domain.ts`, `src/save.ts`, `src/calendar.ts`, `src/rpg`, `src/advent`, `supabase` ou la carte logique. Les traitements de présentation sont calculés une fois par texture puis mis en cache ; rien n'est filtré à chaque frame. Aucun appel à un générateur d'images, aucun nouveau dessin, aucune mission ou mécanique ajoutée.

Résultats : ESLint et TypeScript réussis ; builds normal, privé et fixture E2E réussis. **123 tests unitaires/SQL réussis**, deux cas POSIX réservés à Linux, dix fichiers. **22 tests navigateur réussis en 5,9 minutes**, quatre exclusions propres au format (planche de portraits et vue globale seulement sur PC ; paysage et petit téléphone seulement sur mobile). Les tests couvrent aussi la lettre/quête initiale, les quatre intérieurs, les trois mini-jeux, les 24 activités, les sauvegardes et le calendrier privé. Les contrôles D.1 sont rejoués après les derniers ajustements de halo/étiquettes et la réduction mémoire des buffers. La vérification sur téléphone reste une émulation navigateur ; aucun test sur appareil physique n'est prétendu effectué.

Limites des sources conservées : les pins V1 et le sapin V11.4 ont un niveau de détail différent des façades peintes ; leur identité n'a pas été remplacée. Le sapin et certaines poses restent limités par leur résolution et leur dessin d'origine. Les portraits Loyal/Flocon gardent les écarts documentés dans la livraison D (pas de lunettes/étoile frontale ajoutées arbitrairement). Les intérieurs restent ceux du projet existant. Aucun déploiement ni modification du VPS.
