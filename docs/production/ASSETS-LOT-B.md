# Ressources du Lot B

Les ressources validées du village, de la neige D.3.1, des quatre intérieurs et des personnages existants restent conservées. Aucun média ou texte personnel n'est ajouté au dépôt.

Neuf PNG supplémentaires (3 475 622 octets au total) rejoignent la liste blanche `ops/public-assets.json` : `clockmaker`, `clock`, `music-box`, `gears`, `boat`, `blossom`, `lantern-off`, `lantern-on` et `lake`. L'atlas de personnage contient vingt cellules 256 × 256 : quatre directions de quatre frames de marche et quatre frames d'attente. Les activités spécialisées sans frames dédiées restent des adaptations déclarées dans le rapport privé.

Création avec l'outil intégré ImageGen, puis découpage et assemblage RGBA par `scripts/prepare-lot-b-assets.py`. Le script effectue des opérations techniques de cadrage et de packing en nearest-neighbour ; il ne redessine pas les sprites existants. Les originaux restent hors Git. Le script refuse de déposer le média narratif dans le checkout public.

Intentions des prompts :

- Personnage anthropomorphe hivernal de petite taille, tenue bois/lin/cuivre, lunettes et accessoires artisanaux, grille cohérente de vingt poses sur fond réellement transparent ; silhouette distincte des personnages existants.
- Petits objets isolés : horloge en bois, boîte artisanale, pièces mécaniques, barque enneigée, branche fleurie, lanterne éteinte et allumée ; contours nets et perspective compatible avec le jeu.
- Étendue d'eau hivernale organique avec rive enneigée et petit ponton, vue compatible avec le jeu, transparence hors rive, sans texte ni personnage.

Les sorties ont été inspectées, puis leur alpha et leurs dimensions contrôlés. Une première feuille de personnage conservant un fond pâle a été écartée au profit de la sortie transparente. Aucun halo permanent ou téléchargement de musique n'est ajouté. Les six points d'ambiance réutilisent le service audio existant et restent silencieux faute de fichiers autorisés fournis.

Un média lié à la narration est livré séparément et chargé depuis Storage privé après autorisation. Sa feuille originale n'est jamais publiée, même si elle contient d'autres objets génériques. Les ressources sont soumises à la recette artistique du créateur ; la réussite des tests de chargement ne remplace pas cette validation.
