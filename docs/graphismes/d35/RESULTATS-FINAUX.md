# Étoilebois D.3.5 — livraison pour validation artistique

Version 0.7.5, branche feature/phase-d3-5-details. Aucune fusion, aucun déploiement et aucune D.4.

## Modifications

Les 20 bâtiments, les 38 chemins, les quatre intérieurs et la structure D.3.4 sont conservés. Les chemins disposent de pavés à petite échelle, de terre tassée, de dalles, de contours irréguliers, de neige mêlée au passage et de raccords composés ensemble. Le sol général D.3.1 reste inchangé. Les cinq enclos utilisent quatre styles de clôtures, 74 poteaux partagés et 69 panneaux, avec les cinq ouvertures de 32 pixels préservées.

La scène comprend 160 ornements hors étals et clôtures, 5 bancs deux places, 23 arbres au cœur des quartiers et 10 dans le centre. Les jardins et les petits coins de vie sont différenciés : table à deux tasses près de l’auberge, panier et traîneau, cadeaux, réserves de bois, jardinières et lanternes. Aucun personnage, portrait, HUD, dialogue, calendrier, mini-jeu, récompense ou format de sauvegarde n’est remplacé.

## Ressources

51 variantes sont créées : 4 bancs, 9 compositions de cadeaux, 6 stocks de bois, 12 accessoires, 16 modules de clôture (quatre styles) et 4 matières de sol. Les 47 cadres de sprites sont contenus dans un atlas de 1820 × 1820 ; les quatre matières dans un atlas de 224 × 224. 43 cadres servent directement à la scène. Les pixels des cadres et leurs marges alpha sont testés, les six natifs sont conservés dans ARTWORK, et les 221 PNG antérieurs restent identiques. Les prompts et le processus d’export figurent dans docs/graphismes/d35/PROMPTS.md.

## Résultats exécutés depuis le ZIP

- Installation npm ci, TypeScript, lint et trois builds (privé, production, E2E) : réussis. Le build privé confirme l’absence de paquet de surprises fictives et de médias de démonstration.
- 163 tests unitaires réussis ; 2 contrôles POSIX ignorés sous Windows.
- 108 cas navigateur uniques : **96 réussis, 12 ignorés, aucun échec et aucun cas manquant**. Les ignorés correspondent aux captures documentaires produites une seule fois ou à des formats spécifiques ; les annotations figurent dans d35-VERIFICATION-BROWSER.json.
- Parcours de déplacement, 16 portes d’habitations, cinq ouvertures de clôtures, entrées/sorties des quatre intérieurs, collisions, 17 interactions décoratives, sauvegardes anciennes, 24 journées, trois mini-jeux, clavier, tactile et réduction des mouvements couverts par la suite.
- Le nouveau contrôle vérifie aussi les centres des 38 chemins avec les colliders réels et les façades dégagées.
- Intégrité : 398 fichiers du manifeste source vérifiés (294 fichiers src/public identiques au projet testé), plus le manifeste lui-même. 829 chemins ARTWORK restaurés et vérifiés individuellement, dont les six originaux natifs.

Les journaux d35-source-*.log documentent l’exécution. Les essais historiques interrompus ne sont pas comptés. La branche privée a été publiée par Git. Le connecteur renvoie 404 pour les statuts GitHub Actions ; aucun résultat CI n’est déclaré réussi.

## Archives

- **D35-SOURCE-LIGHT.zip** : 90 400 774 octets (90.40 Mo). SHA-256 : `5f11ed4d5702539bafcf0df5adfd5f2c98f86c021137d6bc5118d24072a52cf4`.
- **D35-ARTWORK.zip** : 559 547 710 octets (559.55 Mo). SHA-256 : `6270d8f69e1e34d4b6ae0e813386b3e19b8abb0c051a72d7a9cac39ddf0c729e`.

SOURCE-LIGHT exclut node_modules, .git, builds, captures, vidéos, anciens ZIP, caches et originaux natifs. ARTWORK contient les originaux, comparatifs, médias de validation et outils artistiques ; les doublons exacts sont mutualisés par SHA-256 sans réencodage. Son README décrit la restauration des dossiers lisibles. Le classement des 30 fichiers les plus lourds, les poids des dossiers et le dédoublonnage figurent dans D35-POIDS.json.

## Performances et limites

- PC : RAF p95 4.30 ms, moyenne 4.17 ms, 180 échantillons ; CPU ×1. Terrain statique préparé en 141 ms.
- Mobile émulé : RAF p95 4.30 ms, moyenne 4.17 ms, 180 échantillons ; CPU ×4. Terrain statique préparé en 139 ms.

Ces mesures sont celles de Chrome local, avec ralentissement CPU ×4 pour le contrôle mobile ciblé, et ne garantissent pas une fréquence sur téléphone physique. Le chargement sur réseau mobile réel reste à mesurer. L’audit npm relève 10 alertes modérées dans la chaîne ESLint/minimatch, aucune haute ou critique ; les dépendances verrouillées sont conservées pour cette livraison graphique. Le détail figure dans d35-dependances-audit.json. Le build conserve l’avertissement connu d’un chunk Phaser supérieur à 500 ko. Les budgets d’effets, le mode allégé et la réduction des mouvements sont préservés. Les façades V10 conservent leurs limites intrinsèques déjà documentées. Sur un cadrage serré dans un portillon, Loyal peut se rapprocher fortement de Debby : ce comportement de suivi est déjà visible dans le comparatif D.3.4 et a été conservé.

Les quatre cadres de collection non placés simultanément restent disponibles dans l’atlas. L’assise extérieure et l’ouverture/fermeture interactive des portillons ne sont pas ajoutées. La validation artistique finale de cette proposition vous appartient.

## Captures et documents

La galerie docs/graphismes/d35/validation.html présente le village complet avant/après, les chemins et les places, cinq clôtures, les quatre quartiers végétalisés, PC/mobile, jour/crépuscule/nuit, et six planches d’accessoires à l’échelle du jeu ×2. Les douze comparatifs rapprochés utilisent les mêmes positions de prise de vue et le même format 1280 × 900 dans D.3.4 et D.3.5. Le rapport détaillé, l’inventaire et les prompts sont dans docs/graphismes/d35/.

Ce bilan a été ajouté au dépôt après le gel des archives testées. Les ZIP restent strictement identiques à ceux extraits pour la validation complète.
