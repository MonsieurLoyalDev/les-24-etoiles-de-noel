# Les 24 Étoiles de Noël — Phase D

La Phase D prépare **etoilebois.loyaldev.fr** sur VPS Ubuntu : Nginx statique, Supabase hébergé séparément, déploiement par versions et sauvegardes chiffrées. **Aucun VPS modifié ni déploiement réel revendiqué.** L'installation attend l'audit PuTTY et la validation du plan. Aucun nouveau processus PM2 n'est nécessaire.

- [Commencer avec WinSCP/PuTTY](docs/VPS-UBUNTU.md)
- [Audit du code et état réel](docs/AUDIT-PHASE-D.md)
- [Changements proposés à valider](docs/PLAN-VALIDATION-VPS.md)
- [Secrets, limites Auth et sauvegardes](docs/SECRETS-ET-SAUVEGARDES.md)

Outils dans `ops/` : audit en lecture seule, versions/rollback, génération Nginx, vérification HTTPS/backend et export/restauration chiffrés. Le workflow manuel GitHub produit seulement un artefact privé d'un SHA revu ; il ne se connecte pas au serveur. `npm run package:vps` exige un build privé avec Auth/CAPTCHA configurés. Les anciennes fonctionnalités restent disponibles ci-dessous.

La Phase C ajoute les **24 journées interactives**, le calendrier daté de décembre 2026, la personnalisation administrateur et un backend privé compatible Supabase. Les Phases A/B restent jouables avec leurs sauvegardes existantes. Les graphismes restent provisoires.

Pour tester immédiatement : `npm ci`, `npm run dev`, entrer dans le village, ouvrir **✦ Avent 2026**, puis **Mode développeur : tester les 24 journées**. Sélectionner un jour, suivre la quête dans le lieu indiqué et interagir avec la lueur « Jour N ». Les 24 activités ont des conditions de réussite et une étoile unique ; le final du 24 se déroule dans le RPG et peut être revu.

Le mode fourni est une **démonstration fictive non sécurisée**. Aucun vrai souvenir n'est inclus. Le calendrier daté est normalement fermé en novembre. Pour de vraies surprises, utiliser le mode Supabase : contrôle serveur Europe/Paris, authentification sur invitation, RLS, règles privées et médias privés. L'instance distante reste à configurer.

- [Configuration Supabase et Vercel](docs/CONFIGURATION-SUPABASE.md)
- [Personnalisation des 24 activités](docs/PERSONNALISATION-24-JOURS.md)
- Migration : `supabase/migrations/202611030001_advent.sql` ; données **fictives** : `supabase/seed.sql`.
- Vérifications : `npm run lint`, `npm test`, `npm run build:private`, `npm run build`, `npm run test:e2e`.
- `build:private` exclut également les modules et médias de démonstration du navigateur ; aucune vraie surprise future n'est stockée dans le dépôt.

## Fonctionnalités conservées

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

Flèches / ZQSD / WASD ou joystick : déplacement. E ou bouton contextuel : interaction. Les dialogues proposent des boutons de réponse utilisables au clavier et au toucher. Le Journal 24 conserve les quêtes, le sac et les archives fictives Phase B ; le bouton Avent 2026 ouvre le nouveau calendrier.

La quête de Loyal est conservée. Acceptez aussi les propositions de Mira à la bibliothèque (ouest), Oscar à l’atelier (nord-est), Alma à l’auberge (nord) et Noé sur la place (sud-est). Les portes se trouvent au sud des bâtiments. Les quêtes indiquent leur prochain objectif dans le journal. Les mini-jeux se trouvent sur les tables et pupitres : photographie, mémoire, emballage. Revenez parler aux habitants après les activités.

## Phase B

- Les quatre bâtiments ont un intérieur, du mobilier solide, des interactions et une sortie.
- Quatre PNJ se déplacent et réagissent à la progression ; comportements différents selon le cycle fictif jour/nuit.
- Moteurs de dialogues conditionnels et de quêtes pilotés par les données ; cinq quêtes de démonstration au total, dont la Phase A.
- Trois mini-jeux complets, rejouables, avec validation des réussites, meilleurs résultats et aucune récompense répétée.
- Sauvegardes Phase A migrées sans écraser l’original ; quêtes, objets, choix, dialogue courant, étoiles et temps du monde enregistrés.
- Cycle visuel, neige, halos, mouvements simples des PNJ, réactions de Loyal et décorations du sapin selon les étoiles.
- Les archives Phase B contiennent cinq souvenirs fictifs. Le calendrier Avent 2026 utilise désormais les autorisations et dates serveur décrites dans le guide Phase C.

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
