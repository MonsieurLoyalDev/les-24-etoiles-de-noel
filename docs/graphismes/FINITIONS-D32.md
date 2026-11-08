# D.3.2 — Étoilebois, le village habité

Version 0.7.2, base exclusive D.3.1 0.7.1 (`21f1e0a8c615b585e2600651f412ed0c565fb46c`). Branche `feature/phase-d3-2-village-habite`. Cette phase ajoute des interactions décoratives, sans nouvelle quête ni modification de l'Avent. Aucune D.4, fusion ou intervention sur le VPS.

## Les quatre intérieurs

Les trois grands meubles, l'architecture, les tapis et les documents D.3.1 de chaque pièce sont conservés. Chaque pièce reçoit deux ensembles supplémentaires, conçus pour ses usages, et un élément lumineux réellement commutable.

| Lieu            | Nouveaux détails                                                                                                                                                | Actions disponibles                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Maison de Loyal | Meuble personnel avec horloge, photos, carnets, couvertures et chaussons ; fauteuil, plaid, petite table, deux tasses, plante et cadeaux ; chat dans son panier | Caresser le chat, allumer/éteindre la bougie, examiner les souvenirs et le fauteuil, lire le petit mot |
| Bibliothèque    | Meuble à livres et échelle, piles variées, marque-pages, photographie et plante ; chariot avec atlas, livres, coussin et plaid                                  | Consulter le livre, allumer/éteindre la lampe, examiner la photo, lire la citation originale           |
| Atelier         | Meuble à outils, plans, figurines, rubans, cadeaux et caisses ; petit établi, cheval de bois, copeaux et rangements ; train à clé                               | Examiner le jouet, remonter le train, allumer/éteindre la lanterne, observer le plan                   |
| Auberge         | Vaisselier, couronne, menu, livre des visiteurs, théière et pâtisseries ; banquette, coussins, table à thé et plante                                            | Allumer/éteindre la bougie, lire le menu, observer le souvenir et la banquette                         |

Les textes sont courts, originaux et fictifs. Ils utilisent le panneau de dialogue et les portraits existants. Les sprites des huit personnages ne sont pas modifiés. L'assise réelle n'est pas ajoutée : aucune animation assise validée n'est disponible.

## Système décoratif

`src/decor/model.ts` décrit les identifiants stables, pièces, positions d'approche, rayons, descriptions, actions et textes. `InteriorLife` rend les objets et applique les actions. Le même bouton d'interaction sert au clic et au toucher ; E fonctionne au clavier. Les actions de lecture se ferment avec le bouton existant, E ou Espace.

Les quatre interrupteurs utilisent des supports éteints, avec une flamme et une lumière distinctes. Une seconde activation supprime réellement ces couches. Les anciennes bougies peintes dans les meubles D.3.1 restent décoratives et inchangées : elles ne sont pas présentées comme les objets commutables.

Les états allumé/éteint sont enregistrés dans `localStorage` sous `etoilebois-decoration-v1`, format `{version:1,switches:{identifiant:booléen}}`. Seuls les identifiants d'interrupteurs connus sont acceptés. Un stockage refusé ou corrompu conserve un fonctionnement en mémoire. La clé IndexedDB du RPG, son schéma et les sauvegardes de l'Avent ne changent pas. Le chat et le train gardent des réactions temporaires, sans état de besoins ni progression.

Le branchement dans `Game.ts` ajoute des candidats proches et une sortie anticipée avant les événements de quête. Aucun objet décoratif n'envoie d'événement, de récompense ou d'étoile. Les interactions antérieures et leurs rayons de 43 pixels restent présents ; les nouveaux objets ont des rayons plus courts de 22 à 27 pixels.

## Habitations et circulation

Quatre maisons distinctes sont ajoutées sans agrandir le monde de 1024 × 768. Huit candidates ont été étudiées et produites, mais le contrôle rapproché a révélé des portes trop petites sur plusieurs façades. Quatre ont été écartées ; les quatre retenues ont été agrandies et replacées pour respecter les proportions et les passages. Elles ne créent ni intérieur, ni PNJ, ni quête. Leurs silhouettes et détails diffèrent : porche étroit, jardin à clôture, haut pignon et baie vitrée. Courrier, couronnes, pots, bancs et petits portillons enrichissent ces compositions. Le nombre est volontairement inférieur à huit, conformément à la priorité « moins, mais mieux ».

| Sprite      | Pied dans le monde | Composition                   |
| ----------- | ------------------ | ----------------------------- |
| home-porch  | 48,505             | Petit porche et portillon     |
| home-garden | 296,600            | Clôtures courtes et jardinets |
| home-tall   | 385,740            | Pignon haut, volets et banc   |
| home-oriel  | 960,410            | Baie vitrée et porche latéral |

Les PNG n'apportent aucune plaque de sol qui remplacerait la neige validée. Les chemins, textures, zones de terre, herbes, pierres, anciens décors et bâtiments restent inchangés. Les maisons sont rendues avec une profondeur liée à leur pied ; les végétaux existants peuvent naturellement passer devant une façade de lisière.

Les collisions antérieures ne sont ni déplacées ni réduites. Les nouveaux objets reçoivent seulement des emprises additives adaptées à leur pied et à leur silhouette réelle. Les tests échantillonnent tous les chemins existants, leurs bords et les entrées ; ils vérifient aussi les points de quête, le sapin, les apparitions et les positions des personnages. Les quatre nouvelles façades disposent d'un test de collision en navigateur. Les quatre sorties sont parcourues.

La validation a détecté un passage historique dans la neige libre vers la bibliothèque, en dehors des chemins dessinés. La maison avec jardin a été déplacée pour conserver la traversée en y608 et la remontée en x208. Le test Phase B n'a pas été modifié ; il a été rejoué sur PC et mobile. Ces segments sont désormais aussi couverts par les exclusions géométriques.

## Animations et accessibilité

Le chat ouvre brièvement les yeux au repos et réagit pendant 2,4 secondes après une caresse. Le train avance de six pixels puis revient en 2,2 secondes. Deux petites flammes alternent lentement ; les variations de lumière restent très faibles. La vapeur part des tasses visibles de la maison, de la bibliothèque et de l'auberge, jamais des outils de l'atelier.

Les nouvelles cheminées et fenêtres utilisent des points d'ancrage propres aux façades. Fumées et lumières hors champ sont masquées. Le nombre de nouvelles volutes extérieures est limité à 8 en qualité complète, 4 en douce et 0 sans effets. Elles s'ajoutent au budget météorologique D.3 conservé, soit au maximum 80 particules extérieures en qualité complète et 32 en douce. À l'intérieur : au plus quatre volutes, deux en qualité douce, aucune sans effets. Aucun intervalle global ni nouveau système de déplacement n'est installé.

La préférence système de réduction des mouvements garde la priorité. Elle fige les flammes et les lumières, supprime la vapeur et la fumée, conserve le chat endormi et le train immobile. Leurs interactions textuelles et les changements allumé/éteint restent utilisables. Aucun réglage ni composant du HUD n'est ajouté ou modifié.

## Ressources et traçabilité

20 nouveaux sprites utilisés : quatre maisons, huit ensembles de mobilier, deux poses du chat, une bougie éteinte, une lampe éteinte, deux flammes, une volute et un train. Les originaux `image_gen` sont conservés dans `docs/artwork-d32/originals`, avec les quatre candidates non retenues. Les PNG natifs de `public/assets/life-d32` totalisent 921 208 octets et restent sous 512 pixels par dimension. Les candidates écartées ne sont ni chargées ni distribuées par le build public. Aucun asset D.3.1 n'est réexporté.

Le script `prepare-d32-assets.ts` vérifie l'alpha, recadre uniquement aux limites du contenu et redimensionne sans lissage, avec deux pixels transparents de marge. Les empreintes des originaux et des exports figurent dans l'inventaire. Deux sorties présentant un fond parasite (pose réveillée du chat et seconde flamme) ont été corrigées par l'outil d'image avant export ; les contrôles n'ont pas accepté ces fonds comme sprites.

## Validation technique

La validation finale et les mesures sont consignées dans `D32-RESULTATS.json`, le journal navigateur et les relevés `performance-*.json` de la galerie. Ne pas interpréter les mesures d'un navigateur local avec téléphone émulé comme des performances sur un téléphone physique.

## Fichiers et reprise du projet

- `src/decor/model.ts` : données des dix-sept objets et état décoratif versionné.
- `src/decor/InteriorLife.ts` : rendu des nouveaux meubles, réactions, flammes et vapeur.
- `src/decor/neighbourhood.ts` et `NeighbourhoodLife.ts` : quatre parcelles, emprises et effets de proximité.
- `src/game/Game.ts` et `src/art/world.ts` : branchements localisés au rendu, chargement et interaction existants.
- `public/assets/life-d32` : vingt textures utiles ; `docs/artwork-d32/originals` : originaux et candidates écartées.
- `scripts/prepare-d32-assets.ts`, `present-d32.ts`, `verify-d32-art.ts`, `audit-d32-invariants.ts` : export, galeries et contrôles reproductibles.
- `tests/decor-d32.test.ts` et les fichiers navigateur `phase-d3-2*.spec.ts` : nouvelles vérifications ; aucun test historique remplacé.
- `ops/public-assets.json`, `package.json` et verrou npm : ressources publiques et version 0.7.2.

Après extraction, exécuter `npm ci`, puis `npm run dev` avec la version de Node documentée dans le projet. Les paramètres d'hébergement et les modes démo/privé restent ceux du README. Pour régénérer le ZIP d'un checkout propre : `pwsh -File scripts/package-d32.ps1`, avec une destination qui n'existe pas encore. Le ZIP contient les fichiers commités, sans `.git`, `node_modules`, secrets locaux ou anciens dossiers de compilation.

## Limites restantes

- Les quatre nouvelles maisons sont décoratives et n'ouvrent pas de nouvelles zones ; huit à douze maisons à bonne échelle n'ont pas été retenues dans cette carte fixe.
- Les fauteuils et banquettes sont examinables, sans posture assise ajoutée.
- Les souvenirs, menu et citations sont des exemples fictifs, à personnaliser plus tard.
- Les flammes peintes dans les meubles historiques restent intactes ; seuls les quatre nouveaux objets identifiés sont commutables.
- Les défauts de découpe déjà acceptés sur les façades V10 historiques ne sont pas retouchés dans cette phase.
- Les tests mobiles utilisent Chrome avec format et toucher émulés. Aucun appareil physique ni hébergement HTTPS réel n'est validé par cette livraison.
- La validation artistique finale appartient à l'utilisateur ; les captures et la galerie permettent de juger le rendu réel.

<!-- D32-RESULTS-BEGIN -->

## Résultats finaux exécutés

Lint, TypeScript, build standard et build privé : réussis. Tests unitaires : **151 réussis, 2 non exécutés sur Windows** (scripts POSIX d'activation/restauration). Tests navigateur : **78 réussis, 12 ignorés car non applicables au format**, sur 90 cas, en 23.1m. Aucun échec dans la suite finale. Les contrôles incluent les 24 journées, les trois mini-jeux, les quatre intérieurs, les dix-sept objets, les quatre maisons, le clavier, le toucher, la réduction des mouvements et la reprise des anciennes sauvegardes.

Une première suite avait détecté le trajet vers la bibliothèque bloqué par le jardin. La maison a été déplacée, puis le parcours Phase B original et la compatibilité des sauvegardes ont passé leurs quatre tests ciblés. La suite complète de 90 cas a ensuite été exécutée à nouveau sur cette correction. Aucun test historique n'a été modifié pour contourner l'obstacle.

L'audit confirme 661 fichiers antérieurs protégés, 21 méthodes identiques hors branchements décoratifs et 43 captures « avant » identiques aux fichiers du commit D.3.1. Les coins alpha des vingt exports ont été lus dans le navigateur. Les 68 fichiers de comparaison existent ; les deux vidéos sont lisibles (17.68 s et 17.60 s).

### Mesures de fluidité

170 échantillons conservés par relevé, après retrait des dix premiers. Le RAF de Chrome est non plafonné ; ces nombres mesurent l'espacement des callbacks dans ce contexte, pas un objectif de FPS garanti sur un appareil physique. Les relevés de quartier vérifient que de nouvelles fumées sont effectivement visibles.

| Scène                           | Format          | P95 RAF (ms) | Moyenne RAF (ms) |
| ------------------------------- | --------------- | -----------: | ---------------: |
| Maison de Loyal                 | PC              |         4.30 |             4.17 |
| Maison de Loyal                 | Téléphone émulé |         4.30 |             4.17 |
| Quartier avec nouvelles maisons | PC              |         4.30 |             4.17 |
| Quartier avec nouvelles maisons | Téléphone émulé |         4.30 |             4.17 |

Les vingt textures supplémentaires totalisent 921 208 octets ; leur dimension maximale est 404 pixels. Les budgets supplémentaires restent à huit volutes extérieures en qualité complète, quatre en douce et zéro sans effets. L'avertissement de taille du chunk Phaser, déjà présent, ne bloque pas la compilation. Les treize chemins d'images et polices référencés par les CSS et les vingt nouveaux PNG ont été retrouvés dans les builds privé et standard ; les avertissements de résolution à la compilation ne correspondent donc pas à des fichiers absents. Le build privé confirme l'absence de paquets fictifs de surprises et de médias de démonstration ; aucun backend réel n'est déclaré opérationnel par ces seuls builds.
<!-- D32-RESULTS-END -->
