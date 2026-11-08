# Étoilebois — D.3, version 0.7.0

Base : D.2.2, commit `c35508956ce34264d9d94204349665d4322b5fa2`. Branche `feature/phase-d3-village-vivant`. Cette livraison travaille le terrain et l'ambiance du RPG existant. Aucun nouveau gameplay, personnage principal, bâtiment, dialogue, mission ou règle du calendrier.

## Terrain : priorité visuelle

Dix nouveaux PNG transparents sont créés pour compléter les ressources antérieures, conservées intactes. [Prompts exacts et méthode imagegen intégrée](D3-GENERATION.md). [Inventaire, dimensions, SHA-256 et placements](INVENTAIRE-D3.json).

| Ressource | Variantes | Implantation |
| --- | ---: | --- |
| Terre brune, herbes d'hiver et neige | 2 | Bosquets, pied des arbres, jardin de Loyal, massifs |
| Neige tassée, traces légères et petits graviers | 2 | Entrées, parvis, terrasse, point courrier, passages de la place |
| Dégel et givre sur terre | 2 | Bords des sentiers et des jardins |
| Congères et neige autour d'une petite roche | 2 | Fondations, clôtures, pieds des arbres |
| Cailloux et touffes d'herbe enneigées | 1 | Lisières et bordures |
| Empreintes de pattes | 1 | À proximité de Flocon et du sentier forestier |

Les six variantes de terrain forment **24 nappes situées et nommées**, auxquelles s'ajoutent **14 détails**. Leurs emplacements suivent les bosquets, fondations, clôtures et lieux de passage ; ils ne sont pas tirés au hasard. Deux raccords relient les sapins au bosquet sud-ouest, et un passage tassé rejoint le banc et la place. Les empreintes humaines déjà présentes restent utilisées.

Ces nouvelles ressources sont des formes organiques RGBA, et non des rectangles de couleur ou des atlas découpés à l'aveugle. Leurs contours se composent sur la neige continue. Les pavés et les tracés D.2.2 sont ensuite peints par-dessus : leur largeur, leur topologie et les accès restent inchangés. Les pierres et herbes sont des détails visuels du sol, sans collider.

Le contrôle colorimétrique de la texture de fond, avant éclairage et recouvrement par les bâtiments, retrouve environ **70,6 % de pixels clairs et 10,1 % de pixels bruns**. C'est un indicateur de composition ; les captures restent la référence artistique. Le sol reste opaque à 100 %, sans les anciens trous alpha de D.1.

Les PNG originaux restent inchangés. Au chargement, une passe d'isolement garde la silhouette principale et élimine les fragments détachés ; le chemin de pattes conserve ses empreintes séparées. Les copies de rendu sont recadrées à l'alpha, limitées à 512 pixels avec une bordure transparente de deux pixels, puis mises en cache. Le contrôle alpha porte sur ces textures préparées et conserve aussi les valeurs des originaux : un pixel source à 1/255 d'alpha est supprimé du rendu. Les textures sources GPU temporaires sont retirées après préparation. L'ensemble du sol est composé une fois dans une texture 1024 × 768.

## Un village animé avec retenue

- Chute de neige par épisodes, avec apparition et disparition progressives, tailles légèrement différentes, dérive et vent lent. Aucun gros flocon.
- Fumée douce des quatre cheminées existantes. Les ancrages sont relevés sur les façades validées, en coordonnées relatives à chaque image.
- Renforcement chaud des fenêtres et lanternes existantes, variations lentes et très faibles de lumière, guirlandes légèrement animées.
- Lumière douce au pied du sapin central ; scintillements froids discrets vers les lisières la nuit.
- Mouvement de quelques végétaux et guirlandes, limité à 0,15 degré. Le budget privilégie les silhouettes réellement visibles, même lorsque leur pied est hors cadre.
- Quelques particules soulevées près de vrais arbres et massifs. Animations d'attente et comportements existants des habitants conservés.

Les fenêtres sont déjà peintes lumineuses dans les PNG validés : elles restent visibles de jour. Les nouvelles couches renforcent leur présence au crépuscule et la nuit, sans redessiner les façades. Les glows ont un bord transparent, un rayon limité et une variation lente. Les nuages de fumée restent rattachés aux cheminées ; aucun effet de cheminée n'est ajouté dans une zone vide.

Les effets sont regroupés dans un contrôleur purement visuel. Ils n'émettent aucun événement de quête, n'accordent aucune étoile et ne créent aucune interaction. Les intérieurs ne reçoivent ni chute de neige ni fumée extérieure.

## Jour, crépuscule et nuit

Le contrôleur lit **l'horloge existante du village** : aurore froide, jour clair, crépuscule rosé et bleuté, nuit indigo avec lumières chaudes. Les transitions de teinte, de voile et d'intensité sont progressives en fin de période.

Le fonctionnement de `period`, les horaires des habitants et les règles de déverrouillage des 24 journées sont conservés. Aucun nouveau contrôle de date n'est ajouté au calendrier. Les portraits et le HUD restent en dehors de l'éclairage du monde.

## Qualité graphique et performances

Le bouton **Paramètres** existant accueille un champ **Effets du village**. Aucun élément n'est ajouté au HUD principal. Le réglage est stocké sous `etoilebois-graphics-v1`, séparément des sauvegardes et du volume sonore. Il s'applique immédiatement.

| Mode | Neige | Fumée | Vent | Scintillements | Décors mobiles |
| --- | ---: | ---: | ---: | ---: | ---: |
| Complets | 40 | 16 | 6 | 10 | 8 |
| Légers | 14 | 8 | 2 | 4 | 3 |
| Sans animations d'ambiance | 0 | 0 | 0 | 0 | 0 |

Le mode automatique choisit le mode léger quand le plus petit côté de la zone de jeu est inférieur à 700 pixels, y compris en paysage. La préférence système de réduction des mouvements est prioritaire, même si le mode complet est sélectionné. Les lumières statiques et la lecture de l'heure restent disponibles.

Les particules sont créées dans des pools bornés, sans création de nouveaux objets Phaser à chaque frame. Les lumières et fumées hors champ sont masquées ; les décors mobiles utilisent un test de silhouette visible. Le terrain n'est pas recalculé pendant la promenade. Les scènes masquées et les intérieurs évitent les mises à jour d'effets extérieurs.

Les mesures brutes sont dans `D3-PERFORMANCE-desktop.json`, `D3-PERFORMANCE-mobile.json` et `D3-ANIMATION-*.json`. Elles utilisent l'horloge réelle du navigateur, sans horloge de test simulée. Le P95 mesure uniquement le coût CPU du contrôleur d'ambiance ; la cadence et le delta viennent de Phaser. Ce ne sont ni des temps GPU ni des mesures sur téléphone physique. La vidéo est encodée à 25 images/s indépendamment de la cadence du moteur.

Relevé final près de l'atelier, après 14 secondes d'animation nocturne :

| Profil Chrome local | Mode | Neige active | Fumées actives | Particules maximales | CPU ambiance P95 | Delta moyen Phaser |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| PC 1280 × 1000 | Complet | 40 | 12 | 72 | ≈ 0,10 ms | ≈ 4,17 ms |
| Écran mobile simulé 390 × 844 | Léger | 14 | 4 | 28 | ≈ 0,10 ms | ≈ 4,17 ms |

Ces courts relevés sur le même ordinateur vérifient surtout le coût et les budgets d'effets ; ils ne prédisent pas la cadence d'un appareil mobile réel. Les contrôles de réduction des mouvements retrouvent zéro particule et zéro décor mobile.

Les dix PNG représentent **13 796 773 octets** avant compression HTTP. Les originaux haute définition sont conservés pour l'édition ; le rendu utilise les copies recadrées. Un essai sur téléphone réel, notamment pour le chargement initial, reste utile avant mise en production.

## Conservation du jeu

[Audit d'invariants](INVARIANTS-D3.json) : **179 fichiers protégés inchangés** depuis D.2.2, dont ressources antérieures, personnages, végétation, façades, données du calendrier, portraits, dialogues, HUD, sauvegardes, mini-jeux et migrations.

L'analyse des sources vérifie également **21 méthodes antérieures identiques**, les constructions de collisions identiques et la simulation `update` identique en dehors du remplacement de l'ancien bloc cosmétique. Le fichier React principal est identique hors deux imports et l'insertion du composant de paramètres graphiques. Les clés et versions de sauvegarde restent celles du projet existant.

## Vérifications et livrables

- Lint et TypeScript : réussis.
- Tests unitaires : **141 réussis, 2 ignorés** sous Windows (contrôles POSIX), 14 fichiers.
- Les premières passes D.3 ont validé les sols, les trois ambiances, les réglages et la reprise. L'encodeur vidéo Playwright manquant a été installé. Une course de copie d'export mobile a ensuite été corrigée en fermant la page avant la copie, puis le contexte ; les deux exports ont été revérifiés avec succès.
- Suite navigateur complète finale : **53 réussis, 9 ignorés, aucun échec**, 62 cas PC/mobile, en 12,1 minutes. Les cas ignorés concernent les vues réservées à un format. La passe ciblée D.3 avait également réussi : 7 tests, 1 vue globale ignorée sur mobile.
- Builds `build:e2e`, `build:private` et `build` : réussis, TypeScript inclus. Le contrôle privé confirme l'absence du paquet de surprises fictives et des médias de démonstration dans ce bundle.
- Présentation : 38 liens locaux vérifiés, 10 originaux conformes aux SHA-256 de l'inventaire, 22 captures « avant » identiques au commit D.2.2. Livrables visuels : 21 PNG « après » et deux vidéos WEBM.

Les tests D.3 vérifient la couverture colorimétrique du sol, son opacité, les dix canaux alpha et les bords transparents, les plafonds de particules, la priorité de la réduction des mouvements, la persistance des préférences et des étoiles, les ambiances et les exports vidéo. La suite historique conserve les parcours réels dans les quatre intérieurs, les dialogues, les trois mini-jeux, les 24 journées et le final.

[Comparatif avant/après et trois ambiances](comparatif-d3.html) · [Démonstration animée PC/mobile](demonstration-d3.html). Les captures D.3 utilisent l'heure réelle du navigateur pour permettre les mesures de performance ; les sauvegardes de test fixent l'heure du village et la position. La date du HUD peut donc différer des références D.2.2. Les compteurs visibles dépendent de ces sauvegardes de test, sans nouvelle récompense introduite.

Les captures historiques sont préservées. Les nouvelles ressources et ambiances sont proposées à validation artistique. Aucun déploiement, fusion automatique ou travail de phase suivante n'est effectué.

## Reproduire

`npm ci`, `npm run lint`, `npm test`, `npm run build:e2e`, puis `ETB_E2E_BUILT=1 npx playwright test` (PowerShell : `$env:ETB_E2E_BUILT='1'`). Avec Chrome local, installer au besoin l'encodeur par `npx playwright install ffmpeg`. La CI existante installe Chromium avec ses dépendances et son encodeur.

`npm run build:private` vérifie l'exclusion des surprises de démonstration ; `npm run build` produit le build normal. `npm run dev` permet l'exploration. Les avertissements connus de taille du chunk Phaser et de résolution des références publiques dans le mode privé ne bloquent pas les builds.
