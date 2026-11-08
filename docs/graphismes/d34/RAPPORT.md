# Étoilebois D.3.4 — rapport d’intégration

Version 0.7.4, branche feature/phase-d3-4-village. Référence : implantation D.3.4 V2 approuvée par l’utilisateur. **En attente de validation artistique finale. Aucune fusion ni aucun déploiement.**

## Implantation

Les 20 bâtiments suivent les positions et dimensions du plan V2 : 16 maisons, 4 lieux visitables. Le sapin conserve l’atlas V11_4, son échelle et ses 24 étapes. Le monde reste 1920×1408 pixels. Les deux étals réutilisent un asset décoratif existant. Les quartiers sont reliés à la place et entre eux par les venelles du plan.

Les polygones, cours, routes et portillons proviennent de src/art/plan-d34.json. Les portails, retours extérieurs, ancres des activités, personnages extérieurs, éclairages et fumées utilisent leurs nouvelles positions. Aucune nouvelle interaction ou activité n’a été créée.

## Identité des quartiers

- Q1, Cour des Livres : coin lecture, bancs, jardinières et arbustes enneigés.
- Q2, Cour des Veillées : petits jardins, bûches, caisses fleuries et baies.
- Q3, Cour du Foyer : cour en terre/neige tassée, moins de plantations répétées, bancs et jardin commun plus calme.
- Q4, Cour des Artisans : bûches, caisses, petits cadeaux et jardinet latéral.

Les décors sont filtrés selon leurs dimensions réelles : façades dégagées, passages conservés, réserves fonctionnelles respectées. Les collisions des bases sont intégrées au même système que les bâtiments. Les clôtures sont des segments issus du plan avec de véritables ouvertures, pas des portillons peints sur un mur fermé.

## Proportions et ressources

Les portes des seize habitations mesurent environ 44 pixels affichés, contre 52 pour les personnages humains. Les dimensions des sprites validés ne sont pas modifiées. Le contrôle détaillé des221 fichiers publics et des sources protégées figure dans PRESERVATION.json. Aucun PNG public n’est remplacé ou réencodé. Le sol réemploie les textures de neige et finitions D.3.1 ; les terres, zones tassées et amas existants sont réimplantés autour des nouveaux lieux.

Inventaire réel : 109 éléments complémentaires placés et contrôlés, plus les étals et les clôtures. Les cinq silhouettes de sapins sont effectivement utilisées.

## Intérieurs et sauvegardes

Les plans, volumes, annexes, collisions, objets interactifs et destinations des quatre intérieurs D.3.3 restent inchangés. Les 17 interactions sont conservées. Les sorties ont une plaque bois/cuivre/crème, avec une flèche et le libellé « Sortie · Village ». Les variations de tapis, une table alternative de l’auberge, les rayonnages et les petits objets de table différencient les compositions, sans modifier les empreintes de collision.

Le schéma version 2, la base IndexedDB et ses clés sont conservés. Les anciennes positions valides restent en place ; celles qui sont bloquées ou masquées par une nouvelle façade sont replacées sur un point proche du réseau. Les étoiles, inventaire, quêtes, scores et conversations restent préservés.

## Vérifications

TypeScript, lint, les 157 tests unitaires (2 tests POSIX ignorés sous Windows) et les builds privé/production ont réussi. Le build privé a également passé le contrôle d’absence de paquet de surprises fictives.

Un premier parcours PC a vérifié les 16 portes d’habitation, les 5 portillons et les entrées/sorties des 4 lieux visitables au clavier ; la reprise d’une sauvegarde ancienne a réussi.

Suite complète PC/mobile : **Voir le bilan de vérification final fourni séparément avec les archives**. Les journaux détaillés de livraison préciseront les commandes et résultats définitifs. Aucun résultat non exécuté n’est annoncé.

Les nouvelles vérifications de navigation utilisent les colliders réels en lecture seule et les commandes clavier du jeu. Elles n’affectent pas directement la position du personnage pour simuler un déplacement. Les captures initialisent simplement des sauvegardes de test pour cadrer les lieux.

## Limites et validation artistique

- Les maisons décoratives conservent leur façade sud validée ; les portes sont desservies par des retours de ruelles, sans inventer des vues nord.
- Les façades V10 et les décors approuvés sont réutilisés sans retouche de leurs PNG ; les défauts intrinsèques déjà signalés restent ceux des sources.
- Pas de rivière, pont ou nouveau relief obligatoire dans cette phase.
- Les performances et contrôles mobiles sont exécutés dans Chrome émulé, pas sur un téléphone physique.
- Les illustrations, captures et originaux graphiques restent séparés du ZIP source léger.

La galerie validation.html fournit les vues complètes, chaque quartier et les intérieurs. La livraison reste soumise à votre validation artistique avant toute fusion ou mise en ligne.
