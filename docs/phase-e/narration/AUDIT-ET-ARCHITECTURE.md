# Fondation narrative et Jour 1 — audit initial

16 novembre 2026. Base : `547fbeb` (livraison privée E.1), branche distincte `feature/phase-e1-narrative-foundation`. Cette demande narrative porte aussi le nom E.1 ; elle ne remplace pas le rapport de livraison privée.

## Source reçue

Le PDF intégral fourni comporte 279 pages. Le cahier du Jour 1 occupe les pages 3 à 13 ; ses sept scènes, dialogues, choix, indices et critères de sauvegarde ont été extraits et contrôlés sur les pages rendues. Les 24 cahiers sont disponibles. Leurs contenus ne doivent pas être confondus avec les 24 activités fictives de Phase C.

Le PDF, son extraction et les contenus compilés restent dans `work/narrative-private/`, **hors de ce dépôt public**. Aucun dialogue personnel ou scénario futur ne doit être ajouté à `public/`, aux modules de démonstration, aux tests publics ou à un seed versionné. Les indications éditoriales internes au PDF sont des notes de conception ; la demande utilisateur actuelle autorise l'implémentation.

## Architecture effectivement trouvée

| Système | Existant et réutilisation |
|---|---|
| Affichage | React 19, TypeScript, Vite 7 et Phaser 3 ; scène `src/game/Game.ts` |
| Monde | 1920 × 1408, plan D.3.4, 16 habitations, quatre bâtiments ; collisions et chemins déjà déclarés |
| Intérieurs | `rooms33`, `room-render33`, `interior-layout` : maison 864 × 560, bibliothèque 960 × 560, atelier 896 × 512, auberge 960 × 544 ; volumes conservés |
| Personnages | Debby et Loyal humains, Flocon renard ; Célestine `mira`, Basile `oscar`, Madeleine `alma`, Augustin `noe`, Émile `emile` ; identifiants historiques conservés |
| Dialogues | Graphes `rpg/dialogue.ts`, conditions, effets, historique, changement de locuteur ; composant `art/Dialogue.tsx`, portraits et quatre options au maximum |
| Quêtes | `rpg/quests.ts` : événements talk/explore/find/solve/minigame/interact ; cinq quêtes fictives, récompenses dédupliquées |
| Routines | `world/runtime.ts`, navigation à grille, réservations et trois profils horaires ; activités de lecture, rangement, fauteuil, courrier et lanternes D.4.2 |
| Avent privé | `AdventAPI`, Auth Supabase, RPC, RLS, heure Europe/Paris, médias privés ; versions, aperçu et progression distincts |
| Sauvegardes | Save v2 avec lecture v1 ; base IndexedDB `etoilebois` v1, magasin `saves`, clés `phase-a`/`phase-b` ; brouillons Avent déjà séparés par utilisateur, run et aperçu |
| Sapin | Atlas validé intact, images `sapin_00` à `sapin_24` : pas besoin d'une nouvelle étoile permanente superposée |

Le type Avent `scene` lance actuellement **le final**. Il ne peut pas être détourné pour réaliser une scène d'arrivée. Le HUD utilise le maximum des étoiles village et Avent : la nouvelle aventure doit distinguer son propre état sans effacer les anciennes récompenses.

## Décisions d'intégration

1. Réutiliser les événements et conditions existants dans un réducteur narratif déclaratif. Les textes viennent d'un contenu privé ; le registre public ne contient que 24 identifiants et quatre groupes de six.
2. Conserver les sauvegardes et activités historiques. Ajouter des checkpoints distincts, versionnés et isolés par utilisateur/aperçu ; une version inconnue ou une écriture périmée doit être refusée, jamais remplacée silencieusement.
3. Prévoir un adaptateur de scène optionnel dans le monde existant : interactions, choix, caméra et réservations temporaires des acteurs, sans déplacement de bâtiments ni changement de géométrie.
4. La disponibilité et les récompenses de production restent contrôlées côté serveur. Un état local ou une clé d'idempotence ne constitue pas une autorisation, une étoile attribuée ou une preuve Supabase réelle.
5. Un éventuel atelier local doit être explicitement réservé au développement, avec contenu importé par l'auteur et progression distincte. Il ne garantit pas la confidentialité d'un déploiement.

## Points à contrôler pendant la réalisation

- Célestine vit initialement à la bibliothèque. Toute participation extérieure exige un trajet et une transition par une porte, pas une copie du personnage sur la place.
- Les durées de routines sont courtes : réserver les acteurs lors des dialogues puis les libérer ; éviter un séquenceur qui dépend de délais réels arbitraires.
- Les poses spécifiques d'assise de Debby/Loyal, l'ajustement des lunettes et les thèmes musicaux dédiés ne sont pas encore validés par cet audit. Ne pas les remplacer par une posture déformée ou annoncer des assets absents.
- Les indices et points d'arrêt devront être testés sur les collisions réelles. Les aides ne doivent avancer que pendant l'exploration active.
- Préserver le profil de progression existant. Une ancienne étoile fictive ne doit pas être effacée pour simuler un nouveau départ narratif.

## Premier sous-ensemble réalisé avant réception du PDF

Réducteur d'épisodes/scènes, événements ordonnés, conditions réutilisées, choix persistants, journal des faits découverts, clé de récompense stable et checkpoints atomiques isolés. Douze tests techniques ajoutés : **215 réussis, 2 ignorés Windows**, 27 fichiers ; TypeScript et lint passent. Ces fixtures techniques ne sont pas les scènes du Jour 1. Aucune interface ni aucun épisode réel n'était activé par ce premier sous-ensemble.

Statut d'intégration du Jour 1 et résultats finaux à consigner dans le rapport de réalisation ; la présence d'un script n'est pas une validation du parcours jouable.
