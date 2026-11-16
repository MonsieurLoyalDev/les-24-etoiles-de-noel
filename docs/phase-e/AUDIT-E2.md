# E.2 — audit préalable du Jour 1

16 novembre 2026. Arbre initial propre sur `abe7d74`, branche narrative E.1 non fusionnée. Base demandée `feature/phase-e1-private-release` à `547fbeb`. Branche E.2 créée depuis cette base ; les deux commits narratifs existants sont repris explicitement par cherry-pick (`69c0d7b`, `0a38982`), sans fusion et sans perte de travail.

Rapports E.0 global, narratif, sécurité et E.1 livraison privée/narrative examinés. PDF intégral accessible hors dépôt, Jour 1 pages 3–13. Les notes éditoriales du PDF ne remplacent pas la demande d'implémentation E.2. Aucun scénario privé ne sera versionné dans ce dépôt public.

## Réutilisation

React/Vite/TypeScript, scène Phaser `Game`, graphes/portraits `rpg/dialogue` et `art/Dialogue`, événements `rpg/quests`, navigation et réservations `world`, interactions décoratives, IndexedDB existant, Auth/CAPTCHA/RPC/RLS et calendrier Europe/Paris. La couche narrative E.1 reste un adaptateur de ces systèmes ; aucun second moteur ou nouvelle base locale n'est nécessaire.

Monde 1920×1408, 16 habitations, quatre intérieurs D.3.3 conservés. Entrées issues du plan D.3.4, emprises des façades et collisions existantes ; Célestine à la bibliothèque, Émile et Augustin en routine dans le village. Les dialogues interrompent déjà les activités D.4. Les ressources privées sont autorisées par une liste de 225 fichiers et contrôlées en octets/MIME.

## Écarts avant développement

| Domaine | Présent E.1 | À terminer E.2 |
|---|---|---|
| Accueil | Dialogues et choix persistants, compagnons en déplacement | Introduction courte et tutoriel après accueil ; ancrages nommés |
| Promenade | Trois rencontres libres, premier habitant sauvegardé | Interactions facultatives intégrées, pauses sûres des compagnons |
| Sapin | Atlas 24→0→1 et interaction explicite | Moment romantique facultatif sans bloquer la suite |
| Dispersion | Effet 30 s et reprise sans répétition | Réaction de Flocon, cascade visible, arrêt des habitants proches, retour caméra |
| Enquête | Trois points ordonnés et timer | Indices différenciés (neige/reflet/clochette), aides 30/60/90 effectives, pause testée |
| Étoile | Choix émotionnel, restitution locale | Contrat de confirmation serveur/calendrier, aucune récompense concurrente |
| Chalet | Dialogue, livre, exploration après fin | Flocon au repos, points d'interaction du mobilier, notification de fin/date |
| Sauvegarde | Scène/curseur/choix/indices et conflits | État d'orchestration additionnel compatible, reprises à chaque phase critique |
| Calendrier | Deux écrans techniques E.1 séparés | Le calendrier existant doit router vers l'épisode publié ; aperçu distinct |

Atlas de réactions `calin` et `mains` disponibles, silhouettes validées conservées. L'assise du couple et l'ajustement des lunettes ne disposent pas de poses dédiées vérifiées ; ne pas déformer les sprites ni présenter une pose debout comme une assise. Sons autorisés absents : silence conservé, points de lecture préparés.

## Contrat retenu

Pour un jour possédant un épisode privé publié, le calendrier sélectionne la source narrative. Les anciennes lignes village/Avent sont conservées intégralement ; leurs récompenses ne sont ni additionnées ni converties. La restitution et la fin officielle sont deux faits distincts : une étoile restaurée après la scène 6, épisode terminé à la première ouverture du Livre au chalet. Le serveur confirme ces faits dans la session narrative datée ; l'aperçu et la relecture n'attribuent jamais une seconde étoile réelle. Aucune écriture de `advent_progress` n'est fabriquée pour simuler des preuves de mini-jeux.

La disponibilité est celle de l'horloge serveur existante. Les contenus futurs restent privés. Un build sans contenu importé/backend configuré n'est pas une installation prête à jouer en production. Les tests utilisent des contenus techniques publics ou le cahier privé chargé hors Git.
