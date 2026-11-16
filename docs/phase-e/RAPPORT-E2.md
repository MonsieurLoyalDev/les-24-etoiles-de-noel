# Phase E.2 — Jour 1 : intégration narrative

## Base et préservation

Branche de livraison `feature/phase-e2-jour-01`, créée depuis `feature/phase-e1-private-release` au commit `547fbeb657abadcadca85fbac7a73a5c9c3615c8`. Cette base distante a été vérifiée. L'arbre initial était propre. Les deux commits de fondation narrative non fusionnés ont été repris par cherry-pick (`69c0d7b`, `0a38982`) ; leur branche originale est conservée. Aucun merge, déploiement, changement de visibilité ou intervention VPS.

L'audit préalable est dans `AUDIT-E2.md`. Les rapports E.0 et E.1 sont conservés. Carte, seize maisons, quatre intérieurs, neige, atlas, portraits, anciens dialogues, quêtes, mini-jeux et formats des sauvegardes A/B/C/D restent en place.

## Architecture réutilisée

La couche E.1 orchestre les scènes et les faits, sans remplacer Phaser ou les moteurs RPG. Les répliques privées sont adaptées en `DialogueGraph` ; transitions et conditions passent par `rpg/dialogue.ts`. L'interface et les portraits existants affichent les locuteurs et les choix. Les objectifs utilisent les événements RPG existants. Navigation, points de lanternes, mobilier et portes viennent des données existantes ; les ancrages sont regroupés dans `narrative/bindings.ts`.

Le registre comporte 24 identifiants et quatre constellations. Seul le Jour 1 est intégré. Aucune réplique des Jours 2 à 24 n'est ajoutée. Les 24 activités fictives historiques restent distinctes de cette aventure.

Le PDF intégral demeure hors Git. Le cahier privé versionné du Jour 1 reprend les 67 répliques originales ; seuls des conseils d'enquête supplémentaires, non personnels, complètent ses données. Les tests publics utilisent une fixture technique. Les véritables textes sont chargés à l'exécution après contrôle serveur, jamais placés dans `public`, un module Vite ou un seed versionné.

## Statut fonctionnel

| Séquence | Réalisation |
|---|---|
| Arrivée | Entrée sud issue du plan, introduction courte, Loyal et Flocon, dialogue original, trois réponses, choix persistant puis tutoriel de déplacement réel |
| Rencontres | Émile, Augustin et Célestine dans les lieux/routines existants ; ordre libre, trois rencontres et `firstMetVillager` conservés |
| Sapin | Déclenchement explicite, atlas à 24 étoiles, moment facultatif avec Loyal, poursuite explicite sans récompense additionnelle |
| Dispersion | Environ 30 secondes en qualité normale ; réaction discrète de Flocon, cascade temporaire, arrêt des habitants proches, dispersion, atlas à zéro et retour caméra ; reprise sans rejouer l'effet |
| Enquête | Neige dorée, reflet et clochette différenciés, points d'approche accessibles, ordre strict et index 0–3 ; aides 30/60/90 en temps d'exploration actif |
| Première étoile | Dialogue et trois réponses d'origine, choix persistant, restitution, première page du Livre et confirmation serveur unique |
| Chalet | Intérieur existant, dialogue original, consultation du Livre, notification de fin puis exploration libre ; possibilité de différer la visite |

Interactions facultatives : observation de vitrine et lanternes, pause près d'un banc avec Loyal, Flocon, moments tendres, feu et coin salon. Elles n'avancent pas les quêtes ni le compteur d'étoiles. Les deux tasses, la bibliothèque et les décorations de la maison sont réutilisées ; un point du Livre et un petit textile de repos pour Flocon complètent les compositions existantes sans toucher aux collisions.

Les phases sont dérivées des faits persistants : ARRIVAL, MOVEMENT_TUTORIAL, VILLAGE_TOUR, TREE_DISCOVERY, STARS_SCATTER, LIGHT_TRAIL, FIRST_STAR, CHALET_EPILOGUE, COMPLETE. Le champ de présentation est additif ; les anciennes données restent lisibles. Un checkpoint conserve aussi pièce, position sûre, compagnons, curseur de réplique, choix, indices et événements vus. Une version inconnue ou un conflit échoue explicitement au lieu de réinitialiser une partie.

## Contrat calendrier / récompenses

La migration `202611160002_episode_calendar_contract.sql` complète les migrations Avent et narrative E.1. Pour un jour possédant un épisode publié, le **calendrier illustré existant** ouvre cet épisode. Il n'affiche plus un second calendrier narratif au joueur privé. L'atelier d'import et l'aperçu administrateur restent séparés.

`restored_at` confirme l'étoile après la restitution ; `completed_at` confirme la fin après le Livre au chalet. La date officielle vient de `private.server_now()`. Le HUD narratif attend l'accusé serveur pour compter une récompense réelle. Les effets locaux du sapin ne fabriquent aucune preuve de mini-jeu ni ligne dans `advent_progress`. Les lignes historiques restent intactes : elles ne sont ni converties ni additionnées aux étoiles narratives. Relecture, aperçu et partie canonique sont isolés.

Les contrôles Auth, membres, administrateur, CAPTCHA, RLS et Europe/Paris sont conservés. Les anciennes fonctions déplacées dans le schéma privé sont révoquées pour les clients. Le statut des journées futures ne livre pas leurs textes. L'installation des migrations et l'import du contenu sur un Supabase réel restent à réaliser dans une mission d'infrastructure autorisée.

## Graphismes et sons : limites explicites

Le contrôle visuel a montré que les anciens atlas de couple `mains`/`calin` représentent Loyal avec une apparence de renard. Ils sont donc **écartés du Jour 1**. Les humains validés et leurs lunettes restent visibles ; les interactions tendres utilisent leurs poses debout et une orientation temporaire. Elles ne sont pas présentées comme de nouvelles animations dessinées de câlin ou de main tenue. L'interface précise cette réserve.

Non réalisés artistiquement : poses de couple assis, vrai câlin dessiné, mains réellement jointes, ajustement des lunettes et Flocon roulé en boule. Le repos de Flocon utilise son attente existante et un petit tapis réemployé, pas un nouveau sprite de sommeil. Ces limites n'empêchent aucune scène de se terminer. La clochette est une petite icône pixel originale générée une fois ; elle reste soumise à validation artistique.

Les points sonores par scène sont préparés et réutilisent le service audio existant. Aucun fichier musical autorisé n'ayant été fourni, la séquence reste silencieuse. Aucun son externe, synthèse ou nouvelle piste non licenciée n'est ajouté. Muet, volume et réduction des mouvements restent respectés.

## Vérifications

Commandes exécutées sous Windows, Node 24.14 : `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, puis `npm run build:private` avec les variables publiques de fixture. Toutes réussissent. Vitest : **232 réussis, 0 échoué, 2 ignorés** (cas d'exploitation POSIX non exécutables sur Windows), 29 fichiers, 4,81 secondes. Le contrôle privé vérifie **225 ressources aux octets identiques**, sans paquet de démonstration.

Recettes navigateur réellement exécutées : ancien jeu A/B/C/compatibilité des sauvegardes **12/12**, régression privée et D.4.2/calendrier narratif **18/18**, alternance aventure/ancienne activité **2/2** PC et mobile émulé. Le parcours narratif final avec le cahier privé est détaillé dans le complément de livraison ci-dessous. Le backend des tests utilise les véritables migrations dans PGlite et une fixture Auth/Storage stricte ; ce n'est pas Supabase réel.

Avertissements de build conservés : attributs d'import JSON incohérents préexistants, chunks dépassant 500 ko et références CSS résolues lors de la copie contrôlée des ressources privées. Build privé : module principal 799,05 ko (231,04 ko gzip), Phaser 1 208,06 ko (332,17 ko gzip). Aucune promesse de validation Safari iOS ou de déploiement réel.

Mesures issues du test de quartier après échauffement, 170 échantillons RAF : PC p95 33,4 ms, moyenne 29,41 ms ; téléphone émulé p95 16,7 ms, moyenne 16,67 ms. Elles concernent Chromium avec rendu logiciel, hors cinématique narrative ; elles ne mesurent ni un téléphone physique ni une comparaison matérielle PC/mobile.

La première recette concurrente a provoqué une collision de dossiers Playwright : un lancement supprimait des traces de l'autre. Les lots ont été isolés et leur concurrence réduite. Deux assertions anciennes A/B ont aussi échoué après rechargement dans ce lot chargé ; la reproduction A isolée conserve correctement l'étoile. Le rapport final donne les derniers résultats et ne transforme pas ces essais en succès.

Les empreintes historiques D35/E.1 restent intactes. `PRESERVATION-E2.json` autorise seulement les trois fichiers protégés réellement adaptés : raccord calendrier, type du statut et nettoyage des réactions. Aucun asset ni fichier de géométrie n'est retiré de la vérification.

Les checkpoints narratifs ne remplissent pas l'historique des anciens dialogues RPG : un test effectue 600 avances sans altérer cet historique. Le changement entre activité historique et aventure efface seulement l'intention active concurrente ; les archives de progression restent disponibles. La relecture possède son état séparé et ne réattribue pas l'étoile canonique.

## Configuration et livraison privée

Pour une installation de recette : appliquer dans l'ordre les migrations `202611030001_advent.sql`, `202611160001_narrative.sql`, `202611160002_episode_calendar_contract.sql` ; configurer Auth/CAPTCHA/membres selon les guides existants ; importer le cahier privé versionné par l'administrateur dans l'atelier. Le joueur utilise ensuite « Avent 2026 » puis le Jour 1, sans importer de fichier ou utiliser un mode développeur. Aucun de ces changements n'a été effectué sur votre Supabase/VPS pendant E.2.

Le cahier compilé E.2, les preuves de fidélité et les captures personnelles sont conservés dans `work/narrative-private` du workspace parent, hors dépôt public. Ne jamais les ajouter à GitHub ou aux artefacts CI. La CI exécute le même parcours privé avec une fixture technique publique uniquement.

## Fichiers et suite

Modifications : intégration `src/advent/Hub.tsx`, modèle du statut, calendrier illustré, priorité des interactions `Game`, nettoyage des réactions ; orchestration `src/narrative`, ancrages, adaptation des dialogues, aides, effets, sons silencieux et checkpoints ; migration de raccord ; tests unitaires/SQL/navigateur, sortie de captures configurable, configuration Playwright et CI ; audit, empreintes et ce rapport.

E.3 n'est pas commencée. La prochaine validation doit porter sur le rythme du Jour 1, ses captures et les réserves artistiques. Le déploiement réel et les animations manquantes nécessitent leurs propres validations, sans inventer le Jour 2.

## Recette finale du cahier privé

Le 16 novembre, le parcours complet du **build privé de production** avec le vrai cahier du PDF chargé hors Git passe **2/2**, PC et mobile émulé, en 3,5 minutes. Total des derniers lots navigateur : **34 réussis, 0 échoué** (12 anciens parcours, 18 régressions privées, 2 alternances et 2 parcours complets).

Ce parcours vérifie les sept scènes, deux ordres de rencontres, le premier habitant, les choix, un rechargement au milieu du dialogue d'accueil, la disparition sans répétition après reprise, les trois indices, les aides réelles 30/60/90 et leurs pauses, la restitution unique, le Livre, la complétion officielle, la reprise au chalet et la relecture sans modification de la ligne canonique serveur. Les journées futures restent bloquées. La réduction des mouvements est exercée sur le parcours mobile.

Deux essais intermédiaires ont identifié des attentes incorrectes dans la recette : lecture d'un diagnostic temporairement absent au changement de relecture, puis rechargement avant que le clic de dialogue ait atteint la boucle Phaser. Les attentes sont désormais explicites (nouveau directeur, nouvelle réplique puis fin de sauvegarde). Aucun succès n'est attribué à ces essais échoués ; les chiffres ci-dessus désignent les derniers lots terminés.

Les 33 captures du véritable jeu sont livrées hors Git dans la galerie privée `validation-e2/index.html`, réunies dans `E2-JOUR01-VALIDATION.zip`. Conversion WebP sans perte, dimensions inchangées et égalité exacte des pixels RGBA vérifiée. Les répliques et la page du Livre sont identiques au cahier privé initial ; un contrôle recherche également les longues chaînes narratives privées dans les fichiers modifiés et le JavaScript public généré.

Archive finale : **18 365 272 octets**, SHA-256 `009d275257f6d437063b0ee5b0e155cb9674476a019760d29e48127a98164a15`. Contrôle de confidentialité : 32 longues chaînes privées recherchées, aucune occurrence dans les fichiers publics contrôlés. La galerie et le cahier compilé sont livrés localement uniquement. Les captures ne sont pas des illustrations conceptuelles.

## Inventaire exact des fichiers E.2

- `.github/workflows/ci.yml`
- `docs/phase-e/AUDIT-E2.md`
- `docs/phase-e/PRESERVATION-E2.json`
- `docs/phase-e/RAPPORT-E2.md`
- `playwright.author.config.ts`
- `playwright.narrative-private.config.ts`
- `src/advent/Hub.tsx`
- `src/advent/model.ts`
- `src/art/Calendar.tsx`
- `src/art/reactions.ts`
- `src/game/Game.ts`
- `src/narrative/api.ts`
- `src/narrative/bindings.ts`
- `src/narrative/bridge.ts`
- `src/narrative/cues.ts`
- `src/narrative/dialogue-adapter.ts`
- `src/narrative/Director.ts`
- `src/narrative/Hub.tsx`
- `src/narrative/orchestration.ts`
- `src/narrative/script.ts`
- `src/narrative/sound.ts`
- `supabase/migrations/202611160002_episode_calendar_contract.sql`
- `tests/e2e/game.spec.ts`
- `tests/e2e/phase-b.spec.ts`
- `tests/e2e/phase-c.spec.ts`
- `tests/e2e/phase-d3-2-compat.spec.ts`
- `tests/environment-d35.test.ts`
- `tests/narrative-e2.test.ts`
- `tests/narrative-e2e/author.spec.ts`
- `tests/narrative-e2e/compat.spec.ts`
- `tests/narrative-security.test.ts`
- `tests/private-e2e/narrative-fixture.ts`
- `tests/private-e2e/narrative.spec.ts`
- `tests/private-e2e/release.spec.ts`
