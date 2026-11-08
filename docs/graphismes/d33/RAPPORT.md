# Étoilebois D.3.3 — version 0.7.3

Livraison technique vérifiée ; créations proposées à validation artistique. Branche dédiée, aucune fusion ni mise en ligne.

## Composition et protection

Base D.3.2 : a7827c8e9df7595888cdb9b44c91db7714e0a48e. Le centre historique reste à ses coordonnées. Le monde passe de 1024 × 768 à 1920 × 1408. Le quartier résidentiel se développe à l'est, les artisans au sud-est, le quartier calme au sud-ouest. Les façades publiques, leurs entrées, le sapin et les personnages restent en place. Les textures de neige D.3.1 et les 196 fichiers graphiques publics antérieurs ne sont pas modifiés : voir PRESERVATION.json. Le calendrier, les mini-jeux, les textes des dialogues et le schéma de sauvegarde restent inchangés.

Le plan d'audit précède l'intégration. La revue globale a ensuite conduit à décaler les parcelles et infléchir les rues pour casser les rangées régulières. Les jardins et les bosquets sont composés entre les façades et à distance des portes, avec des passages ouverts.

## Seize habitations décoratives

Quatre habitations actives en D.3.2 deviennent seize silhouettes distinctes. Huit originaux D.3.2 sont réutilisés (dont quatre jusque-là non intégrés), huit nouvelles façades sont créées. Les originaux approuvés ne sont pas repeints ou étirés. La porte, mesurée sur le contenu détouré hors marches, fixe une hauteur de référence de 44 pixels ; les humains font 52 pixels avec cheveux et couvre-chef. Les rapports restent ceux des images. Ce calibrage est un repère de composition, pas une mesure architecturale réelle. Les quatre façades publiques validées gardent leur échelle de référence antérieure.

| N° | Habitation | Ressource | Quartier | Pied x,y | Taille affichée px |
|---|---|---|---|---|---|
| 1 | Maison au porche étroit | home-porch | calme | 150, 1030 | 86.5 × 148.5 |
| 2 | Maison aux jardinières | home-garden | calme | 950, 1290 | 204.0 × 139.5 |
| 3 | Maison à haute toiture | home-tall | calme | 420, 1240 | 113.5 × 178.0 |
| 4 | Maison à baie vitrée | home-oriel | residentiel | 1230, 610 | 141.5 × 144.0 |
| 5 | Maison familiale à pignons | home-family | residentiel | 1200, 280 | 240.0 × 139.5 |
| 6 | Chalet en rondins | home-chalet | residentiel | 1480, 320 | 148.0 × 131.5 |
| 7 | Maison étroite | home-narrow | artisans | 1150, 1040 | 96.0 × 233.5 |
| 8 | Maison basse à volets | home-shutters | artisans | 1730, 980 | 185.5 × 115.0 |
| 9 | Maison pierre-bois | cottage-stone | residentiel | 1770, 250 | 176.5 × 118.0 |
| 10 | Maison à deux volumes | cottage-twin | residentiel | 1530, 650 | 188.0 × 153.5 |
| 11 | Maison au toit pentu | cottage-gable | residentiel | 1780, 600 | 100.0 × 135.5 |
| 12 | Cabane modeste | cottage-humble | calme | 730, 1050 | 129.5 × 113.5 |
| 13 | Maison à annexe | cottage-annex | artisans | 1440, 1040 | 180.5 × 127.5 |
| 14 | Maison au grand porche | cottage-porchwide | artisans | 1180, 1260 | 156.5 × 112.0 |
| 15 | Chalet à terrasse couverte | cottage-terrace | artisans | 1480, 1285 | 167.5 × 121.0 |
| 16 | Maison à jardinet et portillon | cottage-garden | artisans | 1760, 1235 | 173.5 × 118.0 |

Chaque habitation possède son accès, une lanterne et un petit aménagement ; les façades incluent aussi selon leur identité porche, pots, bûches, volets, couronne, boîte aux lettres ou terrasse. Bancs, jardinières, buissons, clôtures et sapins proviennent du catalogue déjà validé. Les maisons ne créent aucun nouveau portail ou intérieur.

### Maison masquée et arbre

La maison à baie vitrée D.3.2 était au pied (960,410). Le sapin solide (944,416) recouvrait sa façade ; deux arbres de fond resserraient ce groupe. Le sapin gênant et sa collision sont déplacés en (1860,120). La maison est réimplantée en (1230,610), sur une parcelle avec une allée propre. Sa façade n'est plus derrière cet arbre. Les arbres de l'ancien quartier sont conservés et ne constituent plus un écran devant une habitation.

## Chemins

Les pavés principaux prolongent les accès historiques vers l'est et le sud. Les rues secondaires utilisent la terre tassée du catalogue. Les allées de 15 pixels rejoignent les entrées, sans nouvelle mécanique. Largeurs des rues : 24 à 38 pixels ; coins adoucis sur 16 pixels, petites inflexions entre parcelles. Les chemins existants et le passage de la Phase B y608/x208 sont préservés. Les masques de chemin reçoivent de vraies textures, sans rectangles colorés visibles.

## Quatre architectures intérieures

| Lieu | Ancien plan | Nouveau volume | Groupes de mobilier structurants* |
|---|---|---|---|
| Maison de Loyal (house) | Rectangle 480 × 352 | 864 × 560 — Salon et alcôve des souvenirs | 9 |
| Bibliothèque (library) | Rectangle 480 × 352 | 960 × 560 — Grande lecture et refuge des histoires | 10 |
| Atelier (workshop) | Rectangle 480 × 352 | 896 × 512 — Fabrication, passage et emballage | 8 |
| Auberge (inn) | Rectangle 480 × 352 | 960 × 544 — Salle commune et deux salons | 10 |

*En plus des consoles et coins décoratifs D.3.2, des tapis et des petits effets. Un groupe contient plusieurs objets dessinés : livres, tasses, rubans, plaids, outils, etc. Il ne s'agit pas d'un comptage artificiel d'objets interactifs.

Maison : salon historique, foyer, espace repas et alcôve de lecture en L. Bibliothèque : salle transversale, plusieurs rayonnages, bureau et refuge de lecture au sud-est. Atelier : fabrication à l'ouest, passage large et volume oriental de rangement/emballage. Auberge : salle commune, comptoir et deux salons méridionaux. Les volumes sont réellement explorables ; les murs et les limites de caméra suivent les plans. Les fenêtres sont sur les murs, les lanternes suivent les nouvelles limites, les tapis passent sous les meubles et les personnages passent devant ou derrière selon leur position.

Ressources nouvelles : parquet chaud, plancher d'atelier, boiserie modulaire, fenêtre hivernale, foyer sculpté, bibliothèque/fauteuil/échelle, établi artisanal et banquette à thé. Les meubles D.3.1 sont réutilisés et agrandis dans des compositions cohérentes ; les ornements D.3.2 sont conservés. Les ombres et les petits objets sont intégrés aux sprites transparents. Aucun meuble géométrique provisoire n'est ajouté.

## Interactions, animations et sauvegardes

Les 17 identifiants sont conservés ; aucune interaction supplémentaire artificielle. Quelques points d'approche sont déplacés devant les meubles agrandis. Textes, actions et résultats restent identiques.

- house-candle : la bougie du foyer (toggle).
- house-cat : Caresser le chat (pet).
- house-photo : Examiner les souvenirs (read).
- house-note : Lire le petit mot (read).
- house-chair : Examiner le fauteuil (read).
- library-book : Consulter le livre ouvert (read).
- library-lamp : la lampe de lecture (toggle).
- library-photo : Examiner la photographie (read).
- library-quote : Lire la citation (read).
- workshop-toy : Examiner le jouet (read).
- workshop-mechanism : Remonter le petit train (mechanism).
- workshop-lantern : la lanterne de l’établi (toggle).
- workshop-plan : Observer le plan (read).
- inn-candle : la bougie des visiteurs (toggle).
- inn-menu : Lire le menu de Noël (read).
- inn-keepsake : Observer le souvenir (read).
- inn-bench : Examiner la banquette (read).

Le chat, le train mécanique, les flammes, les boissons et les quatre interrupteurs conservent leur contrôleur. Les fenêtres et les fumées des seize habitations sont ancrées sur leurs propres sprites, avec un budget visible de 8/4/0 particules selon la qualité. Réduction des mouvements : aucune fumée ou vapeur animée, pas de mouvement du chat ou du train ; les interactions et les lumières restent utilisables.

Les états des interrupteurs restent dans etoilebois-decoration-v1, séparés de la progression. Le mécanisme existant de reprise contrôle la position contre les collisions et les nouvelles dimensions : s'il faut la remplacer, seuls les coordonnées deviennent le point sûr (512,608) ou (240,280). Une ancienne position libre est conservée. Les autres champs de progression ne sont pas réinitialisés.

## Ressources et performances

24 PNG natifs D.3.3 : 16 façades et 8 ressources intérieures, 4 114 223 octets au total, aucune dimension supérieure à 512 pixels. Les 16 originaux nouvellement générés et leurs prompts sont conservés dans docs/artwork-d33. Les 8 originaux réutilisés restent dans docs/artwork-d32. Les inventaires JSON donnent les empreintes SHA-256 et les limites alpha. Les textures opaques de parquet sont identifiées ; les autres ressources ont de vrais coins transparents et une marge de découpe.

Les anciens shells D.3.1 et les quatre anciens exports de maison ne sont plus chargés par le moteur courant. Le terrain et les plans sont mis en cache ; les particules hors caméra sont écartées et plafonnées. Les effets se conforment aux réglages existants. Mesures finales sur 170 intervalles RAF après échauffement, Chrome headless local :

| Format | Moyenne RAF | P95 RAF | Fumées visibles / budget |
|---|---|---|---|
| PC | 4,17 ms | 4,30 ms | 4 / 8 |
| Téléphone émulé | 4,19 ms | 4,30 ms | 2 / 4 |

Les JSON bruts sont dans les captures D.3.3. Le RAF est non plafonné sur cet ordinateur : ces valeurs ne sont ni une promesse de FPS du jeu ni un profil GPU de téléphone. Le rendu reste lisible et les déplacements sont exercés dans les tests ; le téléphone physique et les pics de mémoire GPU restent à mesurer.

## Validation

- Unités : **156 réussites, 2 tests POSIX ignorés sous Windows**. Les tests ops correspondants sont destinés à un environnement Unix.
- Navigateur, suite complète : **86 réussites, 12 contrôles de formats complémentaires ignorés**, 31,9 minutes. Les 24 activités, les trois mini-jeux, les dialogues, le clavier et le tactile sont exercés.
- Après le calage final des quatre emprises et des fenêtres, vérification ciblée : **19 réussites et 3 formats ignorés**, en plusieurs lots PC/mobile. Elle couvre les collisions, les annexes, les rechargements dans chacune des quatre pièces, les sorties, les anciennes positions, les effets et les parcours historiques.
- Deux tests supplémentaires ont enregistré les vidéos PC/mobile des interactions : **2 réussites**, 46,3 secondes.
- Galeries : 35 images de comparaison et 48 présentations de ressources chargées sans image cassée.
- Un trajet de test passait initialement à travers la table de l'auberge ; il a été corrigé pour contourner le meuble, puis rejoué avec succès sur PC et mobile. Le journal du premier lot conserve cet échec et les journaux de reprise établissent sa résolution.
- **Lint, TypeScript et compilations standard/privée réussis** ; journaux bruts et résultats consolidés dans VALIDATION.json. Le contrôle du build privé confirme l’absence de paquet de surprises fictives et de médias de démonstration. L’avertissement Vite sur la taille du chunk Phaser reste présent, sans erreur de compilation.
- Le test historique Phase B a été adapté aux nouveaux points d'approche (y185 devant le meuble agrandi), sans retirer ses assertions de quêtes, scores, récompenses ou mini-jeux.
- Les contrats géométriques D.3.1/D.3.2 suivent les nouveaux plans ; les fonctions de gameplay ne sont pas contournées pour les captures.

## Limites et validation artistique

- Les nouvelles créations sont présentées pour validation artistique ; elles ne sont pas déclarées approuvées par le joueur.
- Les seize habitations sont décoratives ; seuls les quatre bâtiments historiques sont accessibles.
- Les fauteuils sont examinables ; aucune posture assise déformant les sprites n'est simulée.
- Le téléphone est testé en émulation Chrome, pas sur un appareil physique. Les mesures RAF ne constituent pas un profil GPU.
- Les transitions restent les mêmes ; aucun nouvel habitant ou système animal n'est créé. Le chat D.3.2 est conservé.
- Les surfaces calmes restent volontairement ouvertes entre les jardins et les bosquets.
- Les fonctions serveur/Supabase et le mode démonstration restent ceux de la phase précédente. Cette livraison artistique ne configure ni ne déploie un backend.
- D.4 n'est pas commencée. Aucune fusion et aucun déploiement automatique.

## Consultation et reproduction

Ouvrir ../comparatif-d33.html pour les captures PC/mobile et les comparaisons. Plans : PLAN-VILLAGE.svg et PLAN-house/library/workshop/inn.svg. Pour les contrôles : npm ci, npm run lint, npx tsc --noEmit, npm test, npm run build:private, npm run build, npm run build:e2e, puis ETB_E2E_BUILT=1 npm run test:e2e (syntaxe PowerShell : $env:ETB_E2E_BUILT='1'). Les scripts prepare-d33-homes.ts et prepare-d33-interiors.ts reproduisent les exports avec Chrome installé ; les originaux restent intacts.

Les comparatifs PNG sont placés à la racine de docs/screenshots/phase-d3-3. Les deux vidéos sont dans son sous-dossier apres. Les inventaires ASSETS-MAISONS.json et ASSETS-INTERIEURS.json présentent les 24 ressources ; PRESERVATION.json recense les fichiers antérieurs conservés.
