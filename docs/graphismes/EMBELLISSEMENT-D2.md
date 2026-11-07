# Étoilebois — D.2, version 0.6.0

## Périmètre et décisions

Cette livraison poursuit D.1 (commit `423d12c`) sur `feature/phase-d2-embellissement`. Aucun travail des étapes graphiques suivantes, déploiement VPS ou fusion automatique.

La place s'organise autour du sapin existant : parvis ovale, allée principale de 48 unités, raccords de 28 à 40 unités. Les quatre façades, leurs dimensions, portes, collisions et interactions restent à leurs coordonnées d'origine. La neige demeure entièrement praticable aux mêmes endroits : les nouveaux chemins sont un habillage visuel.

La bibliothèque reçoit un coin lecture avec bancs, jardinières et clôture. L'auberge conserve son identité, avec une terrasse enneigée pour Madeleine. L'atelier reçoit le stand de cadeaux existant, des bûches et des paquets. La maison conserve ses accès, avec banc, clôture et plantations. Des bosquets encadrent le village et deux sentiers rejoignent les lisières. Une arche existante marque l'arrivée.

**Façades manquantes :** le pack ne fournit aucune mairie, boulangerie ou poste autonome. Conformément à l'accord de l'utilisateur, aucun faux bâtiment n'est ajouté. Les abords d'Augustin et le point courrier d'Émile utilisent les panneaux et décorations disponibles. L'auberge n'est pas rebaptisée boulangerie. Aucun nouvel intérieur ni dialogue n'est inventé.

## Ressources et intégration

77 ornements supplémentaires utilisent 14 ressources déjà présentes dans le pack. L'[inventaire détaillé](INVENTAIRE-D2.json) donne source, SHA-256, nombre, position, dimensions, quartier, chemins et parvis. Les éléments physiques de la carte restent présents ; les deux anciens cadeaux utilisent désormais le petit paquet validé plutôt que deux grands stands. Un seul stand garnit l'atelier. Les anciens ornements libres sont recomposés selon le nouveau plan.

Les découpes de banc enneigé et guirlande ainsi que le masque de l'arche sont calculés au chargement, puis mis en cache. Les PNG originaux ne sont pas modifiés. Les corrections D.1 des contours, portraits, proportions et neige restent actives. La fontaine, le panneau d'affichage et la caisse à fleurs ne sont pas intégrés : leurs sources contiennent des fragments voisins ou des bases tronquées. Leur ajout aurait détérioré la qualité visuelle.

Le sol est composé une seule fois dans une texture 1024 × 768. Les textures neige, pavés et terre proviennent du pack ; de grandes plages réfléchies limitent les raccords répétitifs. Des bordures fines et ombres de contact ancrent les façades et décors. Aucun halo ni effet météorologique supplémentaire. Le tri des objets suit leur profondeur ; les bosquets de fond ne masquent pas les interactions.

Sur téléphone en portrait, le zoom passe de 2 à 1,5 pour montrer davantage le village et les grandes façades. PC et téléphone paysage gardent le zoom 2. La taille des personnages dans le monde, la vitesse et les coordonnées ne changent pas. Les effets déjà présents suivent les dimensions de caméra adaptées.

## Conservation de D.1 et du gameplay

[153 fichiers protégés](INVARIANTS-D2.json) sont identiques à D.1 : ressources publiques, cartes, HUD et dialogues, traitement des pixels, sauvegardes, logique métier et migrations concernées par l'audit. Les fins de ligne des textes sont normalisées pour la comparaison ; les images sont comparées octet par octet. Aucun changement du calendrier, des 24 activités, mini-jeux, authentification ou autorisations.

Les nouvelles décorations sont ornementales : elles n'ajoutent aucun collider au graphe existant. Leurs bases évitent les portes, objets interactifs, points de chasse et patrouille d'Augustin. Elles ne doivent pas être considérées comme de nouveaux objets interactifs.

## Vérifications

- Tests unitaires : **128 réussis, 2 ignorés** (contrôles POSIX hors Windows), 11 fichiers.
- Lint et TypeScript : réussis.
- Compilation privée et contrôle d'exclusion des surprises de démonstration : réussis.
- Compilation E2E : réussie.
- Compilation normale : réussie.
- Suite navigateur complète : **27 réussis, 5 ignorés** selon le format concerné, 32 cas, 5,9 minutes. Aucun échec. Le contrôle D.2 est ensuite relancé après agrandissement de la fenêtre des captures de façades PC : **5 réussis, 1 ignoré**, 21,6 secondes.
- Les cinq tests D.2 vérifient les ressources validées, les sprites entièrement contenus dans le monde, les réserves d'interaction, les largeurs et destinations, les bancs sans chevauchement et la patrouille. Un parcours en largeur sur une grille de 8 unités confirme l'accessibilité de tous les points réservés avec les collisions originales.
- Playwright couvre les parcours réels, quatre intérieurs, dialogues, sauvegarde/reprise, mini-jeux et activités des 24 jours sur PC et mobile, ainsi que les captures D.2.

Les builds signalent toujours le gros chunk Phaser. Les références publiques du mode privé sont copiées par le mécanisme existant ; leurs avertissements Vite ne sont pas des erreurs de fichier absent.

## Contrôle visuel et limites

Le [comparatif avant/après](comparatif-d2.html) présente les vues globales, PC et téléphone prises dans le jeu. Les captures des quatre abords complètent le contrôle. Les vues de place et de façade utilisent une sauvegarde de test positionnée pour le cadrage ; elles ne constituent pas une téléportation disponible au joueur.

Les tests mobiles utilisent Chromium avec viewport tactile 390 × 844, et les contrôles D.1 couvrent aussi 320 px et le paysage. Les promenades PC sont capturées en 1280 × 800 ; les quatre façades PC utilisent une fenêtre 1280 × 1000 pour montrer leurs toitures entières. La vue globale est en 2048 × 1634.

Le plan limite les nouveaux objets à 77 et le sol est mis en cache. Un échantillon local de 119 intervalles `requestAnimationFrame` par format donne une médiane de 4,2 ms et un P95 de 4,3 ms sur PC, 4,2 ms sur mobile simulé : [mesures brutes](PERFORMANCE-D2.json). Ce contrôle indique la cadence du navigateur headless sur cet ordinateur ; il ne mesure pas le temps GPU Phaser et ne garantit aucune cadence sur téléphone physique. Un essai matériel reste nécessaire.

Les sapins simples et les façades plus détaillées restent ceux du pack validé. Leur différence de niveau de détail est visible. Les façades V10 conservent les limites de leur source déjà signalées en D.1 ; aucun dessin de remplacement n'est créé. La D.2 est proposée pour validation visuelle, avant toute autre étape.

## Fichiers de mise en œuvre

- `src/art/village-design.ts` : placements, quartiers, allées, parvis et réserves de contrôle.
- `src/art/landscape.ts` : composition du sol et ombres de contact mises en cache.
- `src/art/world.ts` : chargement et instanciation des ressources existantes, inscriptions sur panneaux.
- `src/art/prepare.ts` : découpes et masque additionnels, corrections D.1 conservées.
- `src/game/Game.ts` : cadrage mobile et adaptation des effets existants au zoom.
- `tests/village-design.test.ts`, `tests/e2e/phase-d2.spec.ts` : contrôles et captures.
- `package.json`, `package-lock.json` : version 0.6.0, aucune nouvelle dépendance.
- `docs/graphismes/*D2*`, `docs/screenshots/phase-d2/` : rapport, inventaire, invariants et preuves visuelles.

Pour reproduire : `npm ci`, `npm run lint`, `npm test`, `npm run build:private`, `npm run build:e2e`, puis `ETB_E2E_BUILT=1 npx playwright test` (PowerShell : `$env:ETB_E2E_BUILT='1'`). Terminer par `npm run build` pour une compilation normale ; `npm run dev` permet l'exploration locale.
