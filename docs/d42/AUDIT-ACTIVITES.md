# D.4.2 — Audit avant réalisation

Base : D.4.1, be52808. Branche dédiée `feature/phase-d4-2-activites`.

## Existant réutilisé

Huit personnages conservés, sept humains et Flocon renard. Les atlas de Célestine V1, Émile V1 et Augustin V4/V5 contiennent cinq groupes : haut, bas, gauche, droite et attente. Les attentes existantes ne montrent ni page tournée, ni dépôt de lettre, ni assise. Aucun geste spécialisé n’est déduit d’une simple translation.

`world/runtime.ts` gère trois profils, quatre périodes du même `Save.clock`, une grille A* statique par pièce, les réservations et l’interruption par dialogue. `world/presentation.ts` gère marche, orientation et indication d’activité. Les dix points existants et leurs horaires restent la base ; le nouveau moteur visuel sera attaché à ces activités, sans remplacer leur navigation.

Célestine : bibliothèque, accueil (120,230), rayons (590,180), lecture (740,324). Émile : boîtes des Livres et des Veillées, départ postal. Augustin : lanternes de la place et repos debout. Les points de travail doivent viser les objets réellement chargés ; une pose assise requiert une approche libre et un ancrage d’assise distinct, sans enlever la collision du fauteuil.

`art/ambience.ts` possède déjà les images lumineuses des lanternes, leur intensité selon l’horloge et les réglages de mouvement. Toute modulation par Augustin doit passer par ces lumières, sans nouveau halo permanent. Plusieurs flammes sont intégrées aux images de décor : l’extinction absolue d’un sprite peint éclairé n’est pas réalisable par un simple changement d’alpha du halo ; cette limite doit être explicitement contrôlée.

Sauvegarde v2 inchangée : les gestes ordinaires sont transitoires et recalculés, pas une nouvelle progression. Les dialogues sources, les choix et événements restent inchangés. Les textures générales, bâtiments et mobilier sont protégés.

## Ordre de travail

1. Prototype complet de lecture de Célestine avec phases d’approche, alignement, ouverture, lecture, fermeture et interruption/reprise.
2. Extraire un moteur de séquences déclaratives partagé, dont les accessoires, durées, orientations, interruptions et marqueurs synchronisés sont configurables.
3. Intégrer les autres activités seulement lorsque leurs poses réelles et ancrages sont contrôlés visuellement.
4. Vérifier les collisions, anciennes sauvegardes, horaires, accessibilité PC/mobile, réduction des mouvements et performances.
5. Galerie animée réelle et archive légère. Aucun déploiement ni fusion.

Les feuilles complémentaires sont des ressources nouvelles à valider artistiquement, jamais des remplacements des personnages originaux. Aucune activité manquante ne sera annoncée terminée avec un simple sprite debout déplacé ou rendu transparent.
