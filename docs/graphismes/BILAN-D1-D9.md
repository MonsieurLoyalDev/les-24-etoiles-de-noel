# Refonte graphique D1–D9

Cette phase poursuit le code existant (Phase C et préparation VPS), sur `feature/phase-d-graphismes`. Aucun déploiement n'est autorisé par cette demande. Les consignes du pack sont des documents de référence ; le périmètre demandé reste une refonte visuelle sans nouvelles missions ou mécaniques.

## Inventaire et arbitrages validés

Archive extraite : 630 fichiers, dont 486 PNG. Le manifeste annonce 627 fichiers de ressources ; les trois documents racine complètent ce total. L'inventaire JSON contient dimensions, taille, SHA256 et destination ou justification de non-utilisation pour chaque fichier.

Choix validés par l'utilisateur : Loyal V19.1 pour le profil, V9 pour attente/face/dos ; bâtiments V10 sans retouche ; Célestine remplace l'affichage de Mira, Basile celui d'Oscar, Madeleine celui d'Alma et Augustin celui de Noé. Identifiants de quêtes et sauvegardes conservés. Émile et Flocon sont des présences visuelles sans nouvelle quête.

## D1 — Village

Intégré : surfaces continues V7, façades V10 aux emplacements et entrées existants. Le pack contient quatre bâtiments autonomes (maison, bibliothèque, atelier, auberge), pas de mairie, boulangerie ou poste : aucune façade n'est inventée. Les intérieurs existants sont conservés ; aucun asset d'intérieur n'est fourni.

Défauts connus : les façades V10 contiennent des résidus gris semi-opaques ; leur utilisation sans retouche a été explicitement validée. Ils ne sont pas masqués par un fond ajouté. Le terrain V8 est une carte de démonstration, pas la topologie actuelle : elle n'est pas substituée à la carte jouable.

Vérification D1 : build TypeScript/Vite réussi, test navigateur desktop réussi et capture inspectée. Emplacements, collisions et entrées conservés ; façades visibles sans substitution du code de référence.

## D2 — Décorations
Lanternes, bancs, panneaux, cadeaux V11 et végétation du pack intégrés aux positions existantes, avec bonhomme de neige, jardinière, clôture et brasero aux bords de la place. Les décorations ajoutées ne bloquent aucun chemin et ne créent aucune interaction. Les découpes V11 peuvent conserver halos et fragments voisins, conformément à leur README.

## D3 — Ambiance
À réaliser.

## D4 — Personnages
À réaliser.

## D5 — HUD et dialogues
À réaliser.

## D6 — Sapin et calendrier
À réaliser.

## D7 — Transitions
À réaliser.

## D8 — Audio
À réaliser. Aucun son ni fichier de police n'est inclus dans le pack.

## D9 — Vérification
À réaliser. Ne pas assimiler les défauts connus des sources à une validation artistique finale.
