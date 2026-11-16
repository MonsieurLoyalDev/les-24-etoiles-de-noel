# Lot A — état de production

Audit préalable effectué sur E.2.1, rapports E.1/E.2/E.2.1 lus et source narrative privée accessible. Les cinq cahiers sont extraits et lus, les besoins recensés avant développement. Aucun dialogue original ni solution privée dans ce document.

Écarts bloquants initiaux : présentation encore spécifique au Jour 1, brouillons d'activités non raccordés à l'épisode, conséquences inter-journées non fournies par la session serveur, lieux et personnage requis absents. Prévoir des extensions additives et des validations SQL correspondantes, sans second moteur de dialogue/quête/sauvegarde.

## Périmètre livré pour recette

Branche `feature/production-days-02-06`, depuis `f862d317e604e69ea4176f81b698156a662a3022`. Commit d'implémentation `ee6829a` ; les rapports sont livrés dans le commit documentaire suivant. Les cinq scénarios versionnés sont conservés hors dépôt, avec la source extraite, la matrice d'intégration et les empreintes SHA-256. Le contrôle de fidélité retrouve les 311 répliques explicitement attribuées aux personnages ; seuls les espaces de mise en page sont normalisés. Cela ne signifie pas que toutes les intentions d'animation du cahier sont dessinées.

L'inventaire exact est dans [FICHIERS-LOT-A.md](FICHIERS-LOT-A.md). Les résultats par commande sont dans [RECETTE-PC.md](RECETTE-PC.md) et les étapes distantes à effectuer après accord dans [DEPLOIEMENT-PRIVE.md](DEPLOIEMENT-PRIVE.md).

Les cinq parcours principaux, leurs activités, choix, restaurations et épilogues facultatifs sont intégrés. Les activités comprennent connexion de conduits, association, ordre, séquence, sélection et préparation en plusieurs étapes. Elles demandent des actions réelles, sauvegardent leur brouillon et font contrôler leur résultat côté serveur. Les gestes sans images dédiées restent signalés comme adaptations, pas comme animations définitives. La validation artistique du créateur reste requise avant le Lot B.

## Architecture et préservation

- `flow.ts`, `FlowTask.tsx`, `FlowPresentation.ts` et `flow-bindings.ts` ajoutent une présentation déclarative aux objectifs, choix, dialogues et checkpoints existants. Aucun deuxième moteur de progression ou calendrier.
- `Director`, `Hub`, `script`, `engine`, `api`, `bridge` et `context` raccordent les reprises, les conséquences autorisées et la consultation cumulative du Livre. Une activité facultative ne bloque pas le lendemain et ne réattribue pas une étoile.
- `areas.ts` ajoute deux espaces minimaux, avec portails et sorties sûres. La carte extérieure et les quatre intérieurs validés ne sont pas reconstruits. L'un des espaces réutilise l'architecture et le mobilier existants ; son identité visuelle reste une réserve.
- `world/lanterns` et `art/ambience` utilisent le coordinateur lumineux existant. Les routines ordinaires sont suspendues uniquement pour les acteurs réservés à une scène puis libérées.
- La migration additive `202611160003_production_activities.sql` conserve les versions précédentes, valide les brouillons/résultats et fournit les pages/conséquences uniquement après contrôle d'identité et de date. L'aperçu administrateur indépendant reste séparé de la partie canonique et de la relecture.
- Sept PNG génériques (2 068 518 octets) rejoignent la liste blanche du build privé. Aucun texte de scénario ou solution n'est dessiné dans les ressources publiques.

Les modifications additives aux types de pièces, au Livre et au rendu des espaces supplémentaires sont recensées par `PRESERVATION-LOT-A.json`. Les tests historiques de géométrie et d'empreintes restent actifs. Le format de sauvegarde village version 2 n'est pas remplacé ; les champs narratifs supplémentaires sont compatibles avec l'absence de données dans les anciennes sauvegardes.

## Défauts reproduits et corrigés pendant la recette

- La reprise canonique pouvait utiliser une ancienne liste React de prérequis : le démarrage charge maintenant le statut serveur frais.
- Deux lancements concurrents pouvaient recréer le directeur : garde de lancement par génération.
- Une restauration pouvait valider l'objectif avant son effet visuel, ou rester suspendue par sa propre pause : validation à la fin de l'effet, reprise sérialisée et idempotente.
- Les rechargements pouvaient doubler les décorations/acteurs temporaires : nettoyage explicite avant reconstruction.
- La texture de neige d'une région supplémentaire avait été libérée par l'initialisation du village : utilisation d'une texture validée effectivement préchargée, contrôlée dans le jeu.
- Des alias SQL ambigus empêchaient les nouvelles validations : corrigés puis rejoués sur les vrais RPC dans PostgreSQL embarqué.
- Un habitant en déplacement pouvait s'éloigner pendant l'approche : arrêt de courtoisie près du point de scène. Les tests vérifient aussi le libellé visible avant de déclencher une interaction.
- Le meuble combinant fond et comptoir masquait le nouvel acteur : projection du buste et premier plan du meuble, sans modification de collision.

## Vérifications exécutées

TypeScript, lint et 258 tests automatisés passent ; deux tests POSIX sont ignorés sous Windows. Le test additionnel avec les six scénarios originaux passe sur PostgreSQL embarqué : vrais RPC, prérequis, pages antérieures, six restaurations et refus de la journée suivante. Il ne remplace pas une recette Supabase distante.

Le build privé passe avec 235 ressources vérifiées, octets identiques et paquet de démonstration exclu. Les avertissements historiques restent : attribut d'import JSON incohérent, références CSS résolues à l'exécution après copie contrôlée et gros bundles Vite. Les contrôles navigateur complémentaires et leurs nombres finaux sont consignés dans `RECETTE-PC.md` après exécution.

Les parcours utilisent le véritable build privé, une fixture Auth/RPC stricte et les contenus reçus hors Git. Les déplacements sont exécutés par les contrôles du jeu ; les résolutions passent par les interfaces. Les prérequis des recettes canoniques sont établis via les vrais réducteurs et RPC, sans insertion directe d'étoiles dans les tables.

## Performances et limites

Échantillons locaux de 120 frames : médianes entre 4,2 et 16,7 ms, p95 entre 4,2 et 16,8 ms sur Chromium/Canvas selon la cadence de rafraîchissement du poste. Ce petit échantillon après parcours n'est ni une mesure exhaustive GPU/mémoire ni un benchmark de téléphone physique ; il ne démontre pas un débit identique sur un autre appareil. Aucune validation Safari iOS, Supabase réel, CAPTCHA distant, HTTPS ou VPS annoncée.

Les réserves privées décrivent précisément les répliques de branches non écrites dans le PDF, les activités spécialisées sans sprites dessinés, la réutilisation de mobilier, les poses de repos du personnage supplémentaire et l'absence de son licencié fourni. Aucun texte personnel n'est inventé pour combler ces manques. La constellation repose sur les étoiles existantes et uniquement sur la progression confirmée ; un aperçu isolé n'invente pas cinq récompenses précédentes.

Les lots B/C ne sont pas implémentés. Aucun merge, déploiement, changement de visibilité du dépôt ou opération sur le VPS/Supabase réel. La livraison technique doit être examinée avec la galerie privée et ses réserves avant de considérer le Lot A artistiquement validé.
