# D.4.2 — Activités dessinées dans Étoilebois

## Livraison

Base D.4.1 `be52808`, branche `feature/phase-d4-2-activites`. Audit avant réalisation, prototype de lecture enregistré, puis moteur partagé et activités des trois habitants. Le village n’est pas reconstruit. Les nouvelles ressources attendent la validation artistique : aucune fusion ni mise en production.

## Fonctionnalités réelles

| Habitant | Comportement visible | Réalisation |
|---|---|---|
| Célestine | Sortir/ouvrir le livre, lire, tourner une page et fermer | Huit poses dessinées ; séjour et durée issus de sa routine |
| Célestine | Porter et ranger un ouvrage devant les rayonnages | Quatre poses de dos ; le livre rejoint visuellement l’étagère, sans créer un objet de quête |
| Célestine | Lire dans le fauteuil existant | Quatre poses d’assise et de redressement, approche libre, place réservée, accoudoirs d’origine au premier plan |
| Célestine | Accueillir Debby et reprendre | Livre fermé pendant le dialogue ; assise conservée au fauteuil, pose canonique orientée vers le joueur ailleurs |
| Émile | Consulter la sacoche et une enveloppe | Ouverture, lecture et rangement dessinés |
| Émile | Distribuer une lettre | Séquence unique : sortie, extension, dépôt, main vide et sacoche fermée ; aucune lettre flottante ni réapparition en boucle |
| Émile | Saluer un voisin compatible | Geste facultatif de 1,3 s, arrêt temporaire et délai de repos ; dialogue prioritaire |
| Augustin | Inspecter, allumer et éteindre | Gestes accroupis adaptés aux lanternes de sol réellement présentes ; état lumineux réservé et marqueur unique |
| Augustin | Se réchauffer | Mains rapprochées/frottées/portées au visage, puis repos ; pas de particules artificielles |

Les poses de marche, d’attente et de retournement canoniques restent utilisées. Les accessoires sont dessinés avec les mains, pas déplacés comme des rectangles indépendants. Les trois feuilles ajoutent 48 images complètes ; certains gestes disponibles restent en réserve, comme le salut d’Augustin. Aucun nouveau PNJ ou système postal de quête n’est créé.

## Architecture et préservation

Le moteur D.4.1 conserve navigation A*, collisions, capacités, réservations, quatre périodes et horloge fictive de trois minutes. Les clips déclaratifs ajoutent entrée, action, sortie, durée, orientation, interruption et éventuel événement synchronisé. Les séquences de dépôt et d’allumage ne bouclent pas. Les gestes ordinaires ne sont pas ajoutés au format des sauvegardes.

Les points de travail, l’approche et la projection du fauteuil sont configurables. Seules les fins de trajet ont été ajustées pour atteindre les objets avec les dessins disponibles. Les routes, portes, clôtures, bâtiments, meubles et solides ne changent pas. Le créneau de lecture au crépuscule conserve sa durée et rejoint désormais le fauteuil demandé. Les autres horaires D.4.1 sont conservés.

Les trois lanternes pilotées utilisent les lumières existantes. Si l’état demandé est déjà atteint, Augustin inspecte plutôt que de simuler un allumage. La transition de lumière dure 800 ms, sans nouvelle source permanente. Les autres éclairages, le sapin et les ambiances restent gérés par leurs systèmes validés.

Le contrôle SHA-256 conserve **223 anciennes ressources publiques à l’identique**. Les sources de la neige, des plans, des personnages canoniques, des portraits, du HUD, des dialogues, des sauvegardes, du calendrier et des mini-jeux ne sont pas modifiées. Les six fichiers sources existants adaptés et les trois nouveaux PNG sont détaillés dans `PRESERVATION.json`.

## Défauts identifiés et corrigés

- L’ancrage d’une pose retournée doit être lui aussi retourné : correction du placement des pieds et de l’outil d’Augustin vers la gauche.
- La première proposition d’Augustin visait une lanterne haute ; elle a été écartée et remplacée par des poses adaptées aux petites lanternes du village, sans déplacer le décor.
- La visibilité du dialogue visait initialement le dessin assis à l’intérieur du meuble. Le fauteuil bloquait alors la conversation jusqu’au redressement. La cible utilise maintenant le point d’approche libre. Les contrôles de visibilité à travers les murs restent actifs ; le test couvre cette distinction.
- Les observateurs de test ne doivent pas immobiliser un PNJ en se plaçant sur sa route, ni attendre des images animées hors caméra. Les cadrages ont été corrigés sans désactiver ces protections du jeu.
- Les diagnostics sont publiés toutes les 250 ms : les tests attendent leur stabilisation avant de vérifier pause ou réduction des mouvements.
- Un cas de démarrage sous charge a dépassé une attente de cinq secondes ; le pilote attend désormais vingt secondes, comme les anciens parcours. Les échecs et reprises restent dans l’historique des tests.

## Galerie animée

Comparaisons D.4.1/D.4.2 de la lecture et du courrier, avec mêmes cadrages et conditions initiales. Les délais suivent l’arrivée effective des habitants ; les horodatages exacts ne sont pas prétendus identiques. Vidéos réelles de lecture, rangement, fauteuil, distribution, allumage, extinction, réchauffement, scène extérieure et reprise. Deux clips de dialogue incluent aussi l’interface React. Les autres enregistrent le canvas Phaser, sans le HUD React.

Les vues mobiles viennent de Chrome émulé à 390 × 844. Les planches de poses sont présentées comme des ressources, jamais comme des captures du jeu. Les captures sont converties en WebP sans redimensionnement et vérifiées sur tous les pixels visibles et leur transparence. Les vidéos WebM sont compressées pour une validation légère.

## Limites déclarées

- Validation artistique toujours attendue ; les feuilles complémentaires ne remplacent pas les atlas originaux.
- Seules les orientations dessinées sont proposées pour les gestes ; l’assise reste une vue de trois-quarts face. Aucun morphing ni rotation artificielle du corps.
- Le sursaut spécialisé n’est pas dessiné. La bibliothèque partagée couvre les poses disponibles, sans prétendre disposer de tous les gestes pour tous les habitants.
- L’interruption utilise une pose fermée cohérente plutôt qu’une longue animation de fermeture qui retarderait le dialogue.
- La couleur ambrée peinte dans les lanternes reste dans leur image. L’extinction coupe leur lumière et refroidit leur teinte ; elle ne remplace pas l’asset par une version noire.
- Les états ordinaires sont recalculés à la reprise ; pas de nouveau schéma de sauvegarde. La simulation de chaque intérieur démarre à sa première visite, comme en D.4.1.
- Tests mobiles émulés, sans téléphone physique. Pas de validation revendiquée sur VPS, Supabase distant, Safari ou HTTPS. La CI distante n’est pas annoncée réussie.
- La sélection navigateur cible les activités et les régressions principales ; elle ne constitue pas l’exécution de toute la collection historique.
- Les avertissements existants du build sur le chunk Phaser et les imports JSON restent présents ; ils n’empêchent pas la compilation.

**Aucune fusion, aucun déploiement, aucune généralisation à de nouveaux habitants avant validation.**

## Résultats exécutés

TypeScript, lint, build E2E et build de production réussis. Tests unitaires complets : **194 réussis, 2 ignorés** (cas POSIX existants sur Windows), aucun échec final. Douze tests nouveaux ciblent les poses, cellules transparentes, marqueurs lumineux, lettre déposée, réservation, interruption et visibilité du dialogue au fauteuil.

**30 scénarios navigateur distincts validés**, PC et mobile émulé : douze cas D.4.2, huit cas de fondation D.4.1 et dix régressions du jeu (première quête, journal/sauvegarde, joystick, quêtes secondaires et trois mini-jeux, 24 activités/final et 17 objets décoratifs). La reprise finale remplace les échecs initiaux ; les statistiques de chaque série restent dans TESTS.json. Le test de l’assise vérifie explicitement les dessins de lecture et de page tournée, sans supposer que l’observateur a capté sa première image d’entrée. La capture du fauteuil comprend aussi le redressement et le départ.

Performance locale : 180 intervalles RAF après échauffement, p95 PC **7.0 ms**, moyenne 4.86 ms ; mobile émulé CPU ×4, p95 **10.6 ms**, moyenne 5.66 ms. Mesures courtes prises pendant une validation concurrente ; elles ne sont ni une garantie sur téléphone réel ni une comparaison isolée avec D.4.1. Les budgets de navigation et la réduction des mouvements passent.

Le code ajoute environ 20 Ko au chunk principal minifié (hors Phaser). Les trois PNG nouveaux totalisent 6 194 367 octets ; les textures sont chargées une fois et les poses changent par atlas. Deux parties de fauteuil réutilisent sa texture existante pour le premier plan. Aucun terrain n’est recalculé à chaque image.

Les clips de validation sont muets ; les sons et la musique du jeu ne sont pas modifiés.
