# Étoilebois — D.2.2, version 0.6.2

Base conservée : D.2.1, commit `89f3640defdce21b39d7d1999c2342805fb92d07`. Branche : `feature/phase-d2-2-finitions`. Aucun travail D.3, nouvelle mission, fusion automatique ou déploiement.

## Végétation réellement diversifiée

Les trois PNG D.2.1 sont conservés intacts. Sept créations isolées transparentes les complètent : quatre sapins et trois arbustes. Les références sont les sprites D.2.1 et la bibliothèque validée, jamais une planche utilisée comme atlas. [Prompts exacts et méthode imagegen intégrée](D22-GENERATION.md).

| Silhouette | Instances dans le village |
| --- | ---: |
| Sapin classique D.2.1 | 7 |
| Sapin élancé | 5 |
| Sapin large | 8 |
| Jeune sapin ouvert | 6 |
| Sapin courbé | 4 |
| Arbuste arrondi D.2.1 | 5 |
| Arbuste à baies D.2.1 | 2 |
| Arbuste bas, peu enneigé | 13 |
| Arbuste à double couronne enneigée | 6 |
| Arbuste étalé à baies | 7 |

Les cinq sapins sont des silhouettes distinctes, au-delà des miroirs et variations d'échelle. La sélection dépend des coordonnées, reste stable après fermeture/reprise et ne consomme aucun état sauvegardé. Les pieds des 30 arbres restent à leur position d'origine. La hauteur est limitée à 128 unités et ajustée près des bords pour conserver les sommets dans le monde. Petits, moyens et grands arbres coexistent sans étirer artificiellement les sprites.

Douze arbustes bas supplémentaires forment six petits groupes irréguliers autour de la place. Les textures, quantités de neige, baies et proportions varient. Les buissons les plus petits ont été agrandis après le premier contrôle pour rester identifiables à l'échelle du jeu. Aucun cercle ou rectangle coloré ne remplace un végétal.

[Présentation des dix silhouettes](vegetation-d22.html) · [Inventaire, SHA-256, tailles et chaque placement](INVENTAIRE-D22.json).

## Neige et place centrale

Les quatre textures subtiles fournies en D.2.1 restent utilisées. Cinq grandes modulations de blanc, bleu pâle et lavande complètent le fond, à faible opacité, sans bruit aléatoire par frame. Les chemins conservent leurs matériaux et tracés ; une fine transition claire de 1 à 3 unités adoucit leur bord. Les anciennes corrections de neige et de raccords restent actives.

Trois petites séries de pas fixes rejoignent les quatre précédentes dans les zones fréquentées. De petites accumulations irrégulières complètent les pieds des nouveaux arbustes et les abords du sapin central. Les ombres douces D.2.1 sont conservées. Tout est composé une fois dans le sol 1024 × 768, puis mis en cache ; aucune nouvelle météo ni animation d'ambiance.

Les six groupes enrichissent les abords plutôt que l'axe de passage. Les portes, le devant du sapin, l'ancrage du calendrier, les objets interactifs et la patrouille d'Augustin restent dégagés. Les nouveaux arbustes sont ornementaux et n'ajoutent aucun collider. Les 77 ornements D.2 restent en place ; le total devient 89, en complément des objets physiques historiques.

## Étiquettes et éléments conservés

Les plaques des noms sont réduites uniformément de **12,5 %**, texte et cadre compris. Bois sombre, cuivre, texte dynamique, noms, masquage pendant les dialogues et suivi après mise à jour caméra sont conservés. Le placement utilise les dimensions réellement affichées après réduction, pour garder les plaques centrées, éviter les visages et respecter les bords du champ.

Les enseignes de bâtiments restent à leur taille D.2.1. Le HUD principal, les dialogues, personnages, façades, sapin central à 24 étoiles, mini-jeux et calendrier ne sont pas remplacés ou redessinés.

## Validation et preuves

[Audit des 165 fichiers protégés inchangés](INVARIANTS-D22.json) : ressources antérieures, cartes, personnages, données et systèmes des journées, dialogues, HUD, sauvegardes, mini-jeux et migrations contrôlés. Dans `Game.ts`, le seul changement est l'ajout des coordonnées à la sélection de texture des arbres : une comparaison vérifie que le reste du fichier est identique à D.2.1.

- Lint et TypeScript : réussis.
- Tests unitaires : **136 réussis, 2 ignorés** sous Windows (contrôles POSIX), 13 fichiers.
- Première passe navigateur D.2.2 : **9 réussis, 1 ignoré**, avant les derniers réglages de proportions.
- Suite navigateur complète de la version finale : **46 réussis, 8 ignorés** selon le format, 54 cas en 9,4 minutes. Aucun échec.
- Builds E2E, privé et normal : réussis. Le contrôle privé confirme l'exclusion des modules et médias de surprises de démonstration.

Les nouveaux contrôles vérifient que les cinq sapins sont effectivement répartis, que les sept PNG sont distincts avec canal alpha et autorisés dans le build privé, et que les douze bases ornementales évitent colliders et réserves d'interaction. Les contrôles D.2.1 restent valides pour les trois sprites conservés ; D.2.2 contrôle les dix textures. Les tests navigateur couvrent noms masqués, stabilité après déplacement, huit identités, bords d'écran, quatre façades et présentation des variantes. La suite historique vérifie aussi les quatre intérieurs, quêtes, mini-jeux, reprise et 24 activités.

## Captures et limites

[Comparatif D.2.1 / D.2.2](comparatif-d22.html), PC 1280 × 800, mobile tactile simulé 390 × 844, façades PC 1280 × 1000 et vue globale 2048 × 1634. Les captures « avant » sont des copies intactes de la livraison D.2.1. Les vues positionnées utilisent uniquement des sauvegardes de test ; elles n'ajoutent pas de téléportation au jeu. Les sprites sont également présentés sur damier dans une page documentaire séparée.

Les 21 captures « avant » sont vérifiées identiques octet par octet aux originales D.2.1. Les 22 captures « après », dont la planche documentaire, proviennent des tests de cette livraison. Les captures historiques des autres phases ont été préservées après exécution des tests.

Le contrôle visuel porte sur silhouettes, palette, transparence, contours, lisibilité et raccords dans les captures. Les nouveaux PNG représentent 7 141 130 octets avant compression HTTP. Les copies de rendu sont limitées à 256 pixels et mises en cache. Les essais mobiles ne remplacent pas un essai sur téléphone physique ; aucune cadence matérielle universelle n'est revendiquée. Le chunk Phaser conserve son avertissement de taille.

Les façades de mairie, boulangerie et poste restent absentes du pack ; aucun lieu ou accès n'est inventé. Les nouvelles silhouettes sont proposées à la validation artistique de cette D.2.2. D.3 n'est pas commencée.

## Fichiers modifiés et reproduction

- `vegetation-design.ts`, `vegetation.ts`, `world.ts` : variantes, sélection stable, dimensions et groupes.
- `snow-detail.ts`, `landscape.ts` : modulations, traces et transitions mises en cache.
- `tags.ts` : réduction des plaques et utilisation des dimensions affichées.
- `src/game/Game.ts` : coordonnées de sélection de texture, sans changement mécanique.
- `ops/public-assets.json` : sept nouveaux PNG explicitement autorisés.
- Tests D.2.2, documentation, captures, inventaires et présentation des sprites.
- `package.json` et lockfile : version 0.6.2, aucune nouvelle dépendance.

Commandes : `npm ci`, `npm run lint`, `npm test`, `npm run build:private`, `npm run build:e2e`, puis `ETB_E2E_BUILT=1 npx playwright test` (PowerShell : `$env:ETB_E2E_BUILT='1'`). `npm run build` génère la version normale ; `npm run dev` permet l'exploration locale.
