# Ressources provisoires et pipeline de remplacement

Les deux personnages sont humains. Conserver leurs lunettes rondes et leurs vêtements hivernaux. Le ZIP ne contient aucune planche de personnages humains validés permettant de restituer fidèlement toutes leurs particularités. Les silhouettes servent uniquement à rendre le jeu jouable.

| Ressource                  | Statut actuel                                            | À produire et valider                                            |
| -------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Sol et 13 props techniques | Intégrés à partir du pack                                | Harmonisation finale avec la planche                             |
| Debby et Loyal             | PNG 32 × 48 non animés + lunettes rondes en tracé Phaser | Sprites humains transparents, quatre directions, repos et marche |
| Quatre façades             | Volumes dessinés dans Phaser                             | PNG séparés, neige, fenêtres chaudes, portes et ancrages         |
| Intérieur de Loyal         | Sol, lit, table et lettre provisoires                    | Tileset et objets transparents validés                           |
| Référence composite        | Référence seulement                                      | Ne pas découper automatiquement en sprites jouables              |
| Audio                      | Aucun                                                    | Ambiances facultatives, activation explicite                     |

1. Fournir les références humaines définitives de Debby et Loyal ; conserver le même gabarit et l’ancrage des pieds pour chaque frame.
2. Produire les images transparentes séparées, palette d’hiver bleu nuit, lumières ambrées, bois chaud et neige. Respecter les lunettes rondes et les habits validés.
3. Faire valider les personnages et façades avant de les qualifier de définitifs.
4. Exporter un atlas avec métadonnées de frames, directions, pieds et hitboxes. Les collisions correspondent aux pieds/au socle, pas au grand rectangle visuel.
5. Charger l’atlas et les animations dans Phaser ; retirer le tracé temporaire des lunettes et les façades par code. Vérifier profondeur, portes et animations aux quatre directions.
6. Refaire captures PC/mobile et parcours complet, puis mettre à jour les mentions de statut.
