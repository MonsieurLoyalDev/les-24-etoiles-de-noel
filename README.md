# Les 24 Étoiles de Noël — Phase B

Petit RPG d’exploration romantique pour Debby, poursuivant la Phase A existante. React, TypeScript, Vite et Phaser 3. Les personnages et bâtiments restent volontairement provisoires.

## Lancer

Node.js 24 recommandé.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée. Pour un téléphone sur le même Wi-Fi, utiliser l’adresse réseau affichée et autoriser le serveur dans le pare-feu si nécessaire. Pour un accès distant, Vercel est préparé (`vercel.json`), sans déploiement effectué.

```sh
npm test
npm run build
npm run test:e2e
```

Les E2E utilisent Chrome installé localement sous Windows et Chromium dans la CI Linux. Le workflow installe Chromium. Les commandes, captures et limites de validation sont détaillées dans la documentation.

## Jouer

Flèches / ZQSD / WASD ou joystick : déplacement. E ou bouton contextuel : interaction. Les dialogues proposent des boutons de réponse utilisables au clavier et au toucher. Le journal regroupe les quêtes, le sac et les 24 emplacements du calendrier fictif.

La quête de Loyal est conservée. Acceptez aussi les propositions de Mira à la bibliothèque (ouest), Oscar à l’atelier (nord-est), Alma à l’auberge (nord) et Noé sur la place (sud-est). Les portes se trouvent au sud des bâtiments. Les quêtes indiquent leur prochain objectif dans le journal. Les mini-jeux se trouvent sur les tables et pupitres : photographie, mémoire, emballage. Revenez parler aux habitants après les activités.

## Phase B

- Les quatre bâtiments ont un intérieur, du mobilier solide, des interactions et une sortie.
- Quatre PNJ se déplacent et réagissent à la progression ; comportements différents selon le cycle fictif jour/nuit.
- Moteurs de dialogues conditionnels et de quêtes pilotés par les données ; cinq quêtes de démonstration au total, dont la Phase A.
- Trois mini-jeux complets, rejouables, avec validation des réussites, meilleurs résultats et aucune récompense répétée.
- Sauvegardes Phase A migrées sans écraser l’original ; quêtes, objets, choix, dialogue courant, étoiles et temps du monde enregistrés.
- Cycle visuel, neige, halos, mouvements simples des PNJ, réactions de Loyal et décorations du sapin selon les étoiles.
- Les 24 jours sont préparés ; cinq souvenirs sont fictifs. Aucune surprise réelle future n’est incluse. Le client de la future API respecte les refus du serveur ; l’horloge et les autorisations réelles devront être gérées côté serveur en Europe/Paris.

Debby et Loyal restent humains, en tenues hivernales, avec lunettes rondes. Aucun chantier de graphismes définitifs n’est entrepris.

## Documentation

- [Guide et architecture Phase B](docs/PHASE-B.md)
- [Résultats des tests Phase B](docs/TESTS-PHASE-B.md)
- [Analyse du pack original](docs/ANALYSE.md)
- [Pipeline artistique futur](docs/ASSETS.md)
- [Rapport historique Phase A](docs/TESTS.md)
- Captures Phase B : `docs/screenshots/phase-b-*`

## Livraison et suite

La Phase B est développée sur `feature/phase-b`, avec une PR vers `main`. Ne pas fusionner sans l’accord explicite de l’utilisateur. GitHub Actions vérifie tests unitaires, TypeScript, build et parcours navigateur PC/mobile. Les graphismes définitifs, le backend du calendrier privé, les tests sur appareils physiques et la publication Vercel sont des étapes futures. La sauvegarde reste locale à chaque navigateur, sans synchronisation entre appareils.
