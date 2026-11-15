# D.4.2 — Ressources complémentaires

Trois feuilles RGBA de 1254 × 1254, seize poses chacune, sont ajoutées dans `public/assets/activities-d42/`. Les JSON d’atlas et d’ancrages sont dans `src/world/pose-*.json`. Aucun atlas d’origine n’est remplacé.

| Feuille | Poses dessinées |
|---|---|
| Célestine | Prendre et ouvrir un livre, lire, tourner une page, refermer ; lever/ranger un ouvrage de dos ; s’abaisser, lire assise, tourner une page sur les genoux et se redresser |
| Émile | Ouvrir la sacoche, sortir et tendre une enveloppe, libérer la lettre et fermer le sac ; consulter un courrier de face ; saluer et réchauffer les mains |
| Augustin | Inspection et allumage accroupi d’une lanterne de sol ; retrait de l’outil et redressement ; extinction avec éteignoir ; mains réchauffées et salut |

Les feuilles ont été créées avec imagegen à partir des vues canoniques des personnages humains validés. La première proposition d’Augustin destinée à un lampadaire haut a été écartée : elle ne convenait pas aux lanternes de sol réellement présentes. Elle n’est pas chargée par le jeu.

Livres, enveloppes, sacoche et outils sont dessinés dans les poses, avec une profondeur cohérente. Leur état de séquence ne crée ni inventaire postal, ni quête, ni récompense. Les mains sont réellement redessinées ; les activités ne sont pas une translation ou une variation d’opacité de la pose debout.

Les silhouettes, vêtements, lunettes et couleurs d’origine restent la référence artistique. Ces feuilles complémentaires sont proposées à validation, pas déclarées approuvées. Certaines poses disponibles restent en réserve : le salut d’Augustin et le réchauffement d’Émile ne sont pas déclenchés dans leurs routines actuelles. Un sursaut spécialisé n’est pas livré ; les repos, marches et retournements réutilisent les animations canoniques.

Les tests inspectent les pixels transparents, les cellules, les ancrages et les images utilisées. La galerie permet de juger le résultat dans le jeu à l’échelle réelle. Les références, essais rejetés, dépendances de préparation et anciens packs ne sont pas inclus dans la livraison de validation.
