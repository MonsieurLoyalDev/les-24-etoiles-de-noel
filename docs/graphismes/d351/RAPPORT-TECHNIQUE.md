# D.3.5.1 — Étape A : Cour du Foyer et place centrale

Proposition intégrée au vrai jeu React/Vite/Phaser 3, sur la branche feature/phase-d3-5-1-temoin. Aucune généralisation, fusion ou mise en ligne. Les captures ne sont pas des dessins conceptuels.

## Audit de départ

Carte réelle : 1920 × 1408, 16 habitations et quatre bâtiments visitables, 38 chemins et cinq cours. Les façades, l’atlas du sapin, les 223 fichiers publics et les intérieurs sont conservés. Le placement D35 rejetait tous les chevauchements de rectangles de sprites : les canopées et arbustes ne pouvaient pas se superposer, ce qui séparait les éléments et laissait certains ensembles incomplets. Le jardin de Loyal et la cour du Foyer avaient peu de regroupements ; la place gardait de grands pans de pavés nus. Les réserves d’interaction et les accès constituent de vraies limites de composition, notamment dans la venelle étroite à gauche de Loyal.

## Composition proposée

25 placements D35 sont remplacés par 61 éléments réunis en 14 ensembles : jardin de Loyal, petit accueil, bosquet près du foyer, banc de voisinage, porche et bois, jardin commun, coin cadeaux, marché et jardin de place. La composition a été simplifiée après contrôle visuel pour retirer une succession d’objets trop verticale dans la venelle. Le coin convivial de la place comprend deux bancs deux places, une petite table et une lanterne. Les deux étals existants conservent leurs positions et leur marchandise intégrée. Les différences de tailles et les superpositions de végétaux créent des sous-bois, plutôt qu’une répartition régulière d’arbres.

Les emprises au sol restent distinctes ; les feuillages d’un même ensemble peuvent se superposer avec tri par profondeur. Les façades et ouvertures sont dégagées. Les cinq clôtures et portillons sont conservés ; leurs jardins sont peuplés, leurs segments ne sont pas redessinés dans cette étape. Aucun nouvel étal ou nouveau mobilier n’est dessiné. Le nombre d’éléments est indiqué pour rendre le changement vérifiable, sans objectif de quota.

14 langues de neige irrégulières modulent uniquement les chemins des secteurs témoins, en révélant la neige D31 sous les pavés. Cinq accumulations emploient le sprite organique D3 existant au pied des compositions. Pas de nouvelle texture générale de neige, pas de nouveau dessin, pas de déplacement de bâtiment. Les traces déjà présentes restent conservées ; aucun système d’empreintes n’est ajouté.

## Préservation et technique

292 fichiers src/public de D35 restent strictement identiques, dont les 223 assets publics. Deux fichiers de rendu existants changent pour appeler la composition et le traitement local des chemins ; un module de composition est ajouté. La carte, les personnages, le HUD, les portraits, les dialogues, le calendrier, les quêtes, mini-jeux et formats de sauvegarde ne changent pas. Les trois autres quartiers conservent exactement leurs placements. Les emprises des nouveaux décors s’ajoutent seulement aux secteurs témoins ; les collisions des bâtiments, clôtures et chemins restent identiques. Le repositionnement sûr préexistant traite une ancienne position devenue occupée. Les textures et compositions sont préparées à l’entrée de scène, sans nouveau travail de terrain par frame.

## Contrôles réellement exécutés

- TypeScript, lint, build de production et build E2E : réussis.
- 165 tests unitaires réussis ; deux tests POSIX ignorés sous Windows.
- 18 tests navigateur réussis, aucun ignoré ou échoué. Le contrôle des quartiers a aussi été rejoué deux fois avec sa fixture autonome ; ces reprises ne sont pas ajoutées au nombre de cas uniques.
- Parcours complet, sauvegarde/journal, joystick tactile, trois mini-jeux et 24 journées avec final : inclus dans la sélection.
- Les tests spécifiques contrôlent les 38 chemins, l’identité des placements hors témoin, les deux portillons du Foyer, les entrées/sorties des quatre bâtiments, la récupération d’une ancienne position sous un décor et la conservation des étoiles. Les 17 interactions décoratives sont également rejouées au clavier et au toucher.
- Réduction des mouvements et mesure RAF dans les deux formats.

- PC : RAF p95 4.30 ms, moyenne 4.19 ms, 180 échantillons, CPU ×1.
- Mobile émulé : RAF p95 16.80 ms, moyenne 16.67 ms, 180 échantillons, CPU ×4.

Ces mesures de Chrome local ne sont pas une garantie sur téléphone physique. La suite historique complète de 108 cas D35 n’est pas présentée comme réexécutée : cette étape dispose d’une sélection de 18 cas et des unités. L’avertissement connu du chunk Phaser supérieur à 500 ko reste présent.

## Images et limites

Viewport PC 1280 × 900 ; les détails de chemin et de portillon sont des recadrages identiques de 600 × 390 et 500 × 340, sans agrandissement. Même position sauvegardée et même horloge pour chaque paire avant/après ; mobile 390 × 844. Le jeu conserve son zoom habituel. La galerie propose un affichage à 100 % et des aperçus adaptés à l’écran. WebP qualité 95, sans redimensionnement : compression avec perte légère, non annoncée comme identité des pixels.

Aucun nouvel asset graphique : l’inventaire énumère les 25 sprites réutilisés. Les éclairages et la météo restent les systèmes existants, avec réduction des mouvements. Les quatre intérieurs et les autres quartiers ne font pas partie de cette refonte témoin. Les postures d’assise extérieure, nouveaux effets complexes et nouvelles interactions ne sont pas ajoutés. La validation artistique de ces deux propositions vous appartient.

**Arrêt de l’étape A : attendre votre accord avant toute généralisation.**
