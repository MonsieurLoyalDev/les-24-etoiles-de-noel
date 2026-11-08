# D.3.2 — Création et sélection des ressources

Ressources générées avec l'outil intégré `image_gen`, sur fond transparent. Les références sont le mobilier pixel art D.3.1 et sa palette bois naturel, cuivre et lin. Les images ne remplacent aucun personnage, façade, portrait ou terrain validé.

Les demandes communes imposaient : un seul sprite isolé, perspective RPG trois-quarts de face légèrement vue de dessus, pixels nets, objet entier, alpha réel, aucune pièce ni plaque de sol, aucun texte illisible, contour blanc, halo ou fragment voisin. Les originaux ne sont jamais utilisés directement dans le jeu.

## Objets identifiés après audit

| Groupe                | Demande artistique                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| house-console         | Cabinet personnel étroit : horloge, photos discrètes, plante, carnets, couverture et chaussons                                        |
| library-console       | Rangement de livres variés, échelle décorative, atlas ouvert, marque-page et photographie                                             |
| workshop-console      | Rangement artisanal avec outils, plans, rubans, figurines, cadeaux et caisses                                                         |
| inn-console           | Vaisselier convivial avec menu sans texte peint, livre des visiteurs, théière et pâtisseries                                          |
| house-nook            | Fauteuil à plaid, table à deux tasses, carnet, plante et cadeaux                                                                      |
| library-nook          | Chariot de lecture, atlas, piles de livres, coussin et plaid                                                                          |
| workshop-nook         | Caisse de jouets, établi bas, cheval inachevé, copeaux, outils et rubans                                                              |
| inn-nook              | Banquette, coussins, plaid, table à thé, pâtisseries et plante                                                                        |
| cat-sleep / cat-awake | Même chat roux en panier, endormi puis yeux entrouverts et queue légèrement relevée ; la deuxième pose est une édition de la première |
| candle-off / lamp-off | Supports éteints, mèche visible, sans flamme ni lumière peinte                                                                        |
| flame-a / flame-b     | Deux petites flammes pixel art isolées, variations discrètes                                                                          |
| steam                 | Fine volute claire transparente, sans tasse ni halo                                                                                   |
| toy-train             | Petit train en bois et cuivre, roues et clé de remontage, ruban de Noël                                                               |

Une seconde passe a ajouté les quatre ensembles bas : la première visite des pièces révélait encore trop de vide malgré les consoles. Ce complément a été décidé sur capture, sans déplacer le mobilier antérieur.

## Maisons et décision d'échelle

Huit silhouettes ont été produites : maison familiale basse, chalet à rondins, porche, jardin clos, haut pignon, maison étroite, volets larges et baie vitrée. Les dimensions initiales permettaient huit parcelles libres, mais rendaient plusieurs portes trop petites par rapport aux personnages. Le contrôle visuel rapproché a donc invalidé cette implantation.

La livraison utilise seulement `home-porch`, `home-garden`, `home-tall` et `home-oriel`, à plus grande échelle et sur quatre parcelles retestées. Les candidates `home-family`, `home-chalet`, `home-narrow` et `home-shutters` restent dans les originaux documentaires. Aucun de leurs exports n'est présent dans les ressources publiques ou la liste de chargement.

## Contrôles et export

Deux images initiales avaient un fond parasite : chat éveillé et seconde flamme. Elles ont été corrigées avec l'outil d'image, puis contrôlées à nouveau. Le script d'export refuse les fonds non transparents et vérifie les limites du contenu. Les originaux retenus conservent une marge autour de leur silhouette.

`npx tsx scripts/prepare-d32-assets.ts` exporte les 20 ressources utiles à deux pixels natifs par pixel du monde, sans lissage, avec une marge transparente de deux pixels. Il écrit l'inventaire et inscrit uniquement ces ressources dans la liste publique. Les quatre anciens exports de recherche ont été explicitement retirés. Ne pas réexporter les assets D.3.1 pour reproduire D.3.2.

Les tests vérifient les empreintes, limites des silhouettes, transparence contrôlée, tailles et inclusion dans la liste publique. La galerie sur fonds clair et sombre complète ces vérifications techniques. Les captures sont destinées à la validation artistique par l'utilisateur, sans prétendre la remplacer.
