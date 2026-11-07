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
Cycle existant aurore/jour/crépuscule/nuit conservé, neige légère (36 particules maximum), halo des lanternes réduit et fumée de cheminée (12 formes réutilisées, aucun objet créé par frame). Neige et fumée respectent la réduction des animations du système. Aucun halo ajouté aux personnages, notamment Flocon. Vérification TypeScript et navigateur PC/mobile.

## D4 — Personnages
Sprites marche/attente fournis pour les huit personnages. Loyal utilise le profil V19.1 (miroir à gauche) et V9 pour face/dos/attente ; Augustin utilise l'attente V5. Les lunettes et tenues sont celles des images, sans surimpression de visage. Animations 6 FPS, profil 10 FPS, attente 2 FPS ; alignement au sol constant et profondeur selon les pieds. Émile et Flocon restent purement visuels. Les quatre animations de couple et les huit réactions de Debby sont reliées aux dialogues/interactions existants, chargées à la demande, sans effet sur les quêtes ; elles s'arrêtent dès la reprise de la marche. Aucun personnage redessiné. TypeScript et deux tests navigateur PC/mobile réussis.

Limites source conservées : poses répétées de Debby, contours de Madeleine issus d'un détourage blanc, limites biomécaniques du profil de Loyal et effets parfois coupés des réactions. Ces défauts ne sont pas corrigés par génération de nouveaux dessins.

## D5 — HUD et dialogues
HUD V3 avec titre dynamique Étoilebois, date Europe/Paris, compteur, calendrier, journal/souvenirs et paramètres. Dialogue narratif à portrait correspondant au locuteur et expression choisie selon la réplique, 0–4 réponses séparées et bouton Continuer. Aucun dialogue affiché pendant la promenade. Les 32 portraits sont disponibles ; pas de portrait attribué à tort au narrateur ou aux objets. Texte HTML dynamique, aucune inscription ajoutée aux textures. Écran PC/mobile inspecté et deux tests navigateur réussis.

Marcellus et Nunito proviennent de Google Fonts (fonts.googleapis.com / fonts.gstatic.com), sont hébergées localement et accompagnées de leurs licences SIL OFL officielles issues de github.com/google/fonts (ofl/marcellus et ofl/nunito). Aucun appel externe de police pendant le jeu. La liste des fichiers publics et le validateur d'artefact autorisent uniquement les fichiers de police TTF ajoutés.

Défauts graphiques source : le PNG de dialogue narratif présente une jonction verticale et un fragment doré dans son angle supérieur droit ; certains autres éléments HUD ont des pixels résiduels sur leurs bords. Ils restent visibles, sans retouche ni fond artificiel. Le portrait est aligné en bas du médaillon, sans cacher son détourage par un aplat.

## D6 — Sapin et calendrier
Sapin V11.4 à 25 états (0–24) et calendrier V12.0 avec exactement 24 boutons indépendants aux positions fournies. Le sapin évolue selon les étoiles gagnées, le final utilise l'état 24 et reste rejouable. Les cercles lumineux de remplacement ont été retirés du sapin. Les jours futurs sont toujours bloqués par l'API existante ; aucune logique de date du HTML de démonstration fourni n'a été copiée. Le fond graphique est public, pas les contenus de surprises. Sur téléphone, le panneau du sapin défile horizontalement pour garder des cibles tactiles de 46 px.

Une régression de clic entre étoiles adjacentes a été détectée puis corrigée : les ornements ne capturent plus les événements des boutons voisins. Un test parcourt les 24 sélections sur PC et mobile. Le fond fourni conserve une étoile et des guirlandes déjà lumineuses : un halo du sommet subsiste en état verrouillé, limite signalée par le pack.

## D7 — Transitions
Fondu court de caméra (180 ms) à l'entrée des bâtiments/zones existants ; apparition de dialogue, journal, calendrier et paramètres en 150 ms. Les commandes et la temporisation anti-double-portail existantes restent inchangées. Pas de nouvel écran ou déplacement forcé. Animations d'interface désactivées avec prefers-reduced-motion. L'illumination du sapin final est accompagnée d'une pulsation douce, sans modifier la progression.

## D8 — Audio
Points d'insertion pas/vent/cheminée/clic/étoile reliés, avec arrêt des boucles au changement de pièce et réglages volume/muet séparés de la sauvegarde RPG. Aucun son autorisé n'est fourni : tous les emplacements restent silencieux et le panneau l'indique. Aucune synthèse ni ressource externe ajoutée. Voir AUDIO.md pour les cinq sons manquants et leur intégration future. TypeScript vérifié ; préférences et stockage vérifiés en D9.

## D9 — Vérification
À réaliser. Ne pas assimiler les défauts connus des sources à une validation artistique finale.
