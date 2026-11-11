# D.3.5.1 — C : les dernières touches de magie

Proposition pour validation artistique. Référence B de9b507, branche feature/phase-d3-5-1-finitions. Aucune fusion, aucun déploiement.

## Corrections localisées

**Le coin des voisins.** Le banc, la table et la lanterne de B restent en place. Un panier au pied du banc et un arbuste bas sur son côté libre forment un entourage asymétrique. Les bandes de passage sont conservées ; aucune rotation de sprite.

**Devant le chalet.** La réserve de bois est conservée. La boîte aux lettres décorative isolée est remplacée par un panier de petit bois ; le petit paquet auparavant isolé devant une autre maison rejoint cette scène. Les accessoires se rapportent ainsi à une même activité. Aucun objet interactif ni texte de jeu n'est modifié.

**Au jardin familial.** Les deux sapins et l'arbuste de B restent aux mêmes positions, avec la petite table existante. Le jardin est trop étroit pour recevoir un banc deux places sans barrer son accès : le banc de jardin de 80 px est placé sur l'accotement voisin, avec la lanterne et la jardinière réinstallées le long de cette entrée. Une petite base de neige tassée native ancre l'assise, sans étirement ni nouvelle texture générale. Le portillon reste celui de B.

**Deux raccords neige/pavés.** La langue de neige devant l'accès H02 est raccourcie et moins continue. La forme située dans le passage vers H03 est décalée vers sa bordure, laissant davantage de pavés lisibles au centre. Aucun tracé ni largeur fonctionnelle n'est changé. Les huit formes de neige des Livres et des Artisans et les autres raccords B sont conservés. Le contrôle complémentaire révèle toutefois que l’arrosoir de J4, déjà présent en B, serre trop le passage juste derrière son portillon. Son déplacement de 15 px vers la gauche libère cette entrée ; c’est la seule correction aux Artisans. L’établi, les caisses, les autres accessoires et toute la végétation y sont conservés. Aucun défaut constaté ne justifie de refaire les clôtures, les Livres, le Foyer ou la place.

Le total passe de 74 à 77 placements dans les compositions B : trois éléments supplémentaires, cinq accessoires réaffectés ou déplacés. Il ne s'agit pas d'une nouvelle densification générale. Aucun nouvel asset graphique.

## Préservation et contrôles

Un seul fichier d'exécution change : src/art/quarters351b.ts. Les positions des maisons, le plan 1920 × 1408, les quatre bâtiments, les intérieurs, les personnages, les portraits, le HUD, les dialogues, le calendrier, les mini-jeux, les contrôles et les formats de sauvegarde ne changent pas. Les 223 fichiers publics sont identiques, vérifiés par SHA-256. Les 187 placements hors corrections sont identiques à B, dont les 67 éléments de la référence A.2.

Le tampon RGBA du calque précalculé des chemins est identique hors des deux petites zones retouchées (SHA-256 ce3a465ed02213dc6f9b65aa89b96991450cb2da72ed76f1f64a531aab6a03ab, 10781804 octets comparés). La base locale sous le nouveau banc est distincte de ce calque et réemploie une ressource existante ; la neige générale D.3.1 reste inchangée.

Les gardes existants contrôlent façades, socles, bandes de circulation et clôtures. Tous les 77 placements sont acceptés, aucun refus résiduel. Les cinq portillons et les collisions structurelles sont conservés ; les emprises des accessoires suivent leurs positions effectives.

## Tests réellement exécutés

TypeScript, lint, builds production et E2E réussis. 170 tests unitaires réussis (23 fichiers) ; deux contrôles POSIX ignorés sous Windows. 28 cas navigateur distincts validés au final, sans double comptage des reprises. La première sélection donne 24 réussites et deux parcours avec une cible invalide dans la façade H15 ; ces parcours sont corrigés vers C3 et rejoués avec succès. Après découverte puis déplacement de l’arrosoir préexistant de J4, dix cas ciblés sont réexécutés sur le rendu final : préservation, parcours continu, nouveau contrôle d’entrée/sortie J4, 38 chemins, façades et collisions. Les 18 autres résultats de la sélection précédente sont conservés car ils ne dépendent pas de cet unique déplacement décoratif. Les résultats détaillent chaque exécution, y compris les deux échecs initiaux du test. Aucun test ignoré ni instable.

La sélection couvre PC et mobile émulé : parcours continu Foyer → Livres → Veillées → place centrale → Artisans → Foyer, puis les quatre seuils des Veillées et une entrée/sortie du jardin J2 ; quatre entrées/sorties de bâtiments, portillons du Foyer, 38 chemins libres, tour du sapin, interactions décoratives existantes, sauvegarde/reprise et récupération d'une position bloquée, trois mini-jeux, 24 journées et final, joystick tactile et réduction des mouvements. Les contrôles de façades et de collisions hérités sont également exécutés. Un contrôle complémentaire valide les entrées et sorties réelles des jardins J1 et J4, sur PC et mobile émulé ; J2 est traversé dans le parcours continu, JL et J3 sont contrôlés par le parcours du Foyer. Les tests historiques ne sont pas tous relancés ; les résultats détaillés figurent dans TESTS.json.

- livres : RAF p95 4.30 ms, moyenne 4.17 ms, CPU ×1, 180 échantillons ; effets réduits vérifiés.
- veillees : RAF p95 4.30 ms, moyenne 4.17 ms, CPU ×1, 180 échantillons ; effets réduits vérifiés.
- artisans : RAF p95 4.30 ms, moyenne 4.17 ms, CPU ×1, 180 échantillons ; effets réduits vérifiés.
- veillees-mobile : RAF p95 4.30 ms, moyenne 4.17 ms, CPU ×4, 180 échantillons ; effets réduits vérifiés.

Terrain précalculé en 274 ms lors de la capture des Veillées. Aucun recalcul de terrain par frame ni nouveau système d'animation.

## Galerie et anomalies restantes

26 captures du véritable jeu : paires B/C à position, cadrage, heure et réglages identiques ; vues après finition pour les Livres et les Artisans. Les animations restent actives, leur phase peut différer. Les gros plans sont des recadrages natifs, sans redimensionnement. WebP qualité 95, proportions conservées ; cette compression haute qualité n'est pas annoncée sans perte. Images intégrées dans une galerie autonome hors ligne, avec zoom 100 %.

Aucune anomalie bloquante connue après les contrôles exécutés. La validation artistique finale vous appartient. Les bancs conservent leurs orientations natives, sans animation d'assise nouvelle. Le repos familial est à côté du jardin, son étroitesse excluant un grand banc intérieur sans gêner les déplacements. Certaines surfaces calmes restent volontairement ouvertes. Les effets et les éclairages existants ne sont pas refondus. Les tests mobiles sont une émulation Chrome, pas des essais physiques Android/iOS ; réseau mobile et Safari restent à vérifier. Les avertissements connus du build sur les imports JSON et le gros chunk Phaser subsistent. Aucune D.4 commencée.

