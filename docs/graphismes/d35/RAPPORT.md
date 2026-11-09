# D.3.5 — la magie dans les détails

Version 0.7.5, branche feature/phase-d3-5-details. Base : D.3.4 SOURCE-LIGHT et son code identique au dépôt, avant intervention. Cette livraison attend votre validation artistique. Aucune fusion, aucun déploiement et aucune D.4.

## Environnement

Les 20 bâtiments, les 38 chemins et les cinq cours conservent exactement le plan D.3.4. Les nouvelles matières de chemins sont composées dans une seule surface statique : distance aux tracés et aux polygones, variations corrélées des contours, neige mêlée au passage, prélèvement de pavés à petite échelle et raccords continus par prolongement miroir. Les intersections sont calculées ensemble ; aucun trait épais ou ruban de sprite ne sert de rendu. La neige générale D.3.1 et les zones de terre/herbe/pierres sont conservées.

Les clôtures réemploient les contours physiques et les cinq ouvertures de 32 pixels D.3.4. 69 panneaux et 74 poteaux uniques composent les cinq enclos. Les rails sont projetés sur le sol et les poteaux restent verticaux ; les profils verticaux ont leurs modules propres. Les vantaux sont rabattus hors du passage. Quatre matières distinguent les jardins : bois rustique, piquets, rondins sculptés et bois/cuivre.

La scène emploie 159 ornements, 5 bancs et 23 arbres dans les quartiers résidentiels, plus 10 arbres dans le centre et les boisements préservés. Les arbres sont placés en petits groupes autour des cours, en conservant les vues sur les façades et les portes. Les cinq jardins ont des compositions distinctes. Une table avec deux tasses, un panier et un traîneau, un présentoir de cadeaux et un stock de bois complètent les coins de vie.

Les bancs mesurent environ 80 pixels de large pour 25 à 32 pixels de haut, face aux personnages de 52 pixels. Deux positions d’assise sont préparées par banc, sans nouveau bouton ni animation de posture. Les cadeaux de quête conservent leurs identifiants, positions, conditions et récompenses ; leurs images sont remplacées par les paquets rouge et crème, de faible hauteur. Le paquet haut est décoratif et placé hors des chemins. Les empreintes des nouveaux bancs, stocks et arbres sont adaptées à leurs bases visibles.

## Ressources

51 variantes graphiques créées : 4 bancs, 9 compositions de cadeaux, 6 stocks de bois, 12 accessoires, 16 modules de clôture et 4 matières de sol. Les 47 sprites sont préparés dans un atlas de 1820 × 1820 et les quatre matières dans un atlas de 224 × 224. Les deux PNG publics sont les seules nouvelles images nécessaires au jeu. 42 des 47 cadres servent directement à la scène ; la collection complète est présentée dans les planches. Les PNG natifs et les prompts sont séparés dans ARTWORK.

Le test des pixels vérifie chaque cadre RGBA contre l’export de préparation ; les marges transparentes et les emplacements des cadres sont contrôlés. Les 265 fichiers protégés couvrent les 221 images publiques antérieures, les personnages, le HUD, les intérieurs, les dialogues, les quêtes, le calendrier, les mini-jeux, la sauvegarde, la neige et le plan de référence.

## Validation et limites

Les commandes et résultats définitifs figurent dans le bilan LIVRAISON-D35.md fourni avec les ZIP et dans les journaux de livraison. Les contrôles comprennent TypeScript, lint, tests unitaires, builds privé/production, navigateurs PC/mobile, parcours des entrées et sorties, collisions, interactions, anciennes sauvegardes, 24 journées et mini-jeux. Les nouveaux contrôles vérifient aussi les centres des 38 chemins avec les colliders réels, les façades dégagées, les cinq ouvertures, les bancs et la réduction des effets.

Les mesures graphiques sont effectuées dans Chrome local, avec CPU ralenti ×4 pour le contrôle mobile ciblé. Ce ne sont pas des mesures sur téléphone physique ni une garantie de fréquence sur tous les appareils. Le terrain et les clôtures sont calculés à la création puis réutilisés, sans travail de génération par image. Les effets conservent les budgets et la réduction des mouvements existants.

Certaines variantes de la collection sont réservées à la réutilisation et ne sont pas toutes placées simultanément dans le village. Les façades V10, le sapin et les apparences validées sont conservés, avec les limites intrinsèques déjà documentées. L’assise extérieure et l’ouverture/fermeture interactive des portillons ne sont pas ajoutées. La validation artistique finale vous appartient.

## Livrables

D35-SOURCE-LIGHT.zip contient le code, les deux atlas d’exécution, tous les assets nécessaires et les fixtures de non-régression, les tests, configurations et documents essentiels. D35-ARTWORK.zip contient les originaux, captures, comparatifs et outils artistiques, avec dédoublonnage exact par SHA-256. Aucun média n’est recompressé avec perte. Les tailles exactes, SHA-256 et résultats de l’extraction vierge sont fournis à côté des archives.

Ouvrir validation.html pour la galerie ; consulter INVENTAIRE.json pour les cadres, variantes, positions d’assise et compositions ; consulter PROMPTS.md pour la génération et la reproduction de l’export.
