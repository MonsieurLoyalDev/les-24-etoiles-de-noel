# D.3.5.1 — A.2 : La touche féerique

Proposition pour validation artistique. Seuls le Foyer, la maison de Loyal et la place centrale sont retravaillés. Aucune généralisation, fusion ou mise en ligne.

## Changements artistiques

**Place centrale.** Treize congères directionnelles remplacent les anciens petits masques ponctuels dans les deux secteurs. Elles partent des bordures et accompagnent les jonctions ; certains pavés restent lisibles sous la poudreuse. Leur relief emploie la matière existante et une très légère ombre froide en bordure, sans nouvelle texture générale de neige. Le traitement est précalculé une seule fois à l’entrée de la scène.

Les deux bancs gardent leurs sprites frontaux, sans rotation ni déformation. Ils sont décalés de 58 pixels verticalement ; table plus basse, lanterne, panier et petit parterre les réunissent en une composition asymétrique. Les deux étals restent à leurs positions d’origine. Leurs caisses, panier, petit sapin et lanterne forment une réserve de marchandises proche de l’étal ouest. Le sapin central, son atlas et sa progression restent inchangés et dominants.

**Maison de Loyal et Foyer.** La réserve de bois quitte la zone éloignée pour rejoindre le pied du chalet, avec panier de petit bois et lumière discrète. L’entrée reçoit une petite plantation et une lanterne, latéralement à la porte. Trois accessoires bas sont limités aux 16 pixels inférieurs du porche ; ils ne modifient ni l’image de façade ni les fenêtres. Le bosquet principal regroupe un sapin à silhouette étalée, deux silhouettes secondaires, des arbustes et une petite composition de pierres. Les arbres ne suivent plus le même axe. Les outils du porche voisin et les plantes du jardin partagé sont rapprochés de leur fonction. Quelques objets de la venelle trop étroite sont retirés au profit de la respiration.

Il s’agit d’une recomposition : 61 placements dans l’étape A, 67 dans A.2. Les images, les regroupements, les tailles et les transitions sont les critères de validation ; ce nombre n’est pas un objectif de densité. **Aucun nouvel asset graphique** : 24 sprites existants réutilisés, atlas et transparences conservés.

## Préservation

Carte 1920 × 1408, 16 habitations et quatre bâtiments visitables conservés à l’identique. Les 223 fichiers publics sont vérifiés par SHA-256. L’écart Git du code d’exécution par rapport à l’étape A ne porte que sur composition351.ts et ground35.ts. Personnages, portraits, dialogues, HUD, menus, intérieurs, calendrier, récompenses et formats de sauvegarde ne sont pas modifiés. Les collisions structurelles et les portillons restent inchangés ; les emprises des accessoires suivent leur nouveau placement. Les trois autres quartiers conservent exactement leurs placements.

## Tests réellement exécutés

- TypeScript, lint, builds production et E2E : réussis.
- 167 tests unitaires réussis ; deux contrôles POSIX ignorés sous Windows. Les nouveaux contrôles couvrent les limites du contact avec le porche, le décalage des bancs, le relief et la restriction des congères au périmètre témoin.
- 22 tests navigateur PC/mobile réussis, aucun échec ni cas ignoré.
- Sélection : déplacements réels autour du sapin et du mobilier, 38 chemins libres, portillons du Foyer, quatre entrées/sorties, sauvegarde et reprise, 17 interactions décoratives, trois mini-jeux, 24 journées et final, joystick tactile, réduction des mouvements.

- PC : RAF p95 4.30 ms, moyenne 4.17 ms, 180 échantillons, CPU ×1.
- Mobile émulé : RAF p95 4.30 ms, moyenne 4.26 ms, 180 échantillons, CPU ×4.

Terrain précalculé en 234 ms lors de la capture locale de la place. Ces mesures RAF dans Chrome ne garantissent pas les performances sur un téléphone physique. Le chargement sur réseau mobile réel reste à mesurer. Le build conserve l’avertissement connu d’un chunk Phaser supérieur à 500 ko. Les réglages graphiques et de réduction des mouvements existants sont préservés.

## Captures et limites

24 captures du vrai jeu : étape A à gauche, A.2 à droite. Même point de départ, horloge initiale, réglages et viewport pour chaque comparaison. Les animations continuent normalement. PC 1280 × 900 ; téléphone émulé 390 × 844. Les gros plans sont des recadrages identiques, sans agrandissement : chemins 600 × 390, coin convivial 650 × 440, jardin 960 × 680 et portillon 500 × 340. Toutes les proportions sont conservées. La galerie embarque ses images WebP qualité 95 et fonctionne hors ligne ; cette compression n’est pas annoncée sans perte.

Les bancs ne peuvent pas se faire face avec ces sprites ; l’asymétrie porte sur leur implantation. Aucune assise ou interaction nouvelle n’est ajoutée. L’étape A.2 ne refond ni les autres quartiers ni les intérieurs. La qualité artistique reste à valider sur les comparatifs. **Arrêt après cette proposition : attendre votre accord avant toute généralisation.**
