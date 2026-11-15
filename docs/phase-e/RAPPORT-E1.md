# Phase E.1 — Livraison privée fiabilisée

Validation locale du 15 novembre 2026. Base : `feature/phase-d4-2-activites`, commit `700146622131934c3416dfabd13b1bef2df3d85f`. Branche de livraison : `feature/phase-e1-private-release`. Version applicative conservée : 0.7.5.

## Résultat et périmètre

Les trois feuilles D.4.2 sont désormais incluses dans le build privé. Les contrôles de construction et de packaging vérifient **225 ressources : 222 PNG et 3 fontes**, leurs signatures et leurs octets, ainsi que les entrées JavaScript/CSS. Le véritable build privé configuré avec des valeurs fictives passe **14 tests navigateur dans une même série**, PC et mobile émulé. Célestine lit, range et s'assoit ; Émile distribue sa lettre ; Augustin utilise ses poses et synchronise sa lanterne. Dialogue, reprise et réduction des mouvements sont exercés.

Le dépôt GitHub reste **public conformément à votre instruction E.1**. Les constats E.0 concernant cette visibilité restent un historique d'audit ; ils ne constituent plus une demande de changement du réglage. Aucune donnée personnelle réelle, aucun média privé ou secret n'est ajouté. Les comptes, jetons et clés des tests sont explicitement fictifs, sans validité sur un service réel. Les véritables surprises devront rester dans Supabase privé et son stockage, hors Git et hors `public/`.

Aucun fichier de `src/` ou de `public/` n'a été modifié. Personnages, portraits, atlas, dialogues, carte, intérieurs, collisions, quêtes, mini-jeux, calendrier et format des sauvegardes sont conservés. Les sept rapports E.0 sont préservés octet pour octet. Aucune fusion, aucun déploiement ni intervention sur le VPS ou les bots Discord.

## Défaut reproduit et corrections

Avant correction, `npm run build:private` terminait avec le code 0 alors que `celestine.png`, `emile.png` et `augustin.png` existaient dans les sources mais pas dans `dist/assets/activities-d42/`. Le nouveau contrôle, lancé avant de modifier la liste, échoue avec le code 1 et nomme précisément ces trois ressources. Le défaut de chargement HTML de repli observé en E.0 est couvert par le nouveau contrôle MIME/signature dans le navigateur.

| Fichiers | Modification |
|---|---|
| `ops/public-assets.json` | Ajout des trois PNG D.4.2 existants ; aucun redessin ni réexport |
| `ops/lib/private-assets.mjs` — nouveau | Inventaire conservateur des familles graphiques examinées, catalogues, chemins littéraux, fontes et métadonnées de poses ; détection des omissions, doublons, liens et chemins non approuvés ; vérification PNG/fontes, hashes source/build, fichiers inattendus et dépendances JS/CSS de la page d'entrée |
| `vite.config.ts` | Validation avant copie ; refus d'un module de surprises demo ou de tests effectivement inclus dans un chunk privé |
| `scripts/check-private-build.ts` | Vérification commune du résultat compilé ; avertissement explicite si compilation privée sans backend/CAPTCHA configurés |
| `scripts/package-vps.mjs` | Même contrôle complet avant création du paquet ; maintien du refus d'un build sans configuration Auth/CAPTCHA |
| `ops/lib/public-config.mjs` | Refus des clés inconnues, JWT malformés ou sans rôle anon, modes invalides et clés serveur, y compris une clé serveur placée dans une autre variable Vite autorisée |
| `playwright.private.config.ts` — nouveau ; `package.json` | Commande `npm run test:private`, serveur de prévisualisation local dédié au véritable `dist` privé ; aucun mode développeur injecté |
| `tests/private-release.test.mjs` — nouveau | Neuf tests ciblés : retrait d'une feuille obligatoire, couverture des ressources, HTML déguisé en PNG, octets altérés, dépendance JS/CSS absente, surprises ajoutées au site, configuration dangereuse et packaging sans Auth/CAPTCHA |
| `tests/private-e2e/fixtures.ts` — nouveau | Backend de recette intercepté dans Playwright uniquement : connexion, membre/joueur/admin, contrats RPC fermés, séparation live/preview, média autorisé/futur ; origine externe inattendue refusée ; aucun branchement fictif ajouté au jeu |
| `tests/private-e2e/release.spec.ts` — nouveau | Sept scénarios sur deux formats : ressources, Célestine, Émile, Augustin, joueur, aperçu administrateur, anonyme/non-membre |
| `.gitattributes` | Fins de ligne LF stables pour les sources/configurations textuelles ; hashes de préservation conservés |
| `vitest.config.ts` | Deux workers maximum pour borner le travail PNG/hash/PGlite ; aucun relâchement des assertions ou délais unitaires |
| `tests/e2e/phase-d3-2-compat.spec.ts` | Attente de démarrage alignée à 20 secondes comme les pilotes récents ; assertions de position sûre, inventaire, quêtes, étoiles, scores et historique inchangées |
| `.github/workflows/ci.yml` | Nouveau job Linux `private-release` : installation, lint, unitaires, build privé fictif, navigateur et captures. Les jobs qualité/infrastructure existants sont conservés ; aucune étape de déploiement ajoutée |
| `docs/phase-e/` | Ajout de ce rapport et de 12 captures ; sept documents E.0 conservés et inclus dans la livraison |

Le contrôle de fichiers ne copie jamais automatiquement tout `public/`. Un nouvel asset doit être revu et autorisé. Les familles et métadonnées couvrent les ressources actuelles ; une nouvelle famille ou un nouveau mécanisme de chargement devra compléter ce contrat et les tests navigateur. Cette vérification ne reconnaît pas magiquement une photo personnelle : la revue humaine des ajouts reste nécessaire.

## Vérifications exécutées

Installation dans un dossier vierge séparé, sans `.git`, `dist` ou `node_modules` repris du projet : **`npm ci --offline` réussi**, 195 paquets installés depuis le cache et le lockfile. Aucun changement de dépendances ou du lockfile. Le résultat du cache ne constitue pas un nouvel audit de vulnérabilités en ligne.

Environnement : Windows, Node 24.14.0, npm 11.9.0, Playwright 1.64.1, Chrome local avec rendu logiciel. PC : 1280 × 800 ; mobile émulé : 390 × 844 avec toucher.

| Vérification | Résultat réellement observé |
|---|---|
| `npx tsc --noEmit` | Code 0 sur le code final dans l'installation vierge |
| `npm run lint` | Code 0 sur le code final |
| `npm test` | **203 réussis, 0 échoué, 2 ignorés**, 26 fichiers ; dernière série 4,26 s |
| `npm run build` | Code 0 ; version demo conservée pour les régressions |
| `npm run build:e2e` | Code 0 ; contrôles de démonstration seulement |
| `npm run build:private` sans variables réelles | Code 0 de compilation de contrôle, 225 ressources vérifiées ; avertissement non livrable sans Auth/CAPTCHA |
| `npm run build:private` avec configuration fictive de recette | Code 0 ; 225 ressources exactes, modules demo/tests exclus ; 230 fichiers dans le résultat |
| Packaging positif de recette | Code 0 avec variables fictives ; paquet de test hors du dépôt, non destiné au VPS |
| Packaging sans configuration / sans CAPTCHA | Refus effectivement exécutés par les tests, avant création d'un paquet |
| Ressource supprimée de la liste, HTML sous nom PNG, octets différents, chunk JS/CSS absent | Refus effectivement exécutés par les tests |
| Régressions `game`, `phase-b`, `phase-c`, `phase-d3-2-compat` | Série initiale **11 réussis / 1 échec d'attente de démarrage** ; confirmation du test de compatibilité **2/2 réussis** après correction du pilote. Les **12 scénarios distincts sont validés** |
| `npm run test:private` final | **14/14 réussis**, aucun ignoré ni instable, 5 min 50,26 s, dans une même exécution depuis l'installation vierge |
| Export Git et fins de ligne | Archive de contrôle de `Captcha.tsx` et `domain.ts` avec les attributs de travail : LF conservé malgré `core.autocrlf=true` ; aucune suppression de preuve SHA-256 |

Les régressions couvrent les 24 activités fictives complétées sur les deux formats, le final, le rejeu, le journal, les brouillons/reprises, le calendrier fermé en novembre, l'éditeur fictif, les trois mini-jeux, la première quête, les quêtes secondaires, le joystick et d'anciennes sauvegardes replacées hors des obstacles. Les 24 jours constituent des étapes dans deux parcours, pas 48 tests navigateur comptés artificiellement.

Les tests unitaires comprennent la migration SQL réelle dans PGlite, les 24 preuves d'activités, les dates, RLS et permissions, les versions/rejeux et l'isolation de progression. Auth et Storage y sont des doubles. Les deux tests ignorés Windows concernent l'activation/restauration atomiques et les liens POSIX. WSL n'est pas installé et aucun Linux/Nginx local n'a été installé pour les contourner. Le nouveau job GitHub Linux et le job infrastructure existant complètent ce périmètre sur des runners isolés ; leurs résultats distants doivent être lus sur l'exécution du commit, sans les confondre avec le VPS réel.

Commandes des parcours, avec `ETB_E2E_BUILT=1` et `SOFTWARE_GL=1` pour les régressions :

```text
npx playwright test tests/e2e/game.spec.ts tests/e2e/phase-b.spec.ts tests/e2e/phase-c.spec.ts tests/e2e/phase-d3-2-compat.spec.ts
npx playwright test tests/e2e/phase-d3-2-compat.spec.ts
npm run build:private
npm run test:private
```

Le build privé de recette utilise uniquement `https://example.supabase.co`, `sb_publishable_fixture_not_real` et `fixture-public-site-key`. **Ces valeurs ne configurent pas un service réel et ne doivent pas servir à une publication.** Les fixtures refusent les requêtes imprévues et les origines externes. Les tests exercent le client Supabase du build de production, sans importer le module demo ni les fixtures dans ce bundle.

### Échecs intermédiaires conservés et expliqués

- Première recette GitHub Linux (`0126504`, exécution `43759894892`) : 205 tests unitaires réussis, infrastructure isolée réussie (Nginx/TLS, 2 parcours navigateur et sauvegarde/restauration PostgreSQL). Le lot privé obtient 10/14 : quatre captures dépassent le délai d'action de 10 secondes, après le chargement des fontes, dans le rendu logiciel Chromium. Les assertions atteintes avant ces captures passent, mais les scénarios interrompus ne sont pas comptés réussis. Le délai des seules captures explicites est porté à 60 secondes, avec une enveloppe de scénario adaptée ; les délais/assertions de navigation, activités, Auth et sécurité restent inchangés. Le résultat de la nouvelle recette est à consulter sur le commit correctif.

- Les premiers contrôles d'intégration ont signalé des types explicites manquants dans le plugin Rollup et une mise en forme ambiguë pour ESLint ; ces erreurs sont corrigées, les contrôles finaux passent.
- Le premier pilote de connexion utilisait une visibilité instantanée avant rendu du formulaire ; plusieurs scénarios ont échoué. Il attend maintenant explicitement formulaire ou calendrier, sans contourner la connexion.
- Une installation/test concurrente avec les animations a provoqué cinq délais unitaires de 5 secondes. La concurrence est bornée à deux workers, sans augmenter ces délais ; la série finale passe.
- Un premier lot privé obtenait 13/14 ; l'observation d'Émile dépassait un cycle ou manquait une pose brève. Une reprise ciblée a encore manqué cette pose sur PC. L'observation finale utilise un créneau existant permettant une distribution complète et un enregistrement dans le navigateur pendant la capture. Le lot final 14/14 confirme lettre visible, dépôt et fermeture ; aucune routine ou animation du jeu n'a été modifiée pour cela.
- Deux lancements interrompus sans bilan JSON complet sont exclus des validations. Les séries finales supervisées vont jusqu'à leur résultat.
- Le lot de régression a conservé un échec mobile sur une attente de démarrage de cinq secondes. Sa confirmation PC/mobile conserve tous les contrôles de données après l'alignement de cette attente à vingt secondes.

Les journaux et JSON détaillés sont conservés hors du dépôt dans `outputs/e1-verification/` : `baseline-private.log`, `missing-before-fix.log`, `npm-ci.log`, `confirmed-unit.log`, `regression-completed.json`, `compat-confirmed.json`, `private-completed.json` et journaux associés.

## Captures du jeu réellement exécuté

Ces captures proviennent du **build privé final**, avec backend de recette fictif intercepté. Date du 1er novembre et trois étoiles village : valeurs de sauvegardes de test pour vérifier la compatibilité, sans progression réelle de Debby. Les textes hérités « Démo libre » dans le HUD sont conservés ; le calendrier utilise bien le chemin privé Supabase testé.

| Vue | PC | Mobile émulé |
|---|---|---|
| Célestine lit | [Capture](e1-captures/desktop-celestine-read.png) | [Capture](e1-captures/mobile-celestine-read.png) |
| Rangement | [Capture](e1-captures/desktop-celestine-sort.png) | [Capture](e1-captures/mobile-celestine-sort.png) |
| Fauteuil | [Capture](e1-captures/desktop-celestine-seatRead.png) | [Capture](e1-captures/mobile-celestine-seatRead.png) |
| Interruption par dialogue | [Capture](e1-captures/desktop-dialogue.png) | [Capture](e1-captures/mobile-dialogue.png) |
| Distribution d'Émile | [Capture](e1-captures/desktop-emile.png) | [Capture](e1-captures/mobile-emile.png) |
| Augustin et sa lanterne | [Capture](e1-captures/desktop-augustin.png) | [Capture](e1-captures/mobile-augustin.png) |

Douze PNG, proportions conservées, **8 233 199 octets au total**. Les captures et les poses natives ont été contrôlées visuellement sur PC et mobile ; la validation des animations repose aussi sur leurs séquences de frames et leurs états, pas sur ces seules images statiques.

## Limites et conditions pour la suite

- **Aucune validation de Supabase réel, du VPS, de HTTPS réel ou de Safari iOS.** Les contrôles privés utilisent des fixtures et les règles SQL un PostgreSQL embarqué ; ils ne prouvent pas invitations, signatures JWT réelles, CAPTCHA, limitation Auth, expiration d'URL signée ou restauration du projet distant.
- Le build privé configuré de recette pèse **99 026 309 octets**, 230 fichiers. Il n'a pas été allégé : les ressources sont identiques aux sources. Le chunk applicatif configuré inclut le SDK Auth (753,58 kB minifiés, 217,46 kB gzip) ; il ne faut pas le comparer directement au build sans configuration qui élimine du code inaccessible. Phaser reste à 1 208,06 kB minifiés. Aucun nouveau traitement par frame ajouté ; chargement réseau à froid et téléphone physique restent à mesurer.
- Avertissements conservés : imports JSON incohérents de `snow-detail.ts`, chunks >500 kB, références CSS non résolues pendant Vite puis copiées par le plugin privé. Les PNG/fontes concernés sont vérifiés après copie et servis avec MIME et octets corrects dans les tests.
- Le contrat de ressources couvre les familles et chargeurs actuels ; toute extension devra compléter sa liste et ses tests. Il ne remplace pas une revue de confidentialité des fichiers autorisés.
- Les journées réellement personnelles, le média privé du jour 10, la configuration Supabase, les sauvegardes/restaurations distantes, la recette mobile physique et l'hébergement restent des prérequis avant ouverture. Aucun de ces travaux n'est commencé en E.1.
- La sauvegarde du village reste locale et celle de l'Avent privé reste gérée par le backend existant ; aucun changement de format ou de contrat de synchronisation.

L'E.1 ne révèle plus de ressource obligatoire manquante dans le périmètre vérifié. La mise en production attend toujours les validations d'infrastructure et de contenus de l'E.0, ainsi que votre accord. Aucune phase suivante ne commence automatiquement.
