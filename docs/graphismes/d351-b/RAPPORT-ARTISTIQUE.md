# D.3.5.1 — B : les quartiers enchantés

Proposition pour validation artistique, branche feature/phase-d3-5-1-quartiers. Ni fusion ni déploiement. Référence : A.2 c5f2e47.

## Composition

**Cour des Livres.** Un banc et une petite table sont accompagnés de végétaux bas et d'une lumière de lecture. Un jardin clos associe arbre dénudé, arbustes, panier et jardinière. Des attentions discrètes appartiennent aux seuils et au courrier ; le petit arbre oriental conserve un entourage bas et une façade dégagée.

**Cour des Veillées.** Le banc de voisinage reçoit une table latérale, une lanterne et un arbuste. Un petit sapin occupe l'intervalle entre deux maisons. Les réserves de bois, les boîtes aux lettres et les lumières se rapportent à des foyers précis. Le jardin familial regroupe deux tailles de conifères, une table et des plantations.

**Cour des Artisans.** L'établi détaillé déjà disponible dans les ressources des intérieurs est réutilisé dehors, avec caisses, petit bois, outils et lanterne. Le présentoir existant de l'atelier est conservé avec ses accessoires compatibles, sans doubler les objets proches. Une réserve de bois est regroupée près d'une maison ; une autre composition évoque l'expédition des cadeaux. Le jardin devient utilitaire, avec arrosoir, bois et outils, accompagné de végétaux modestes.

**Chemins.** Douze formes directionnelles distinctes apportent des langues de neige et de petites ruptures locales, limitées à l'emprise des chemins existants. Elles réemploient visuellement la neige sous-jacente, laissent certains pavés apparents et ajoutent une légère ombre froide. Six petites bases natives sont réutilisées sans déformer leurs proportions. Le rendu du terrain est calculé une seule fois, jamais à chaque frame.

Il s'agit d'une recomposition : 66 anciens placements locaux remplacés par 74 éléments regroupés en 19 scènes (21 Livres, 22 Veillées, 31 Artisans), soit huit placements de plus. Aucun nouvel asset graphique, aucune génération. Les chevauchements autorisés concernent le feuillage d'un même groupe ; les emprises solides restent séparées. Les clotures et leurs cinq portillons conservent leur construction existante.

## Préservation

La carte, les 16 maisons, les quatre bâtiments et leurs intérieurs n'ont pas changé. La Cour du Foyer et la place A.2 sont exclues des nouveaux périmètres ; leurs 67 placements et leurs métadonnées sont identiques à la référence. Un contrôle du tampon RGBA des chemins confirme l'identité pixel par pixel sur l'emprise A.2 (SHA-256 ec74489077833efd8a054edf98262ca2c032d2589263bf027b047327e64c3a68). Les 223 fichiers publics sont identiques au manifeste antérieur, vérifiés par SHA-256. Les sources du plan, des façades, des clôtures, des personnages, du HUD, des dialogues, des mini-jeux, des sauvegardes et du calendrier ne sont pas modifiées. Seuls scenery34 et ground35 sont raccordés au nouveau module quarters351b.

Les emprises décoratives suivent les nouveaux placements : aucun changement des collisions structurelles ni des réserves de passage. Les sources des intérieurs et le format de sauvegarde sont conservés.

## Tests et performances

TypeScript, lint, build de production et build E2E réussis. 169 tests unitaires réussis ; deux tests POSIX ignorés sous Windows. 26 cas navigateur ciblés réussis sur PC et mobile émulé, sans échec : compositions, 38 chemins libres, déplacements réels vers douze maisons et trois portillons, accès aux quatre bâtiments, sauvegarde/reprise, interactions décoratives, 24 journées et final, trois mini-jeux, joystick et réduction des mouvements.

desktop : RAF p95 4.30 ms, moyenne 4.17 ms, 180 échantillons, CPU ×1.

mobile : RAF p95 4.30 ms, moyenne 4.17 ms, 180 échantillons, CPU ×4.

Terrain précalculé en 295 ms dans la capture locale de référence B. Les mesures et les parcours détaillés figurent dans TESTS.json. Les tests historiques complets ne sont pas tous réexécutés : il s'agit d'une sélection de régression adaptée aux changements. Le premier essai des nouveaux parcours a été interrompu pour corriger une erreur du test (porte lue comme un tableau plutôt qu'un objet) ; il n'est pas compté comme réussite.

## Captures et limites

30 captures du vrai jeu, avant A.2 / après B. Même position de départ, viewport, horloge et réglages par paire ; les animations restent actives. Trois quartiers et leurs vues nocturnes, village complet, jardins, trois transitions de chemin, accessoires artisanaux et mobile. Les détails sont recadrés sans redimensionnement. Galerie autonome, WebP qualité 95, proportions intactes et bouton 100 % ; compression haute qualité, non annoncée sans perte.

Les orientations natives des bancs sont conservées : aucune rotation artificielle ni nouvelle posture assise. L'éclairage et les animations sont ceux du jeu existant ; leur phase peut varier entre captures. Le mobile est émulé dans Chrome, pas testé sur un téléphone physique. Performances réseau et appareils d'entrée de gamme réels restent à mesurer. Les avertissements existants du build concernant les imports JSON et le gros chunk Phaser subsistent. Les surfaces calmes sont conservées intentionnellement ; cette proposition ne prétend pas supprimer toute neige libre. Aucun travail D.4. Votre validation artistique est attendue avant fusion ou mise en ligne.
