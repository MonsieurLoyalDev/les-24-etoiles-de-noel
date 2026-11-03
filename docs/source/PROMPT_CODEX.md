# Prompt Codex — Étoilebois Phase A

Tu es développeur senior Phaser 3, TypeScript, Vite et React. Inspecte le dépôt avant toute modification. Intègre le pack fourni `etoilebois_integration_v1` sans écraser les fichiers existants.

## Mission
Créer un **prototype jouable** de la Place des Lanternes, fidèle autant que possible à la référence visuelle `public/assets/references/place_lanternes_concept.png`. Charger les tuiles de `public/assets/ground/ground.png` en 16×16, les objets individuels de `public/assets/props`, et la carte `src/game/maps/place-des-lanternes.json` (64×48). Respecter `assets-manifest.json`.

## Gameplay
- Debby contrôlable (ZQSD/WASD/flèches, joystick tactile), caméra suivie, collisions avec props et bâtiments.
- Loyal compagnon qui suit Debby avec logique de récupération si bloqué.
- E/interaction tactile près du sapin, de la porte de la maison et des panneaux; ne pas interagir à travers les murs.
- Dialogue d’accueil et quête démo: parler à Loyal, entrer dans la maison, trouver une lettre, revenir placer une étoile au sapin.
- Intérieur provisoire mais jouable de la maison de Loyal, entrée/sortie et spawn correct.
- Journal de 24 jours, démo distincte du calendrier réel, sauvegarde versionnée en IndexedDB.
- Responsive, pixel perfect, audio facultatif, aucune musique automatique.

## Vérité sur les ressources
Les silhouettes `debby_placeholder.png` et `loyal_placeholder.png` sont des placeholders non animés, **pas** les personnages définitifs validés. Les façades des bâtiments sont absentes; les rectangles dans la carte ne sont que des réservations. Ne jamais présenter les planches composites comme des spritesheets découpées ou prétendre qu’elles contiennent des PNG transparents utilisables. Proposer un pipeline d’assets pour remplacer ces éléments par les vrais sprites.

## Architecture et qualité
Séparer Phaser, React, données, sauvegarde et calendrier. Préparer une API future de déverrouillage serveur Europe/Paris : ne pas livrer les surprises futures dans le bundle public. Ajouter tests unitaires (collisions, progression, sauvegarde) et parcours E2E (déplacement, dialogue, quête, rechargement). Exécuter build et tests; indiquer précisément ce qui fonctionne et ce qui manque.

## Livrables
Code source, README, commandes de lancement, captures du prototype, rapport de tests, liste des assets manquants et étapes suivantes.
