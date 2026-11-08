# Étoilebois — Phase D.3.1, version 0.7.1

Base exclusive : D.3, commit `186367cfb396aa52bf30d2e15bcbc40ff8751c47`, qui a produit l'archive `etoilebois-phase-d3-village-vivant.zip`. Son SHA-256 a été vérifié : `AAE5A578AE710E3B310D0DAF17A7EA584EFE0739CEE7B645C1B44A5403D2177A`. Le checkout était propre au départ. Branche : `feature/phase-d3-1-edition-artistique`.

[Visite comparative PC/mobile](comparatif-d31.html) · [Sapin et atlas d'origine](sapin-d31.html) · [Ressources sur fonds clair et sombre](ressources-d31.html) · [Inventaire et empreintes](INVENTAIRE-D31.json).

## Audit et ordre de réalisation

L'[audit initial](AUDIT-D31.md) identifie les ressources réutilisables, les rectangles provisoires, les trois emprises de mobilier, les interactions, le terrain et l'étoile superposée. Les étapes A à H ont été suivies dans cet ordre. Les créations ont été définies après cet audit.

### A — Le sapin d'origine

L'image indépendante `quest_star` ajoutée en `(512,304)` est retirée de `renderRoom`. L'atlas exact `sapin_atlas-Etoilebois_Sapin_V11_4` et ses images `sapin_00` à `sapin_24` restent inchangés, tout comme le facteur de rendu 0,9. La progression choisit toujours l'image de l'atlas correspondant au nombre d'étoiles. Le final conserve son animation légitime.

Les appels optionnels à l'ancien marqueur n'ont plus d'image à afficher ; ils ne modifient ni récompense ni progression. Les marqueurs de chasse aux petits bonheurs ailleurs dans le village restent disponibles. Les tests observent les images `sapin_01` et `sapin_24` et l'absence de surimpression. La présentation affiche directement trois cadres de l'atlas original, sans retoucher le PNG.

### B — Nuances de la neige blanche

Deux textures de poudreuse et de neige doucement tassée complètent seulement la sous-couche blanche : ivoire, bleu glacier et lavande très discrète, relief bas et ombres froides. Elles couvrent le fond continu sans permutation de petites tuiles ; aucun raccord supplémentaire n'est introduit dans la carte.

L'ordre est explicite : neige antérieure, nuances D.3.1, puis toutes les nappes D.3, pavés, contacts et détails D.3. **Les dix PNG de terrain D.3, les 24 placements et les 14 détails restent exactement identiques**, tailles comprises. Les tests comparent les données et les SHA-256 à l'inventaire validé. Aucun terrain naturel n'est retiré, réduit ou déplacé.

Les vues de jour, crépuscule et nuit vérifient aussi un fond entièrement opaque et une présence de terre supérieure à 9 % dans la texture composée, avant recouvrement par les bâtiments. Cette mesure de couleur complète le contrôle visuel ; elle n'est pas un jugement artistique automatique.

### C — Quatre architectures intérieures

Chaque pièce garde ses dimensions de **480 × 352**, ses murs physiques, son accès et sa sortie. Les nouveaux fonds sont des couches d'architecture vides en perspective RPG : parquet, plinthes, boiseries, fenêtres enneigées et seuil. Le mobilier reste composé de sprites séparés, superposés avec les personnages.

- Maison : chêne miel, enduit clair, bois sculpté et détails cuivrés.
- Bibliothèque : noyer plus sombre et boiseries bleu pétrole sourd.
- Atelier : larges planches et charpente plus robuste.
- Auberge : parquet en chevrons, boiseries ambrées et tissus bordeaux.

Trois premiers essais présentant une perspective frontale ou une façade ont été rejetés avant intégration. Les architectures retenues reprennent la projection orthographique contrôlée de la maison. Leurs proportions sont conservées par un export uniforme ; les arrondis de dimensions représentent moins d'un pixel de recadrage.

### D — Mobilier détaillé

Douze ensembles transparents remplacent les rectangles. Leurs pieds sont alignés sur les trois emprises physiques existantes ; leur hauteur visuelle donne une profondeur sans créer de nouvel obstacle.

| Lieu | Ensemble gauche | Ensemble central | Ensemble droit |
| --- | --- | --- | --- |
| Maison | Canapé, fauteuil, plaid, coussins et coffre à livres | Table pour deux, chaises, deux tasses, lettre, livre et bougie | Foyer, bibliothèque personnelle, petit sapin, cadeaux, cadre et renard sculpté |
| Bibliothèque | Rayonnages remplis, tiroirs, carnets, plante et lampe | Bureau de lecture, livre ouvert, marque-page, lettre, photographie et lampe | Fauteuil, plaid, petite table, tasse, livres et lampe |
| Atelier | Rangement avec marteau, scie, rabot, ciseaux, train et renard en bois | Établi, étau, cadeau en cours d'emballage, papier, ruban et outils | Supports de planches, bûches, caisses, boîtes et ruban |
| Auberge | Comptoir, étagère à vaisselle, théière, tasses et pâtisseries | Table pour deux, chaises, livre, thé et bougie | Cheminée, banquette, plaid, bûches, couronne et bougies |

Les groupes n'emploient pas tous les mêmes meubles ni la même silhouette. La structure physique commune antérieure est volontairement conservée. Les meubles hauts ne sont pas dispersés sur le sol libre avec des collisions fictives ou absentes.

### E — Objets narratifs et textiles

Deux tapis tissés sont répartis différemment selon le lieu. Les souvenirs photographiques, les cartes et les plans d'emballage occupent les zones des activités existantes. Ce sont des documents posés à plat, franchissables. Trois petites lanternes sont fixées aux murs de chaque pièce.

Les tasses, lettres, livres entrouverts, marque-pages, cadeaux inachevés, cadres, outils et couvertures sont intégrés aux ensembles de mobilier. Ils restent purement décoratifs. Les photographies fictives représentent un paysage d'hiver et une maison ; aucun souvenir privé réel n'a été inventé ou embarqué.

Les zones d'apparition, les chemins des habitants et l'ancre du calendrier restent dégagés. Les tapis donnent une identité aux espaces libres sans les transformer en obstacles.

### F — Lumière intérieure

Le contrôleur lit l'horloge existante et conserve ses transitions progressives. Il ajuste la teinte de l'architecture et des meubles : lumière naturelle le jour, nuances plus chaudes au crépuscule, bois légèrement refroidi et sources locales plus présentes la nuit. Les personnages, portraits, plaques de noms, dialogues et HUD ne sont pas recolorés par ce contrôleur.

Les petites couches lumineuses sont ancrées aux lanternes, lampes, bougies et foyers réellement dessinés. **Trois à six lumières par pièce**, sans particules intérieures ni météo. Leur variation est lente et limitée à 2,5 %. Le mode sans effets et la préférence système de réduction des mouvements imposent une lumière statique. Les sources hors champ sont masquées.

Les flammes dessinées dans les ressources restent fixes : cette livraison anime leur lumière, pas une nouvelle séquence d'images de feu. Aucun halo de grande taille, nouveau son ou effet de chaleur complexe n'est ajouté.

### G — Proportions, transparence et ressources

Les intérieurs sont centrés uniquement lorsque la zone visible dépasse la taille de la pièce. Le zoom et le suivi de Debby restent ceux de D.3. Les marges de caméra ne sont pas des zones accessibles : les limites physiques restent 480 × 352. Sur téléphone, une pièce plus large que l'écran se visite en suivant Debby ; les captures des coins montrent les meubles entiers, sans réduire les personnages.

Les **24 originaux image_gen** sont conservés dans `docs/artwork-d31/originals`. Le pipeline [`prepare-d31-assets.ts`](../../scripts/prepare-d31-assets.ts) exporte les seules nouvelles textures à leur résolution utile : recadrage alpha, proportions uniformes, échantillonnage au plus proche et deux pixels transparents de marge. Aucun nouveau dessin n'est créé par ce script. Les meubles composites conservent leurs différents éléments ; aucune suppression arbitraire de chaise ou de lampe détachée n'est appliquée.

| Ensemble des nouvelles ressources | Octets |
| --- | ---: |
| Originaux conservés hors du bundle public | 44 316 520 |
| PNG réellement chargés par le jeu | 3 897 619 |
| Réduction du téléchargement | **91,2 %** |

Toutes les textures distribuées sont limitées à 512 px. Les quatre architectures sont déjà à 480 × 352 ; les découpes sont directement utilisables, sans traitement d'image coûteux à l'entrée dans les pièces. Les deux sources de neige sont retirées du cache GPU une fois le terrain composé. Les 18 découpes ont une véritable transparence vérifiée, et leurs quatre coins exportés sont à alpha zéro.

Les ressources antérieures validées ne passent pas dans cet export : personnages, végétation, façades, atlas du sapin et terrain D.3 restent intacts.

### H — Validation et conservation

[Audit d'invariants](INVARIANTS-D31.json) : **502 fichiers D.3 protégés inchangés**, **21 méthodes identiques hors ajouts d'affichage précisément listés**, et construction des collisions identique. Cela comprend les personnages, animations, portraits, HUD, dialogues, données et règles du calendrier, sauvegardes, mini-jeux, contrôles, missions, backend et migrations. Un test navigateur historique reçoit uniquement une attente de fermeture de la fenêtre d'activité et de deux trames, avant d'envoyer les touches maintenues : le panneau réinitialise lui-même le clavier lors de sa fermeture. L'audit vérifie que le reste de ce test est identique à D.3. Aucune modification de la logique du jeu ne sert à contourner ce problème de synchronisation du test.

- Lint : réussi.
- TypeScript et build E2E : réussis.
- Tests unitaires : **146 réussis, 2 contrôles POSIX ignorés sous Windows**, 15 fichiers.
- Contrôle ciblé des collisions et sorties : les quatre pièces réussissent sur PC et mobile après correction d'un sélecteur de test qui omettait le préfixe « E » du bouton. Aucune logique de jeu n'a été modifiée pour ce correctif.
- Suite navigateur complète finale : **62 réussis, 12 ignorés, aucun échec**, soit 74 cas PC/mobile, en **17,3 minutes**. Les cas ignorés sont réservés à un autre format.
- Builds E2E, normal et privé : **réussis**, TypeScript inclus. Le contrôle privé confirme l'absence du paquet de surprises fictives et des médias de démonstration dans ce bundle.
- Captures finales : **41 avant et 43 après**, dont les quatre pièces de jour/nuit, les coins visités sur mobile, petit ordinateur, tablette, terrain, atlas et ressources. Les 21 références extérieures copiées depuis D.3 sont conservées sans modification.
- Dossier de présentation : **128 liens locaux vérifiés**, empreintes des 24 ressources conformes ; [liste et SHA-256 des captures](LIVRABLES-D31.json).

Les parcours D.3.1 vérifient les trois collisions de chaque pièce avec les touches réelles, les sorties, les dimensions du mobilier, le sapin à 1 et 24 étoiles, les éclairages, la réduction des mouvements et la reprise. Les parcours historiques conservent les entrées réelles dans les quatre bâtiments, les dialogues, les trois mini-jeux, les 24 journées, les récompenses et le final.

## Performances et portée des mesures

Les fichiers `D31-PERFORMANCE-desktop.json` et `D31-PERFORMANCE-mobile.json` mesurent le coût CPU du seul contrôleur de lumière intérieure, après huit secondes en bibliothèque nocturne. Les relevés extérieurs du même build final, après 14 secondes près de l'atelier, sont conservés séparément dans `D31-VILLAGE-PERFORMANCE-desktop.json` et `D31-VILLAGE-PERFORMANCE-mobile.json`. Les métriques historiques D.3 sont rétablies après les tests.

| Relevé Chrome local | PC | Écran mobile simulé |
| --- | ---: | ---: |
| Mode | Complet | Léger |
| Lumières intérieures visibles / pool | 6 / 6 | 4 / 6 |
| CPU P95 du contrôleur intérieur | 0,10 ms | 0,00 ms relevé, sous la résolution du chronomètre |
| CPU P95 du contrôleur extérieur | 0,10 ms | 0,10 ms |
| Cadence Phaser extérieure sur ce court échantillon | ≈ 60 images/s | ≈ 60 images/s |
| Delta moyen extérieur | ≈ 16,67 ms | ≈ 16,67 ms |

Un relevé à zéro ne signifie pas un coût CPU nul. Ces mesures utilisent l'horloge réelle du navigateur, sur le même ordinateur ; elles ne mesurent pas le GPU et ne prédisent pas la cadence d'un téléphone physique. La désactivation des mouvements conserve les lumières statiques et arrête leur vacillement.

Le terrain reste composé une fois. Les contrôleurs visuels n'ajoutent pas d'objets à chaque frame, n'émettent aucun événement de quête et ne touchent pas à la progression. Aucun timer ou listener supplémentaire n'est créé à chaque visite. Les préférences graphiques restent celles de D.3, stockées séparément des sauvegardes.

## Limites restantes et validation artistique

- PC, petit ordinateur, tablette et téléphone sont vérifiés dans Chrome local avec des formats émulés. Aucun appareil mobile physique ni GPU mobile réel n'est déclaré testé.
- Les trois emprises de mobilier antérieures sont conservées. Les grands espaces libres restent circulables et sont enrichis avec des textiles et des documents au sol ; ils ne deviennent pas de nouveaux meubles traversables.
- Les flammes sont des illustrations fixes, accompagnées d'un vacillement lumineux discret. Les souvenirs graphiques restent fictifs.
- Les originaux haute définition rendent le ZIP source plus volumineux que le téléchargement des textures par le jeu. Ils sont hors du bundle compilé.
- Les avertissements connus de taille du chunk Phaser et de références publiques résolues à l'exécution en build privé ne sont pas présentés comme des échecs de compilation.
- Les nouvelles ressources ont été contrôlées visuellement et sont soumises à la validation artistique de l'utilisateur. Aucune Phase D.4, fusion automatique, modification ou déploiement du VPS.

## Reproduire

`npm ci`, `npm run lint`, `npm test`, `npm run build:e2e`, puis `ETB_E2E_BUILT=1 npx playwright test` (PowerShell : `$env:ETB_E2E_BUILT='1'`). `npm run build:private` et `npm run build` vérifient les compilations. `npm run dev` lance le jeu.

Pour régénérer les exports natifs depuis les originaux conservés : `npx tsx scripts/prepare-d31-assets.ts` avec Chrome local, ou Chromium installé dans un environnement CI. Dans un checkout Git contenant la base D.3, `npx tsx scripts/audit-d31-invariants.ts` reproduit le contrôle de conservation. Cet audit Git ne s'exécute pas dans un ZIP sans historique.

Les prompts exacts sont conservés dans [D31-GENERATION.md](D31-GENERATION.md), [D31-MOBILIER-PROMPTS.md](D31-MOBILIER-PROMPTS.md) et [D31-DECORATIONS-PROMPTS.md](D31-DECORATIONS-PROMPTS.md). Outil utilisé : `image_gen` intégré ; aucune API externe de génération ni secret ajouté au dépôt.
