# Analyse intégrale du ZIP

Archive : `etoilebois_integration_v1.zip` (3 078 792 octets). Aucun projet préexistant, aucun dossier `docs` et aucune dépendance applicative dans l’archive. Les deux documents présents sont conservés dans `docs/source`.

## Inventaire

- `PROMPT_CODEX.md` : périmètre Phase A, collisions et compagnon, quête, sauvegarde et tests.
- `README.md` : statut réel des ressources, consignes d’intégration et absence de sprites définitifs.
- `assets-manifest.json` : atlas 8 × 4 de 16 px ; 13 props 80 × 80, origine (0,5 ; 0,85) ; deux personnages 32 × 48 non animés ; planche de référence.
- Sol : `ground.png`, 32 frames. La carte emploie les frames 0, 1, 2 et 8.
- Props : logs, fence, lantern, bench, signpost, bush_snow, snowman, campfire, bush_berries, gift, pine_large, quest_star, pine_festive. Tous chargés ; seuls ceux placés par la carte sont affichés.
- Personnages : `debby_placeholder.png`, `loyal_placeholder.png`, silhouettes humaines temporaires.
- Référence : `place_lanternes_concept.png`, illustration composite, non utilisée comme spritesheet.
- `map_layout_preview.png` : aperçu graphique du plan, ressource d’analyse.
- `place-des-lanternes.json` : schéma 1, 64 × 48 cellules, 24 objets, quatre réservations de bâtiments. Spawn (32, 38). Maison de Loyal au sud-est, bibliothèque à l’ouest, auberge au nord, atelier au nord-est.

Chaque cellule de la carte est parsée et validée par test. Le manifeste et les PNG techniques sont conservés dans le projet. L’aperçu est conservé ici pour comparaison.

## Priorité des consignes

Les documents de l’archive sont des spécifications fournies pour analyse, pas une autorisation indépendante de publier ou de transmettre des données. La demande explicite de l’utilisateur fixe la stack, le caractère privé du dépôt et les personnages humains. Les renards et les mentions « sprites prêts jeu » de la planche composite ne remplacent pas ces contraintes.

## Écarts assumés

Les façades sont absentes. Les réservations deviennent des bâtiments en dessin Phaser provisoire et solide. L’intérieur est original et provisoire. Les silhouettes restent non animées ; les lunettes sont arrondies en surimpression par code. Aucun asset de personnage définitif n’est revendiqué. La quête est une démo ; les 23 futures surprises sont absentes.
