# Recette PC privée

Référence : Windows, navigateur Chromium, clavier/souris, 1920×1080. Conserver un smoke mobile émulé. Ne pas présenter cette émulation comme un iPhone physique ou Safari iOS.

Pour chaque lot : TypeScript, lint, tests unitaires/SQL, build normal/privé, ressources et MIME, parcours complets sur le vrai build privé avec contenu chargé hors Git, reprises au milieu des dialogues/activités, choix et conséquences, récompense unique, journal/Livre, prérequis et dates Europe/Paris, aperçu/relecture séparés. Rejouer le Jour 1 sans le réécrire.

Les fixtures CI sont techniques et fictives ; aucune capture personnelle dans les artefacts CI. Les tests d'un épisode isolé utilisent un aperçu administrateur explicitement autorisé, sans créer de complétion canonique factice. Les tests inter-journées doivent vérifier les vrais prérequis sur PostgreSQL embarqué puis sur Supabase réel lors d'une recette autorisée distincte.

## Résultats locaux — 17 novembre 2026

| Commande / contrôle | Résultat réellement obtenu |
|---|---|
| `npx tsc --noEmit` | Réussi |
| `npm run lint` | Réussi après correction de la conservation de la cause d'erreur dans le nouveau test navigateur |
| `npm test` | 258 réussis, 2 ignorés POSIX/Windows ; 34 fichiers réussis |
| `ETB_PRODUCTION_SOURCE_DIR=… npx vitest run tests/production-chain.test.ts` | 1 réussi avec les six vrais scripts privés ; vrais RPC PostgreSQL embarqué, six preuves et refus du Jour 7 |
| `npm run build -- --outDir ../../work/lot-a-normal-build` | Réussi ; sortie séparée pour ne pas écraser le build privé en cours de recette |
| `npm run build:private` | Réussi ; 235 ressources contrôlées, pas de démonstration embarquée |
| Playwright `playwright.production.config.ts`, sources privées hors Git | Six cas PC et six cas mobiles réussis : Jours 2–6 en aperçu et Jour 6 canonique après les cinq précédents. Dernière série PC complète : 6/6, 8,2 minutes, captures finales actualisées |
| Playwright `playwright.private.config.ts` | 18 cas distincts réussis après relance isolée d'un cas mobile ; ressources/MIME, animations D.4.2, interruptions, membres, dates, aperçu, refus anonymes et compte non invité |
| Playwright `playwright.narrative-private.config.ts`, véritable script du Jour 1 | 2 réussis, PC et mobile ; sept scènes, choix, aides suspendues, reprise, récompense unique, Livre et relecture |
| Playwright `tests/e2e/phase-c.spec.ts` | 4 réussis : 24 activités historiques et scène finale, calendrier de démonstration fermé en novembre, sauvegardes/éditeur ; PC et mobile |
| Playwright `compat.spec.ts` avec `playwright.author.config.ts` | 2 réussis : alternance aventure/ancienne activité avec conservation des checkpoints ; PC et mobile |
| Validation locale des cinq JSON privés | 5 réussis ; 7/8/7/8/9 scènes compilées. Une séquence facultative du cahier est regroupée dans le dernier bloc pour rester accessible sans conditionner le lendemain |
| Contrôle local de confidentialité | Aucun fragment privé recherché trouvé dans les textes publiables ou les bundles JavaScript ; ce contrôle complète la liste blanche et la séparation des sources, il n'est pas une preuve universelle d'absence de tout secret |

Le test mobile du Jour 2 a d'abord déclenché une ancienne conversation : la cible d'un habitant pouvait se déplacer pendant l'approche. L'arrêt de courtoisie et le contrôle du libellé réellement affiché ont été vérifiés dans un nouveau parcours réussi. Les premières assertions de reprise utilisaient une frame DOM trop ancienne ; elles attendent maintenant le nouveau brouillon avant comparaison. Les défauts fonctionnels trouvés sont décrits dans le rapport du lot.

Bilan : **38 cas navigateur distincts réussis** sur les suites ci-dessus, après les corrections et relances décrites. Aucun échec fonctionnel connu ne reste dans ce périmètre exécuté. Cela ne vaut pas validation artistique ni recette sur l'infrastructure réelle.

Le contrôle d'interruption de Célestine sur mobile a aussi rencontré un échec technique `ENOENT` à la fermeture du contexte : une autre suite avait nettoyé le dossier parent des traces. Les assertions de jeu n'étaient pas en échec ; la relance isolée avec sortie distincte passe. Les traces personnelles sont toujours redirigées hors Git et aucune capture originale n'est transmise à la CI.

## Conditions et limites de la mesure

Windows, Chrome headless, moteur Canvas pour la recette privée. Référence du Lot A : PC 1920×1080 ; mobile émulé 390×844 avec tactile et réduction des mouvements. Les anciennes suites conservent leur référence PC 1280×800 et mobile 390×844. Les parcours utilisent le clavier du jeu pour la navigation ; l'émulation teste aussi les boutons tactiles d'interaction et de validation, sans prétendre à un parcours intégral au joystick sur téléphone physique.

Les échantillons `requestAnimationFrame` comprennent 120 frames par parcours. Ils mesurent la cadence locale observée après le parcours, pas le temps CPU/GPU exclusif du moteur. Aucun profil mémoire approfondi, Safari iOS, téléphone physique, Supabase distant, CAPTCHA réel, HTTPS ou VPS validé.

Les parcours navigateur couvrent le chemin principal et les activités facultatives retenues, pas toutes les combinaisons de réponses et tous les ordres de collecte. Les réducteurs testent les six permutations d'une collecte à trois objets et le routage conditionnel des dialogues ; la recette artistique doit encore examiner les variantes originales et les gestes incomplets.

Les builds conservent les avertissements connus d'attribut JSON, de ressources CSS résolues à l'exécution et de taille des chunks. La sortie normale hors racine déclenche aussi l'avertissement attendu « dossier non vidé ». Aucune suppression forcée n'a été utilisée.
