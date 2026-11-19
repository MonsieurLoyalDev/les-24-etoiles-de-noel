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

## Actualisation après production du Lot B — 18 novembre

Le Lot A est validé artistiquement par le créateur. Le Lot B est développé sur `feature/production-days-07-12` depuis le commit validé `c45280c` et fait l'objet de sa recette séparée. La carte et les intérieurs validés ne sont pas reconstruits ; les extensions sont additives. Les rapports historiques ci-dessus décrivent l'audit du 16 novembre et ne constituent pas l'état actuel des nouvelles validations.

La session du Lot B commence le 18 novembre à 17:14 (Paris, reflog de création de branche). La durée finale est consignée dans `RECETTE-LOT-B.md` ; elle comprend lecture, génération limitée de ressources, développement et attentes de tests. Ce temps d'exécution assistée ne mesure pas une durée de production humaine ni les retours artistiques à venir. Les principales difficultés constatées sont l'accompagnement d'un acteur natif, la compatibilité des marqueurs de présentation avec les validateurs SQL historiques, la protection des médias narratifs et les transitions entre régions.

Pour les Jours 13–24, **aucune implémentation n'est commencée**. Sans audit autorisé de leurs cahiers et sans mesurer les futures animations, prévoir une fourchette de **35 à 65 heures de travail**, plus **8 à 16 heures de recette/configuration distante** : intégration et tests des épisodes, ressources réellement manquantes, continuité et conclusion. Incertitude élevée ; prévoir 20 à 30 % de marge pour les retours et les problèmes d'infrastructure. Il ne s'agit pas d'un engagement de livraison ni d'une raison de réduire les énigmes.

Après accord sur le Lot B, une cadence possible est : 19–22 novembre pour un prochain lot autorisé, 23–26 pour la suite autorisée et la conclusion, 27–28 pour la recette canonique transversale, 29 pour les corrections, 30 pour la recette de lancement. Une nouvelle autorisation est nécessaire avant d'entamer chaque périmètre. La préparation Supabase/VPS doit être planifiée assez tôt sur staging ; ne pas reporter les invitations, Storage privé, dates Paris, HTTPS et restauration de sauvegarde au soir du 30. Aucun de ces contrôles distants n'est acquis par les tests locaux.


## Actualisation Lot C — 19 novembre 2026

Les Lots A et B sont validés artistiquement. Le Lot C est implémenté sur sa branche dédiée, depuis le Lot B ; sa recette exacte et ses réserves sont livrées séparément. Les estimations historiques ci-dessus ne constituent plus l’état d’avancement courant.

Après validation du Lot C, prévoir pour les Jours 17–24 et la conclusion **24 à 45 heures de production/test**, puis **8 à 16 heures de recette de lancement et configuration distante**, avec 20–30 % de marge. Incertitude élevée : ces cahiers ne sont pas développés dans le Lot C ; les besoins en ressources, les retours artistiques et l’accès au staging peuvent déplacer la charge. Ce ne sont pas des heures garanties déduites de la seule vitesse de génération.

| Date cible | Périmètre soumis à autorisation | Priorité |
|---|---|---|
| 19–20 novembre | Validation Lot C et audit du prochain lot | P0 |
| 20–25 novembre | Épisodes restants et conclusion, par lots autorisés | P0 |
| 26–27 novembre | Chaîne canonique complète, reprise, compatibilité et confidentialité | P0 |
| 28–29 novembre | Staging réel autorisé : invitations, Storage, dates Paris, HTTPS, restauration | P0 |
| 30 novembre | Corrections bloquantes, sauvegarde et accord explicite d’ouverture | P0 |

P1 : retours narratifs et visuels, confort mobile et conclusion. P2 : nouvelles animations spécialisées, voix/musiques non fournies, décorations secondaires. Réduire les ajouts facultatifs avant de sacrifier une énigme, une sauvegarde ou un contrôle d’accès. Aucun test local ne dispense de la validation distante avant l’ouverture privée du 1er décembre.
