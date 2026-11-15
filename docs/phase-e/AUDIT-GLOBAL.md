# Phase E.0 — Audit de production

Audit du 15 novembre 2026. Branche `feature/phase-d4-2-activites`, commit `700146622131934c3416dfabd13b1bef2df3d85f`, version déclarée 0.7.5. Aucune modification de jeu autorisée dans cette mission.

## Conclusion

Le dépôt contient un RPG jouable et les 24 activités fictives, pas encore une livraison privée de Noël validée en production. La priorité n'est pas un nouveau moteur ou une nouvelle population : c'est de rendre l'artefact privé complet, configurer et éprouver Supabase, préparer les contenus personnels hors Git, puis effectuer une recette sur l'hébergement réel.

**P0 confidentialité : le connecteur GitHub `get_repo` renvoie `visibility: public` pour ce dépôt au moment de l'audit.** Cela contredit l'exigence de dépôt privé. Aucun réglage n'a été modifié : faire confirmer/corriger cette visibilité avant toute donnée personnelle et examiner l'historique si des données sensibles ont pu y être déposées. Cet audit n'atteste pas l'absence de secrets dans toute l'histoire Git.

**P0 livraison : les trois PNG D.4.2 chargés par `src/world/activity-presentation.ts` ne figurent pas dans `ops/public-assets.json`.** Vite les sert en développement/démonstration, mais la construction privée désactive la copie globale de `public` et ne copie que cette liste. Un build réussi n'assure donc pas la présence des animations. Reproduction Chrome locale : les trois requêtes renvoient HTTP 200 `text/html` (repli SPA), puis Phaser émet neuf messages d'erreur image/atlas ; le canvas du village apparaît néanmoins. Sous la configuration Nginx prévue, les fichiers absents seraient refusés en 404. Ne pas publier cet artefact en l'état.

## État Git vérifié

- Arbre propre au début : `git status --porcelain` vide ; aucun travail non enregistré détecté.
- Historique D.4.2 : `814c7a2` audit, `6621937` activités, `4e2ecab` dialogue au fauteuil, `7001466` validation. Fondation D.4.1 : `521a6ce`, `a97949f`, `be52808`.
- Lecture distante `git ls-remote` : branche D.4.2 au même commit ; `main` et `develop` à `a34c2dc263edace301139a4df5e41f03c8931057` (Phase A). Les nombreuses évolutions n'y sont pas intégrées. Prévoir une revue de l'ensemble de la différence, pas seulement du dernier commit.
- Lecture du statut combiné du commit via GitHub : liste de statuts vide. La recherche des workflows associés au commit retourne également une liste vide, mais cet outil est limité aux déclenchements pull request et à la première page : cela ne prouve pas l'absence de tous les runs push. Aucun feu vert CI distant n'est attesté.
- URL distante : `https://github.com/MonsieurLoyalDev/les-24-etoiles-de-noel.git`. Métadonnées obtenues en lecture via le connecteur GitHub : dépôt non archivé, branche par défaut main, **visibilité public**. Protections de branches non réinterrogées. Le champ npm `private: true` ne prouve pas la confidentialité du dépôt.
- Aucun checkout, commit, push, fusion ou déploiement pendant E.0. Seuls les sept rapports de ce dossier sont ajoutés au projet.

## Échelle des preuves

« Implémentée et testée » signifie une preuve locale exécutée dans le périmètre indiqué ; cela ne signifie jamais une recette Supabase/VPS/iPhone. « Implémentée, non validée » désigne du code sans preuve d'intégration réelle suffisante. « Partielle » signale une limite fonctionnelle ; « absente » signifie qu'aucune implémentation correspondante n'a été trouvée dans les modules examinés.

| Fonction | État et preuve | Limites avant ouverture |
|---|---|---|
| Déplacement, collisions, interactions, clavier/tactile | Implémentés ; tests domaine et sélection navigateur | Téléphone physique et Safari non vérifiés |
| Village 1920 × 1408, 16 maisons, 4 intérieurs | Implémentés ; contrôles de géométrie et parcours automatisés existants | Ne pas confondre captures historiques et recette actuelle |
| Dialogues à choix, conditions, effets, historique | Implémentés et testés localement (`rpg/dialogue.ts`) | Pas de mise en scène sociale multi-acteurs générale |
| Quêtes à étapes, événements, récompenses | Implémentés et testés (`rpg/quests.ts`) | Cinq quêtes village distinctes des 24 journées ; ancien texte « maison au sud-est » alors que l'objectif principal indique sud-ouest |
| Trois mini-jeux | Implémentés et testés ; réutilisés par l'Avent | Photo personnalisable, mais cartes mémoire et commandes d'emballage restent définies dans le code |
| 24 activités de démonstration | Implémentées, interactives ; SQL et parcours navigateur dédiés | Contenus fictifs ; plusieurs activités sont des panneaux interactifs, pas des scènes physiques du village |
| Calendrier privé | Implémenté, tests SQL locaux | Auth, RPC, Storage et dates sur instance distante non validés |
| Éditeur administrateur | Implémenté ; client/RPC et éditeur fictif testables | Usage réel et publication de 24 définitions à vérifier ; JSON nécessaire pour les structures complexes |
| Journal, export texte, rejeu, étoiles | Implémentés et testés localement | Journal village et journal Avent séparés ; compteur HUD/sapin utilise le maximum des deux nombres, pas un registre unique |
| Sauvegarde village | Implémentée et testée : IndexedDB, migration v1/v2 | Locale, non synchronisée entre appareils/comptes ; suppression des données navigateur = risque de perte |
| Sauvegarde Avent privé | Implémentée et testée en SQL embarqué | Étapes validées et souvenirs serveur ; brouillons et plateaux encore locaux ; reprise distante réelle à éprouver |
| Routines D.4.1 | Implémentées pour Augustin, Émile, Célestine | Horloge fictive de 180 s, 4 phases ; pas de vrai cycle de 24 h ni transitions autonomes générales entre bâtiments |
| Activités D.4.2 | Lecture/rangement/fauteuil, courrier, lanternes implémentés ; tests ciblés | Ressources absentes du build privé ; validation artistique non équivalente à recette production |
| Autres habitants / relations / événements | Personnages existants conservés ; catalogue futur documenté | Les 12 nouveaux habitants, scènes sociales générales et visiteurs datés sont absents de cette livraison |
| Final du 24 | Scène jouable à quatre répliques, retour place, atlas 24, réactions et message personnalisable | Démonstration courte ; pas de cérémonie chorégraphiée de tous les habitants, ni scène spécifique Flocon |
| Hébergement Nginx/Supabase | Scripts et guides présents | Aucune vérification réelle E.0 ; installation, HTTPS, sauvegarde/restauration restent à recetter |

## Vérifications E.0

Les commandes sont exécutées hors du dépôt source dans `outputs/e0-audit-7001466/project`. Les 1 614 fichiers suivis ont été recopiés octet pour octet depuis l'arbre propre et hachés ; les dépendances déjà installées sont utilisées via une jonction `node_modules`. Aucun `npm ci` n'a été relancé : reproductibilité d'une installation vierge non attestée. Les tests écrivent leurs fixtures, captures et builds seulement dans la copie, pas dans le projet ni un profil de navigateur personnel.

Environnement : Windows, Node 24.14.0, npm 11.9.0, Vite 7.3.7, Playwright 1.64.1, Chrome en rendu logiciel pour la sélection navigateur. Les versions réellement installées ne sont pas déduites des seules plages de `package.json`.

| Commande | Résultat E.0 |
|---|---|
| `npx tsc --noEmit` | Code 0, 4,55 s |
| `npm run lint` | Code 0, 3,58 s |
| `npm test` sur copie fidèle | 25 fichiers réussis ; **194 tests réussis, 0 échoué, 2 ignorés** ; 2,14 s Vitest |
| `npm run build` | Code 0, 8,01 s commande complète |
| `npm run build:private` sans variables réelles | Code 0, 8,16 s ; absence de paquet demo vérifiée, configuration distante non attestée |
| `npm run build:e2e` | Code 0 ; utilisé pour les parcours navigateur |
| `npm ls --depth=0` | Code 0 ; dépendances installées cohérentes avec les plages déclarées, sans attester une installation vierge |
| `bash --noprofile --norc -n` sur 4 scripts ops | Quatre codes 0 sous Git Bash ; syntaxe uniquement, pas exécution des installateurs |
| Sélection Playwright | Code 1 : **42 réussis, 2 échoués, 0 ignoré, 0 instable**, 44 cas ; 30 min 48,35 s |

Premier essai sur l'export `git archive` : 193 réussis, 1 échec de comparaison SHA-256 sur `Captcha.tsx`, 2 ignorés. Cause vérifiée : `core.autocrlf=true` dans la configuration système Git ; l'entrée ZIP contient CRLF et, après normalisation LF, retrouve exactement le SHA-256 du HEAD et de l'arbre source. Après recopie exacte des fichiers suivis, le contrôle passe. Cet échec de préparation est conservé dans le bilan et n'a entraîné aucune modification de test ou du code source. **P1 reproductibilité :** les assertions de préservation en octets sont sensibles aux fins de ligne ; un checkout/export Windows neuf peut les faire échouer sans changement fonctionnel. Définir des fins de ligne stables ou une politique de preuve adaptée dans une mission de correction, pas dans E.0.

Tests ignorés Windows : « activation et restauration atomiques, anciens assets conservés » et « refuse les symlinks et la sortie du dossier dédié ». Ils demandent une vérification POSIX ; les annoncer réussis serait incorrect.

La première tentative de syntaxe Bash dans le bac à sable échoue avant analyse (MSYS `NtCreateDirectoryObject`, accès refusé, code -1073741502) ; la même analyse `-n` avec autorisation locale passe pour les quatre fichiers. Aucun corps de script n'a été exécuté. Aucun audit de vulnérabilités npm ni examen exhaustif des secrets dans l'historique Git n'est revendiqué.

Avertissements : imports JSON incohérents dans `snow-detail.ts` ; chunks > 500 kB (Phaser 1 208,06 kB minifiés, 332,17 kB gzip ; application demo 528,50 kB, 157,93 kB gzip) ; le build privé avertit également que l'image de calendrier référencée par CSS sera résolue à l'exécution. Le contrôle privé actuel cherche un paquet demo et une phrase témoin : ce n'est pas un audit exhaustif des ressources nécessaires ni un détecteur universel de souvenirs/secrets.

Mesure de volume E.0 : build privé audité **227 fichiers, 92 605 977 octets**, encore incomplet des 3 PNG D.4.2 ; build E2E/demo **231 fichiers, 98 856 779 octets**. Ce volume sur disque n'est pas le transfert initial mesuré ni la mémoire GPU. `Game.preload()` charge notamment monde, maisons, pièces et personnages ; mesurer le démarrage à froid sur téléphone/réseau réel avant d'annoncer un bon confort mobile. L'ancienne estimation de 4,7 Mo dans `PLAN-VALIDATION-VPS.md` est obsolète ; aucune optimisation d'asset n'a été faite en E.0.

Mesures E.0 du test D.4.1, après échauffement, 180 intervalles RAF : PC p95 **37,6 ms**, moyenne **34,59 ms**, CPU ×1 ; mobile émulé p95 **20,8 ms**, moyenne **16,95 ms**, CPU ×4. Chrome local avec rendu logiciel ; charge non identique et diagnostic privé concurrent pendant une partie de la série. Ne pas conclure que le téléphone serait plus rapide que le PC ni comparer directement aux anciennes mesures D.4.2. Le seuil du test D.4.1 est p95 <100 ms ; son succès ne garantit pas 60 FPS. Chargement réseau à froid, mémoire GPU et téléphone physique non mesurés.

Une reproduction privée complémentaire a d'abord échoué dans une copie minimale faute du fichier racine `assets-manifest.json` ; après ajout des JSON racine inchangés, `vite build --mode private` passe. C'est une erreur de préparation de copie distincte du défaut avéré de liste des PNG. Le diagnostic Chrome de 18 secondes observe les trois réponses HTML et neuf erreurs Phaser, sans exception `pageerror` ; l'absence d'exception ne vaut pas absence de défaut graphique.

### Détail de la sélection navigateur exécutée

Commande dans la copie, avec `ETB_E2E_BUILT=1` et `SOFTWARE_GL=1` :

```text
npx playwright test tests/e2e/phase-c.spec.ts tests/e2e/phase-d4-1.spec.ts tests/e2e/phase-d4-2.spec.ts tests/e2e/game.spec.ts tests/e2e/phase-b.spec.ts tests/e2e/phase-d3-2.spec.ts --reporter=json
```

| Fichier | Réussis | Échoués | Couverture exercée |
|---|---:|---:|---|
| `game.spec.ts` | 4 | 0 | Première quête, journal, sauvegarde, joystick et débordement |
| `phase-b.spec.ts` | 2 | 0 | Quêtes secondaires et trois mini-jeux |
| `phase-c.spec.ts` | 4 | 0 | Les 24 activités, reprise, récompenses, final, calendrier daté de novembre, éditeur fictif persistant |
| `phase-d3-2.spec.ts` | 12 | 2 | Maisons/collisions, 17 objets décoratifs, états, quatre intérieurs jour/nuit, circulation, réduction des mouvements et mesures locales |
| `phase-d4-1.spec.ts` | 8 | 0 | Habitants conservés, géométrie, navigation, dialogue/pause, quatre créneaux, rencontre Émile et budgets |
| `phase-d4-2.spec.ts` | 12 | 0 | Lecture/rangement/assise, courrier, lumière synchronisée, inspection/extinction, interruption/reprise, sauvegarde, dialogue au fauteuil |

Chaque cas est exécuté sur desktop et mobile émulé ; les lignes du tableau totalisent 44. Les **deux échecs** sont « D32 démonstration enregistrée des interactions et animations », un par projet : `browserContext.newPage` échoue avant le scénario parce que `C:\Users\arthu\AppData\Local\ms-playwright\ffmpeg-1013\ffmpeg-win64.exe` est absent. La démonstration enregistrée n'a donc pas été validée dans cette série. Le test séparé des 17 objets au clavier/toucher passe. Aucun téléchargement/install FFmpeg ni modification du test pour masquer cet échec. Les erreurs sont conservées, pas converties en succès.

Cette sélection couvre 6 des 22 fichiers `.spec.ts` sous `tests/e2e` ; les autres scénarios historiques ne sont pas annoncés exécutés. Les tests privés HTTPS/Nginx, POSIX d'activation/restauration et backup PostgreSQL ne sont pas inclus dans cette sélection Windows. La réussite des 24 activités utilise des fixtures de pièce/position et les bonnes réponses demo ; elle ne valide pas la compréhension des indices par une joueuse, le provisionnement Supabase ou une sauvegarde privée sur plusieurs appareils.

Traces de travail E.0 : résultats JSON, journaux de commandes, hashes source et diagnostic privé conservés dans le dossier frère `outputs/e0-audit-7001466/`. Les captures générées par les tests restent dans cette copie. Aucun ZIP de livraison ni nouvel asset de jeu produit pour cet audit ; l'export ZIP Git intermédiaire a uniquement servi à préparer la copie de vérification.

Contrôle final : **1 614 fichiers suivis comparés par SHA-256, aucun modifié**. Branche et HEAD inchangés ; `git diff --stat` vide. `git status` ne signale que le nouveau dossier `docs/phase-e/` contenant les sept rapports demandés, laissés non committés. Aucun changement de sauvegarde personnelle, de configuration GitHub, de production ou de VPS ; aucune fusion et aucun développement E.1.

## Les cinq risques principaux

1. **P0 — Dépôt annoncé public par GitHub :** exigence de confidentialité non satisfaite ; contrôler aussi une éventuelle exposition passée avant toute donnée personnelle.
2. **P0 — Artefact privé incomplet :** spritesheets D.4.2 omises, erreurs de chargement reproduites dans Chrome malgré compilation réussie.
3. **P0 — Backend réel non recetté :** invitations, membres, RLS, Storage, CAPTCHA et limites Auth ne sont pas prouvés opérationnels.
4. **P0 — Contenus définitifs indisponibles :** les 24 définitions examinées sont fictives ; jour 10 référence un média demo absent du build privé.
5. **P0 — Mise en ligne et continuité non éprouvées :** HTTPS, CSP, activation/restauration et sauvegardes réelles restent à vérifier ; village local/Avent serveur et branches principales très anciennes.

## Les cinq actions recommandées

1. Faire confirmer et corriger la visibilité GitHub, puis évaluer l'exposition historique si nécessaire ; aucune mutation de réglage en E.0.
2. E.1 : verrouiller l'artefact privé complet par un contrôle de dépendances statiques et un parcours de production privé sans service réel imposé.
3. Provisionner/recetter un staging Supabase dédié avec comptes admin/joueur ; conserver toute modification de production soumise à accord.
4. Préparer et éprouver les 24 contenus personnels dans le stockage privé et l'éditeur, avec validation du propriétaire ; aucun souvenir dans Git.
5. Valider installation vierge, chaîne Linux/Nginx/HTTPS, restauration, reprise et mobile réel ; geler les développements facultatifs avant le 30 novembre.

Planning et estimation : [ROADMAP-30-NOVEMBRE.md](ROADMAP-30-NOVEMBRE.md). Proposition E.1 uniquement : [PROCHAINE-MISSION.md](PROCHAINE-MISSION.md). Aucun développement E.1 commencé.
