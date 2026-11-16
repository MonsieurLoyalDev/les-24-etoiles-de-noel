# Production privée — plan au 16 novembre 2026

Base vérifiée : `feature/phase-e2-1-polish`, `f862d317e604e69ea4176f81b698156a662a3022`, arbre propre. Jour 1 validé par le créateur, inchangé comme référence. Branche du premier lot : `feature/production-days-02-06`.

Le PDF original est accessible (279 pages, empreinte SHA-256 `907b88fc4a959acbb6c906cb6007509cab86f501a8eeaa3e9efe5b6ce915dd74`). Les pages 14–165 correspondant aux Jours 2–16 sont extraites dans le workspace privé, hors dépôt. Aucun scénario ni solution originale ne doit être mis dans les rapports publics. La matrice détaillée et les scénarios compilés doivent être livrés séparément en privé.

## Audit et réutilisation

React/Vite/TypeScript/Phaser ; `rpg/dialogue`, `rpg/quests`, navigation/routines `world`, calendrier privé daté, RPC/RLS, checkpoints versionnés, journal, sept scènes du Jour 1 et finitions E.2.1 sont conservés. Le registre public contient déjà 24 identifiants, répartis en quatre groupes de six. Les démonstrations historiques ne sont pas les véritables épisodes.

Écarts : le directeur de présentation et plusieurs validations SQL décrivent encore principalement les sept types de scènes du Jour 1. Il manque un raccord déclaratif aux activités avec brouillon persistant, les conséquences canoniques inter-épisodes, la consultation cumulative du Livre et les nouveaux lieux nécessaires. Les cartes, collisions et PNJ des quatre intérieurs/village existants ne doivent pas être reconstruits.

## Ordre et échéances cibles (heure de Paris)

| Période | Résultat attendu | Condition de passage |
|---|---|---|
| 16–20 novembre | Lot A : 5 épisodes, contenu privé, activités et progression | Recette PC, sécurité, reprise et validation du créateur |
| 21–25 novembre | Lot B : 6 épisodes, conséquences et lieux supplémentaires | Depuis le Lot A validé ; aucune anticipation du contenu futur |
| 26–28 novembre | Lot C : 4 épisodes, continuité et activités réutilisées | Depuis le Lot B validé |
| 29 novembre | Recette transversale, import privé, sauvegarde/restauration | Configuration distante disponible et autorisée |
| 30 novembre | Recette contrôlée avant ouverture du 1er décembre | HTTPS, invitations, déverrouillage réel et accord de déploiement |

Ce sont des cibles, pas des validations acquises. Le Lot A nécessite des capacités qui n'existent pas encore ; les nouveaux lieux et la synchronisation serveur sont les principaux risques du calendrier. Réduire d'abord les animations spécialisées, sons non fournis et décorations facultatives, jamais les énigmes, dialogues, sauvegardes ou autorisations.

## Confidentialité et adaptation

Les textes, choix, réponses et scènes inédites restent dans des scripts privés immuables. Les tests publics utilisent exclusivement des fixtures techniques sans spoiler. Les captures du vrai cahier restent hors Git/CI. Les descriptions de référence du PDF ne constituent ni des assets licenciés ni une autorisation de télécharger leurs illustrations.

Le cahier contient des intentions sans réplique pour certaines variantes. Ne pas fabriquer de texte : conserver le choix et les conséquences, utiliser uniquement les répliques écrites, et documenter les variantes manquantes dans le dossier privé. Les gestes sans frames dédiées sont signalés comme réutilisés ou incomplets.

Les Jours 17–24 ne sont pas développés dans cette opération. Aucun merge, déploiement, changement de visibilité, opération Supabase/VPS réelle ou modification des bots Discord.
