# Les 24 Étoiles de Noël

RPG 2D romantique pour Debby. Phase A jouable à Étoilebois, React 19 + TypeScript + Vite 7 + **Phaser 3.90**. Le calendrier est une démonstration libre, sans dépendance à la date du téléphone.

## Lancer

Node.js 24 recommandé.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite. Sur téléphone, utiliser l’adresse réseau affichée, sur le même Wi-Fi (le pare-feu doit autoriser le serveur). Pour une utilisation distante, déployer ultérieurement sur Vercel.

```sh
npm test
npm run build
npm run test:e2e
```

Les tests navigateur utilisent Chrome installé sous Windows. En CI Linux, Chromium est installé par le workflow. Pour tester Chromium localement : `npx playwright install chromium`, puis adapter `channel` dans la configuration Playwright.

## Jouer

- Flèches, ZQSD ou WASD : déplacement. Le joystick à gauche fonctionne aussi à la souris et au toucher.
- E ou bouton contextuel : parler, lire, entrer, sortir. Espace permet de fermer un dialogue.
- Fermer l’accueil, puis parler à Loyal. Suivre la route vers sa maison au sud-est, approcher la porte par le sud et entrer.
- Lire la lettre sur la table. Sortir par la porte au sud, revenir au grand sapin au centre, puis interagir pour placer l’étoile.
- Le journal affiche les 24 jours ; seule la première étoile de démonstration est disponible.
- Sauvegarde locale IndexedDB toutes les quatre secondes, aux interactions et à la perte de visibilité. Elle est propre au navigateur et à l’origine. Pas de synchronisation entre appareils. Une panne de stockage est signalée sans empêcher le jeu en mémoire.

## Ce qui est livré

Carte 64 × 48 de 16 px du ZIP, props ancrés selon le manifeste, caméra suivie à zoom entier, tri de profondeur, collisions des bâtiments et des objets solides, Loyal compagnon avec historique de déplacement et récupération, intérieur accessible, dialogues, quête complète et sauvegarde versionnée. Aucun son automatique.

**Direction artistique :** Debby et Loyal sont humains, en tenues hivernales et lunettes rondes. Les PNG du pack sont des silhouettes non animées ; un petit tracé Phaser provisoire arrondit leurs lunettes. Les façades et l’intérieur sont dessinés dans le code et explicitement provisoires. Le rendu est un prototype technique, pas le rendu artistique final validé. Le renard figurant sur la planche de référence ne définit pas Loyal.

Voir [l’analyse du pack](docs/ANALYSE.md), [le pipeline artistique](docs/ASSETS.md) et [le rapport de validation](docs/TESTS.md).

## Architecture

- `src/main.tsx` : interface React, journal, joystick, cycle de vie et sérialisation des sauvegardes.
- `src/game/Game.ts` : rendu et scènes village/maison Phaser, collisions, interactions et compagnon.
- `src/domain.ts` : géométrie et progression déterministes, indépendantes du moteur.
- `src/save.ts` : IndexedDB, schéma 1 et validation à la lecture.
- `src/calendar.ts` : contrat de la future API. Le serveur devra décider des jours débloqués en Europe/Paris. Aucun contenu des jours futurs n’est embarqué.
- `src/game/maps` et `assets-manifest.json` : données du pack conservées.

## Git et livraison

`main` conserve la base initiale ; `develop` prépare l’intégration ; `feature/phase-a` porte la livraison vérifiée. La Pull Request de livraison cible `main` ; `develop` sera alignée sur cette version après intégration. Le workflow GitHub Actions exécute installation verrouillée, tests unitaires, build et E2E PC/mobile. Les captures et résultats sont publiés comme artefacts de CI. Les protections de branche doivent être configurées selon les possibilités du compte GitHub ; elles ne sont pas supposées activées.

## Vercel, prochaine étape

Importer le dépôt privé dans Vercel, sélectionner Vite, commande `npm run build`, sortie `dist`, Node.js 24. Le fichier `vercel.json` est prêt. Aucun déploiement Vercel n’est effectué par cette livraison. Pas de secret nécessaire pour la démo. La future API calendrier devra garder les surprises côté serveur et utiliser une heure fiable Europe/Paris.

## Suite

Produire et faire valider les sprites directionnels humains, les façades et l’intérieur ; tester sur de vrais appareils iOS/Android ; ajouter le backend du calendrier et les contenus privés, puis préparer le déploiement. La simulation mobile ne remplace pas une validation Safari sur iPhone. Les autres bâtiments restent fermés.

