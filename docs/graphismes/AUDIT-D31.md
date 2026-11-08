# Audit initial D.3.1 — 0.7.0 comme seule base

Base exacte : commit `186367cfb396aa52bf30d2e15bcbc40ff8751c47`, correspondant à l'archive `etoilebois-phase-d3-village-vivant.zip`, SHA-256 `AAE5A578AE710E3B310D0DAF17A7EA584EFE0739CEE7B645C1B44A5403D2177A`. Le checkout est propre au départ. Branche de travail : `feature/phase-d3-1-edition-artistique`.

## Ressources et limites identifiées

- Extérieurs, végétation, terrain D.3 et personnages disponibles et conservés. Aucun mobilier intérieur détaillé dans le catalogue. Les objets bruts `gift`, `logs`, `campfire` et les rectangles actuellement utilisés dans les pièces sont des prototypes, pas une collection de mobilier validée.
- Les quatre intérieurs mesurent 480 × 352. Le même jeu de collisions définit les murs et trois emprises : `(50,50,90,45)`, `(200,100,80,38)` et `(350,70,70,50)`. Aucune modification de ces rectangles, des chemins des PNJ, des sorties ou des interactions n'est prévue.
- L'interaction centrale reste en `(240,143)`, la sortie en `(240,315)`, les objets secondaires près de `(385,139)` et `(370,255)`, et l'ancre calendrier en `(300,270)`. Les apparitions et les couloirs doivent rester dégagés.
- Le sapin charge déjà l'atlas exact `sapin_atlas-Etoilebois_Sapin_V11_4`, et utilise ses images `sapin_00` à `sapin_24` selon la progression. Une image `quest_star` distincte est ajoutée en `(512,304)` : c'est cette seule surimpression qui sera retirée. Les marqueurs de chasse aux petits bonheurs ailleurs dans le village et la progression de l'atlas restent légitimes.
- La neige blanche est composée avant les 24 nappes D.3 et les 14 détails. Les nuances supplémentaires seront appliquées à cette sous-couche seulement ; les PNG, coordonnées, dimensions et ordre des couches D.3 seront conservés.

## Plan artistique et ordre

A. Retirer l'image superposée au sapin, garder l'atlas et son animation légitime.

B. Créer quelques matières de neige douce compatibles et les fondre dans la sous-couche blanche, sans repeindre les plaques D.3.

C. Installer une architecture bois/parquet/fenêtres différente pour chaque pièce, avec une perspective RPG cohérente.

D. Créer des ensembles de mobilier détaillés adaptés aux trois emprises existantes. Les éléments hauts et solides s'inscrivent dans ces emprises ou dans les murs, plutôt que de créer des obstacles décoratifs sans collision. Les tapis et documents posés au sol restent franchissables.

E. Ajouter les détails narratifs dans ces ensembles et des couches plates : tasses, lettres, cadres, livres, rubans, outils et textiles. Les pièces gardent leur personnalité : foyer, refuge des histoires, fabrication artisanale, convivialité.

F. Appliquer un éclairage intérieur mesuré, sur la même horloge et les réglages D.3, sans météo extérieure dans les pièces.

G. Contrôler le cadrage, les pieds de meubles, les transparences, la taille des pixels et la circulation.

H. Comparer les captures D.3/D.3.1, contrôler les invariants et exécuter lint, TypeScript, builds, tests unitaires et parcours navigateur historiques PC/mobile.

Les créations raster utiliseront l'outil intégré `image_gen`, une création distincte par ressource, avec références de style validées et prompts conservés. Il ne sera pas utilisé de planche de référence comme meuble, ni de scène entière servant de faux intérieur interactif.
