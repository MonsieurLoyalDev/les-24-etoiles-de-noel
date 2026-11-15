# E.0 — Narration et immersion

Référence `7001466`, 15 novembre 2026. Audit du code, sans écriture de souvenirs personnels ni nouveau développement.

## Ce que le moteur permet réellement

| Besoin | Implémentation observée | Ce qui manque / décision |
|---|---|---|
| Dialogues à choix multiples | `rpg/dialogue.ts` : graphes, conditions flags/objets/quêtes, effets, historique ; UI de choix existante | Réutiliser ces graphes plutôt que créer un second moteur |
| Conversations à plusieurs intervenants | Chaque nœud possède `speaker`, le graphe peut changer d'intervenant | Partiel : pas de réalisateur générique synchronisant plusieurs acteurs, déplacements, cadrages et réservations sociales |
| Quêtes en plusieurs étapes | `rpg/quests.ts`, événements talk/explore/find/solve/minigame/interact, objectifs ordonnés, récompense unique | Cinq quêtes village déclarées ; le calendrier possède sa propre chaîne d'étapes, non un lien générique bidirectionnel aux quêtes village |
| Événements déclenchés dans le village | Interactions RPG, cache-cache/chasse, final, événements d'objectifs, activités décoratives | Pas de moteur général de micro-événements spontanés datés ou de scènes sociales multi-acteurs |
| Évolution visuelle après mission | Sapin selon nombre d'étoiles, objets trouvés/flags et états décoratifs, réactions Loyal | Pas de schéma Day permettant librement de modifier n'importe quelle décoration après une journée ; cartes jardin/décoration restent UI |
| Récompenses persistantes | Étoiles village locales ; complétion/memory serveur pour Avent privé ; rejeu/version préservant la complétion | Récompense Day textuelle, pas un catalogue de récompenses matérielles ni un mécanisme d'achat/envoi |
| Debby et Loyal | Suivi du compagnon, dialogue, réactions graphiques ; cache-cache et final | Réutilisables ; pas de nouveau scénario personnel fourni |
| Flocon | Renard existant conservé, sprite d'attente et étiquette dans `Game.renderRoom()` | Présence décorative : pas de cible de dialogue/quête ou de routine générique trouvée, ni participation aux quatre répliques du final |
| Routines et dialogues contextuels | `world/registry.ts`, `runtime.ts`, profils Augustin/Émile/Célestine, quatre créneaux fictifs et salutations contextuelles | Pas de nouvelles personnes permanentes intégrées à partir du catalogue proposé ; pas de calendrier social sur 24 jours |
| Activités physiques | D.4.2 : lecture, rangement, assise, courrier, lanternes, interruptions et reprise | À recetter dans l'artefact privé corrigé ; aucun système postal réel |
| Jours 6, 12, 18 | Activités jouables : raisons, bon, mémoire | Absence de scènes spéciales dédiées ; possibilité de composer des étapes existantes et textes, sans réécrire le moteur |
| Jour 24 | `Game.startFinal/finalLine` : retour village, quatre répliques, réactions, sapin 24, message Day, rejeu | Final de démonstration court ; seule la dernière réplique se personnalise par `scene.text` ; les trois premières sont codées |

## Identités à protéger

Debby et Loyal sont humains. Les habitants existants Augustin (`noe`), Célestine (`mira`), Basile (`oscar`), Madeleine (`alma`) et Émile (`emile`) ont leurs apparences validées ; Flocon est le petit renard. Les identifiants historiques restent utiles aux quêtes et sauvegardes. Ne pas appliquer rétroactivement la proposition de PNJ anthropomorphes aux habitants humains existants.

Le code utilise Augustin, pas « Augustine ». Le catalogue de nouveaux habitants reste un document de proposition, pas une preuve de présence. Les routines complètes D.4.1 portent sur trois habitants ; les autres personnages ne sont pas supprimés pour autant.

## Cohérence de progression et immersion

Deux couches coexistent : découverte/mini-jeux/étoiles A-B d'une part, surprises datées C d'autre part. Le journal village présente une grille de 24 emplacements mais seules cinq quêtes y sont définies ; le vrai Avent est dans `AdventHub`. Le HUD et le sapin affichent le maximum entre étoiles village et étoiles Avent. L'aperçu admin est bien séparé en base, mais sa sélection est également projetée visuellement sur le sapin courant. Cela ne donne pas d'étoiles réelles au joueur ; cela mérite une distinction claire lors de la recette.

La reprise de l'Avent ne reconstitue pas une « mémoire du couple » riche : le journal exporte surtout les identifiants et valeurs des étapes. Les cartes découvertes sont du contenu de journée ; les réponses/rédactions constituent le souvenir enregistré. Un rejeu terminé remplace le dernier souvenir de cette journée ; ce n'est pas un historique illimité de toutes les relectures.

Exemples de décalages constatés : la quête de la première lumière et certains dialogues/panneaux parlent encore d'une maison au sud-est, alors que le texte principal mentionne le sud-ouest ; le panneau annonce encore « le vrai calendrier de décembre viendra plus tard » ; le bon généré conserve un libellé demo dans le composant. Ces chaînes héritées sont aussi présentes dans le jeu privé, distinctes du paquet de 24 contenus demo retiré du build. Ce sont des corrections ciblées à prévoir, pas une raison de refaire la carte ou les interfaces.

## Personnalisation réaliste

Réutiliser l'éditeur privé pour titres, lettres, raisons, choix, quiz, énigmes, recettes, transcriptions et message final. Les listes, graphes et règles se modifient en JSON. La personne responsable doit fournir et valider les vrais souvenirs ; l'audit n'en invente aucun.

Les limites à accepter ou étendre sont explicites : commandes d'emballage et symboles mémoire non pilotés par Day ; notes limitées à do/mi/sol ; chasses à trois positions existantes ; absence de séquence générale orchestrant PNJ/Flocon/caméra par données. Une personnalisation narrative ne nécessite pas automatiquement un nouveau type d'activité.

Réserve de jouabilité relevée dans `Task.tsx` et les styles : jour 20 demande un ordre numéroté mais les étoiles affichent leurs noms, sans numéros ou segments reliés. L'ordre peut être soumis et validé techniquement ; il n'est pas clairement indiqué à la joueuse. Les tests injectent les réponses demo attendues et ne remplacent pas une recette de compréhension. Clarifier consignes/indices dans les contenus privés avant de considérer les journées éditorialement terminées.

## Priorités

- **P0 :** 24 définitions privées cohérentes et gagnables, textes sans promesses de fonctionnalités absentes, média jour 10 valide, règles et récompenses conservées lors des éditions.
- **P1 :** clarifier les deux journaux/compteurs, enlever les libellés demo du parcours personnel, améliorer les transitions narratives ; personnaliser la conclusion et, si le temps le permet, les jalons 6/12/18 avec les outils existants.
- **P2 :** foule finale chorégraphiée, nouveaux habitants, nouvelles activités physiques de métier, nouveaux systèmes sociaux ou décoration supplémentaire.

Une cérémonie plus riche pourrait réutiliser le système de scènes actuel et les réactions existantes, avec un petit séquenceur ciblé si indispensable. Son cahier des charges doit préciser les participants, les répliques et le rejeu avant développement. Aucun nouveau moteur ni scène n'a été développé en E.0.

Attention au type `scene` : son branchement actuel dans `Hub.tsx` appelle toujours `Game.startFinal()` et la preuve attendue est quatre répliques. Il n'est pas un réalisateur générique réutilisable tel quel pour les jours 6/12/18 ; le placer dans ces journées lancerait la mise en scène du final et son sapin à 24. Réutiliser d'abord les graphes de dialogue et activités existants ; isoler un éventuel pont de mise en scène ciblé plutôt que détourner ce type.
