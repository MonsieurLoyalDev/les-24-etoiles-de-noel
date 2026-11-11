# D.4.1 — Validation de la fondation du monde vivant

## Résultat et périmètre

Prototype intégré sur `feature/phase-d4-1-monde-vivant`, depuis le correctif validé f3e3472. Huit personnages existants conservés : sept humains et Flocon le renard. Le code confirme Augustin, et non « Augustine ». Les identifiants historiques noe/mira/oscar/alma restent stables.

Trois habitants bénéficient du nouveau moteur : Augustin effectue ses rondes près des lanternes ; Émile rejoint les boîtes aux lettres des Livres et des Veillées ; Célestine alterne accueil, rayons et poste de lecture. Les observations sont visibles avec des poses natives orientées. Aucune animation professionnelle spécialisée n’est prétendue disponible. Les salutations changent selon les quatre périodes de l’horloge existante ; les offres de quêtes, choix et événements historiques restent présents. Émile reçoit un dialogue sans nouvelle quête ni récompense.

Navigation A* légère, grille statique et préférence pour les chemins existants, façade complète évitée, cache borné, réservations de points, attentes et recalcul en cas de blocage. La conversation arrête le PNJ, conserve sa réservation et permet sa reprise. Une seule horloge fictive de trois minutes ; aucune modification des règles serveur de l’Avent. Les rencontres utilisent des flags compatibles avec le schéma v2, sans effacer l’ancienne progression.

Les douze nouveaux habitants et quatre visiteurs figurent uniquement au catalogue proposé. Le plan de répartition est un schéma technique issu des données, jamais une capture du jeu. Aucune nouvelle ressource graphique n’est créée. Les huit personnages, les seize maisons, les quatre intérieurs et la composition extérieure sont préservés.

## Vérifications exécutées

- `npx tsc --noEmit` : réussi.
- `npm run lint` : réussi.
- Build Vite E2E et build de production dans un dossier séparé : réussis.
- Tests unitaires complets : **182 réussis, 2 ignorés** sur Windows (cas POSIX existants). Douze tests nouveaux concernent registre, navigation sur la géométrie réelle, portillons, réservations/capacité, deux cycles complets, blocage, hors caméra, dialogues et compatibilité des sauvegardes.
- **18 cas navigateur distincts validés** sur Chrome PC et téléphone émulé : 8 du prototype ; 2 parcours de première quête/sauvegarde/journal ; 2 joysticks tactiles/responsive ; 2 parcours des quêtes secondaires et des trois mini-jeux ; 2 parcours des 24 activités, reprise et final ; 2 parcours de chacune des 17 interactions décoratives (clavier et tactile).
- Les deux cas de quêtes Phase B ont d’abord échoué : leur pilote présumait une patrouille en ligne droite et un mouvement sous cinq secondes. Adaptation au navigateur indépendant existant et aux pauses prévues de 7–18 s ; assertions de quêtes, récompenses, sauvegarde et mini-jeux conservées. Les deux reprises finales passent. Aucun échec n’est présenté comme une réussite.
- Dix points d’approche libres et atteignables ; les cinq portillons sont atteignables sur les collisions réelles. Simulation de deux cycles sans traversée des bâtiments ni superposition des PNJ. Conversations immobiles et reprise contrôlées dans le navigateur.
- Vérification SHA-256 de 412 fichiers de référence : seuls `Game.ts` et le pilote de test Phase B sont adaptés. Les **223 fichiers publics sont identiques**, comme les textures de neige, plans, sources des dialogues, acteurs/animations, HUD, mini-jeux, calendrier, sauvegarde et infrastructure. Voir `PRESERVATION.json`.

La sélection navigateur cible les fonctionnalités affectées et les régressions principales ; elle ne constitue pas l’exécution de toute la collection historique. Aucun test VPS, Supabase distant ou téléphone physique n’est revendiqué. La CI distante n’est pas annoncée réussie.

Les avertissements de compilation existants sur le chunk Phaser et les attributs d’import JSON restent présents ; ils n’empêchent pas la compilation. Aucune refonte de ces modules protégés n’a été entreprise.

## Galerie et contrôle artistique

Quatre comparaisons avant/après du jeu exécuté : place à l’aurore, tournée dans les Veillées, bibliothèque, place de nuit. Capture de dialogue d’Émile, écran mobile et deux courtes vidéos du canvas réel. Les mêmes cadrages, positions initiales, étoiles et périodes de départ sont utilisés pour chaque paire. Les délais d’attente diffèrent pour montrer les arrivées effectives des habitants ; les horodatages exacts ne sont donc pas prétendus identiques.

Les images sont converties en WebP **sans perte**, sans changement de dimensions, ni de proportions. La galerie HTML contient ses images et vidéos, avec des styles locaux. Les vidéos de 7,5 s et 5 s enregistrent le canvas Phaser, sans le HUD React. Le cadrage de la bibliothèque laisse Debby et Loyal visibles au lieu de les masquer derrière le mobilier. Les indications d’activité sont brèves, limitées à une et masquées pendant les dialogues ; elles évitent noms, enseignes et façades.

## Limites et validation attendue

- Pas de nouveaux sprites ou habitants intégrés : D.4.2 après accord sur le catalogue et le prototype.
- Pas de gestes métier détaillés, d’assise, de scène sociale, de micro-événement ni de visiteur daté : D.4.3 à D.4.5.
- Les réservations à deux places sont testées comme fondation ; aucun personnage n’est faussement montré assis.
- Pas de transition autonome intérieur/extérieur : Célestine reste disponible dans la bibliothèque. Sa simulation démarre lorsque cette pièce est chargée pour la première fois, puis persiste en mémoire entre les visites.
- Les routines sont recalculées à la reprise depuis l’horloge ; seules les rencontres sont persistées. Une foule plus importante et ses croisements devront être validés avant généralisation.
- Les statistiques RAF sont locales et de courte durée ; l’émulation mobile avec CPU ralenti ne remplace pas un appareil réel.

**Aucune fusion, aucun déploiement, aucune généralisation D.4.2. Validation artistique et fonctionnelle attendue.**

## Performances mesurées après polissage

180 intervalles RAF après échauffement par configuration : p95 PC **4.3 ms**, moyenne 4.17 ms ; mobile émulé CPU ×4, p95 **4.3 ms**, moyenne 4.31 ms. Référence locale p95 4,3 ms. Ces mesures de cadence sont propres au poste et ne démontrent pas un débit sur tous les téléphones. Les deux cas de budget/réduction des mouvements ont été réexécutés après la dernière correction d’affichage et passent. Les données brutes et l’historique des sélections figurent dans les JSON joints.

## Contrôle de la livraison légère

Galerie ouverte hors ligne dans Chrome : dix images chargées aux dimensions natives, deux vidéos décodées et lues, aucune requête HTTP externe, aucune erreur JavaScript, aucun débordement horizontal à 1440 et 390 px. Chaque conversion WebP a été comparée pixel par pixel à sa capture PNG. Les originaux PNG et les vidéos restent séparés des fichiers du jeu. Aucun nouveau ZIP source ou ARTWORK volumineux n’est produit pour cette validation.
