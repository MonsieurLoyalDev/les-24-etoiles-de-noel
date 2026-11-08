# Originaux D.3.1

Les 24 PNG du dossier `originals` sont les sorties retenues de l'outil intégré `image_gen`, copiées sans retouche. Ils restent hors des ressources chargées par le jeu et hors du bundle Vite.

Les textures utilisées sont les exports natifs de `public/assets/interiors-d31`, produits par `npx tsx scripts/prepare-d31-assets.ts`. Le script conserve les proportions, utilise un échantillonnage au plus proche, recadre les découpes à l'alpha et ajoute une marge transparente. Aucun nouveau dessin n'est produit par ce pipeline.

Les dimensions, poids et SHA-256 des deux versions figurent dans [l'inventaire](../graphismes/INVENTAIRE-D31.json). Les prompts exacts : [neige et architecture](../graphismes/D31-GENERATION.md), [mobilier](../graphismes/D31-MOBILIER-PROMPTS.md), [décoration](../graphismes/D31-DECORATIONS-PROMPTS.md).

Les trois premiers essais d'architecture rejetés ne sont pas intégrés au projet. Les personnages, bâtiments extérieurs, végétation et terrain D.3 validés n'ont pas été remplacés.
