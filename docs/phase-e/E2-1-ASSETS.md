# E.2.1 — Ressources de présentation

Création avec la compétence `imagegen`, outil intégré, à partir des atlas validés de Debby, Loyal et Flocon. Aucun téléchargement, musique externe, modèle générique ou texte personnel. Les images originales de génération restent dans le workspace, hors livraison source légère. Seules les trois planches effectivement chargées sont dans `public/assets/narrative-polish`.

| Planche | Frames distinctes | Usage |
|---|---:|---|
| `human.png` | 8 | 4 étapes de mains jointes ; 4 étapes d'étreinte réelle |
| `seats.png` | 8 | 4 poses assises sur un banc existant ; 4 poses d'ajustement des lunettes |
| `fox.png` | 8 | 4 poses de sommeil en boule ; 4 poses assises, clignement, attention et joie |

Chaque PNG mesure 1024×512, huit cellules RGBA 256×256, bords transparents. Les jeux de quatre frames de couple sont lus puis parcourus en sens inverse pour le retour, durée normale 3,2 secondes. Réduction des mouvements : pose fixe 0,5 seconde. L'assise est une pose réellement dessinée ; les transitions physiques debout→assis→debout ne disposent pas de frames dédiées et restent à améliorer. Les phases d'approche ne modifient pas les corps de collision.

La marche et la course de Flocon réutilisent les directions existantes ; elles ne sont pas redessinées. Son sommeil démarre uniquement au repos, au coussin du chalet, hors interaction. Les réactions à la magie sont orchestrées, les attentes discrètes hors scènes prioritaires. Son étoile frontale, son écharpe et sa lanterne sont conservées.

## Prompts de création

Les contraintes communes des appels intégrés : « production pixel-art animation sprite sheet », transparence véritable, grille 4×2, huit silhouettes complètes, même échelle et ligne de pieds, marges, perspective et vêtements des références, pixels nets, aucun texte, halo, particule ou décor.

1. **Mains/câlin**, références Loyal V9 et Debby V3 : deux humains, lunettes rondes ; Loyal manteau noir à bordures cuivrées et fourrure crème, cheveux bruns ; Debby cape rouge à flocons, écharpe rouge et nœud dans les cheveux. Aucune queue ni oreille animale. Ligne 1 : bras au repos, avant-bras tendus, mains réellement jointes, sourire. Ligne 2 : bras ouverts, rapprochement, bras entourant épaules/taille, étreinte tenue.
2. **Flocon**, référence Flocon V4 : renard orange, museau et pointe de queue blancs, écharpe verte brodée or, petite lanterne et étoile dorée sur le front toujours visible. Ligne 1 : quatre poses couché en boule, yeux fermés, queue autour des pattes, mouvements discrets d'oreilles. Ligne 2 : assis attentif, clignement, découverte vers le haut, sourire avec variation de queue. Pas de simple écrasement du sprite debout.
3. **Assise/lunettes**, référence nouvelle planche humaine : ligne 1, quatre poses assises côte à côte sur un banc imaginaire, hanches posées, cuisses vers l'avant, genoux pliés, bottes pendantes ; aucun meuble dessiné dans la frame. Ligne 2, debout, main basse, main levée vers la monture, doigt sur la branche, main abaissée. Identités et vêtements inchangés.
4. **Correction de transparence de la troisième planche** : supprimer exclusivement le voile gris/crème extérieur, y compris les espaces entre bras et jambes, conserver huit poses, visages, lunettes, proportions et positions. La première sortie avec ce voile est refusée et n'est pas livrée au jeu.

## Préparation et contrôle

`scripts/prepare-polish-assets.py` découpe les cellules, supprime uniquement les poussières d'alpha 1–31 dans les marges, applique un redimensionnement au plus proche voisin et ajoute les marges communes. Il ne dessine pas de membres, ne change pas les couleurs et ne reconstruit pas une transparence opaque. La variante assise est corrigée par imagegen avant cette préparation. Métadonnées : `src/narrative/polish-assets.json`.

Les tests contrôlent 24 frames distinctes, limites, alpha des bordures, appartenance à la livraison privée et interruption sûre des poses. Le contrôle visuel final reste celui de la galerie du jeu, à soumettre à l'utilisateur ; « généré » et « validé artistiquement » ne sont pas synonymes.
