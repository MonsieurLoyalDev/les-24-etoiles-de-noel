# Étoilebois — D.2.1, version 0.6.1

Base : D.2, commit `4afaf6b67ea00121e1b8bf53a874570a7774eb56`. Branche : `feature/phase-d2-1-finitions`. Aucun travail D.3, aucune fusion automatique et aucun déploiement.

## Neige et abords

Les quatre vrais PNG répétables 64 × 64 du pack sont utilisés, sans modifier leurs octets. Leur composition déterministe à opacité modérée conserve un sol clair. Des variations bleutées à grande échelle évitent une lecture en damier ; quelques congères irrégulières ancrent les pieds des bâtiments, sapins et clôtures. Quatre courtes séries de traces de pas sont purement visuelles et fixes. Les matériaux, axes, largeurs, parvis, collisions et destinations D.2 restent inchangés.

Le sol est calculé une fois dans une texture de 1024 × 768, puis conservé en cache. Aucune génération de bruit, congère ou trace par frame. Les anciens raccords D.2 et les traitements D.1 restent en place.

## Végétation

Le ZIP fourni contient deux planches de référence, quatre textures utilisables, un aperçu et deux documents. Les planches contiennent cadres, textes et fonds : elles ne sont ni découpées automatiquement ni chargées par le jeu. Le prompt joint demandait de signaler l'absence de sprites utilisables ; l'utilisateur a ensuite explicitement autorisé : **« Créer les sprites transparents »**.

Trois créations imagegen isolées remplacent donc réellement les textures de rendu :

| Ancien rendu | Nouveau PNG | Instances |
| --- | --- | --- |
| `vegetation_pine_large` | `fir-source.png` | 30 |
| `vegetation_bush_snow` | `bush-source.png` | 16 |
| `vegetation_bush_berries` | `berries-source.png` | 5 |

Les sapins sont affichés à plusieurs tailles, avec quelques symétries et une teinte discrète de fond. Les textures de runtime sont recadrées sur l'alpha avec une marge, limitées à 256 pixels et mises en cache. La largeur de certaines instances proches du bord est réduite pour conserver leur sommet dans le monde. Les pieds et tous les colliders originaux restent aux mêmes coordonnées. Les anciens fichiers ne sont pas écrasés.

Les trois sprites ont un véritable canal alpha, des coins transparents et aucun fond rectangulaire dans les captures. Leur apparence est **proposée à la validation artistique**, et ne doit pas être présentée comme déjà validée. [Prompts, provenance et méthode](D21-GENERATION.md). [Inventaire avec dimensions et SHA-256](INVENTAIRE-D21.json).

## Enseignes et étiquettes

Les rectangles de noms sont remplacés par des plaques compactes : bois sombre, bordure cuivrée, texte crème, petits détails de cadre. Le texte est séparé du dessin et calculé dynamiquement. Nunito gras est utilisé pour les noms ; Marcellus pour les lieux, avec une résolution de texte doublée pour rester lisible.

Le même système couvre Debby, Loyal, Augustin, Madeleine, Émile, Célestine, Basile et Flocon. Il suit les personnages après la mise à jour de la caméra, cale les coordonnées sur les pixels affichés, sépare les étiquettes voisines et limite leur position au champ visible. Les visages restent dégagés. Toutes les étiquettes disparaissent pendant les dialogues et les interfaces qui mettent le jeu en pause. Les noms et identifiants d'interaction ne changent pas.

Les enseignes comportent de petites touches de neige. Une seule enseigne contextuelle apparaît à proximité, juste au-dessus de la toiture et ramenée dans le champ si nécessaire : elle ne recouvre ni porte ni visage. Les quatre lieux existants affichent Maison de Loyal, Bibliothèque de Célestine, Atelier de Basile et Auberge des Étoiles.

**Mairie, boulangerie et poste :** ces façades restent absentes, comme en D.2. Les libellés demandés sont prêts dans `signNames`, mais aucun faux lieu ni accès n'est créé. L'auberge n'est pas renommée boulangerie. Les noms incrustés dans les façades validées fournies sont conservés : les nouvelles enseignes dynamiques n'altèrent pas ces PNG.

## Conservation et contrôles

L'[audit d'invariants](INVARIANTS-D21.json) confirme **158 fichiers protégés inchangés** depuis D.2, dont les ressources existantes, personnages, cartes, HUD, dialogue, sauvegardes, données des journées, mini-jeux, migrations et règles d'accès vérifiés. Les changements de `Game.ts` portent sur les textures et étiquettes ; mouvement, interactions, progression et collisions ne sont pas réécrits.

- Lint et TypeScript : réussis.
- Tests unitaires : **133 réussis, 2 ignorés** sous Windows (contrôles POSIX), 12 fichiers.
- Suite navigateur complète : **36 réussis, 6 ignorés** selon le format, 42 cas en 7,5 minutes.
- Après les derniers ajustements de répartition des quatre variantes de neige et de masquage des étiquettes au bord supérieur : **9 contrôles D.2.1 réussis, 1 ignoré**, 52,4 secondes. Les captures livrées proviennent de cette passe finale.
- Builds E2E, privé et normal : réussis. Le contrôle du build privé confirme l'exclusion des surprises et médias de démonstration.

Les nouveaux tests couvrent le placement des plaques, la séparation des noms, la conservation des huit identités, la disparition en dialogue, les bords gauche/droit sur PC/mobile, la stabilité à l'arrêt après déplacement réel, l'alpha des végétaux, les tailles et l'autorisation des ressources publiques. La suite existante conserve ses parcours réels dans les quatre intérieurs, trois mini-jeux, sauvegardes et 24 journées.

## Comparaison et limites

[Comparatif D.2 / D.2.1](comparatif-d21.html) : PC 1280 × 800, téléphone tactile simulé 390 × 844, façades PC 1280 × 1000 et vue globale 2048 × 1634. Les captures de façades et d'intérieurs utilisent des sauvegardes de test positionnées, tandis que les parcours de non-régression utilisent les commandes du jeu.

Les 13 captures « avant » sont identiques octet par octet aux captures de la livraison D.2 ; les 21 captures « après » restent dans un dossier distinct. Les captures historiques A/B/C/D.1/D.2 ont été préservées après les tests.

Les essais mobiles restent une émulation Chromium, pas une mesure sur téléphone physique. Le chargement comprend environ 3,9 Mo de nouveaux PNG de végétation avant compression HTTP. Le cache évite leur retraitement à chaque pièce. Le chunk Phaser conserve son avertissement de taille connu.

## Fichiers concernés

`src/art/snow-detail.ts`, `landscape.ts` : textures et détails de neige. `vegetation.ts`, `world.ts` : substitution, alpha et mise en cache. `tag-layout.ts`, `tags.ts`, `src/game/Game.ts` : cadres et suivi visuel. `ops/public-assets.json` : sept PNG explicitement autorisés pour le build privé. `tests/refinements-d21.test.ts`, `tests/e2e/phase-d2-1.spec.ts` : validation. `package.json` et lockfile : version 0.6.1, aucune nouvelle dépendance. Ressources, inventaires et captures dans les dossiers D.2.1 dédiés.

Reproduire : `npm ci`, `npm run lint`, `npm test`, `npm run build:private`, `npm run build:e2e`, puis `ETB_E2E_BUILT=1 npx playwright test` (PowerShell : `$env:ETB_E2E_BUILT='1'`). `npm run build` génère le build normal. `npm run dev` permet l'exploration locale.
