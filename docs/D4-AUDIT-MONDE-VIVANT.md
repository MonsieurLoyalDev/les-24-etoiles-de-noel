# D.4 — Audit du monde vivant

Référence : correctif de composition f3e3472, version 0.7.5. D.4.1 uniquement. Audit réalisé avant modification du moteur. Les fichiers de référence et leurs empreintes sont inventoriés dans `docs/d41/BASELINE.json`.

## Population réellement présente

| Identifiant stable | Nom affiché | Nature validée | Présence initiale | Rôle/interactions existants |
|---|---|---|---|---|
| player | Debby | Humaine, tenue hivernale et lunettes validées | Position sauvegardée | Jouable, quêtes, 24 activités et dialogues |
| loyal | Loyal | Humain, tenue hivernale et lunettes validées | Compagnon dans toutes les pièces | Première quête, suivi, réactions, cache-cache et final |
| noe | Augustin | Humain, atlas V4 + attente V5 | Place : 1070,760 puis 1100,735 et 1090,800 | Gardien des lanternes ; dialogue `noe`, quête `tour` |
| mira | Célestine | Humaine, atlas V1 | Bibliothèque : 100,230 | Bibliothécaire ; dialogue `mira`, quête `album` |
| oscar | Basile | Humain, atlas V1 | Atelier : 100,230 | Artisan ; dialogue `oscar`, quête `parcels` |
| alma | Madeleine | Humaine, atlas V7 | Auberge : 100,230 | Aubergiste ; dialogue `alma`, quête `memories` |
| emile | Émile | Humain, atlas V1 | Village : 750,700 | Présence visuelle animée ; enseigne de poste ; pas encore de dialogue/quête dans le moteur |
| flocon | Flocon | Petit renard, atlas V4 | Village : 1390,635 | Présence visuelle animée ; pas un citoyen générique |

Sources croisées : `rpg/world.ts`, `art/actors.ts`, `art/catalog.json`, `game/Game.ts`, `art/tag-layout.ts`, `docs/graphismes/CORRECTIONS-D1.md`. Le code utilise **Augustin**, jamais Augustine. Les sept humains et Flocon restent humains/renard ; la proposition anthropomorphe ne les remplace pas. Les caractéristiques psychologiques non déclarées ne sont pas inventées.

Les quatre habitants de `citizens` sont réellement créés ; Émile et Flocon sont créés séparément. Aucun n'est nouveau parce qu'absent d'une capture. Les clés historiques mira/oscar/alma/noe doivent rester stables malgré leurs anciens noms techniques.

## Animations et comportements

Les atlas proposent attente et quatre directions. Loyal utilise V19.1 en marche de profil et V9 ailleurs ; Augustin possède une attente V5. L'échelle humaine est 52 unités visibles, Flocon 31. Les sprites sont normalisés sur leurs pieds par `actorMetric` ; pas de sprites d'assise ni de gestes professionnels spécialisés validés.

Actuellement, quatre habitants suivent de petits parcours cycliques. Le sens et la vitesse changent la nuit ; `npcActivity` donne un libellé générique. `move` respecte les rectangles solides, mais aucun calcul de détour n'existe pour eux : un parcours direct peut rester bloqué contre un meuble. Les PNJ s'arrêtent près de Debby et tous sont suspendus pendant dialogue/menu, avec l'horloge. Émile/Flocon restent à leur place. Les noms se positionnent déjà selon la caméra et disparaissent pendant les dialogues.

## Monde, collisions et temps

Carte : 1920 × 1408, seize maisons, quatre lieux visitables, quatre quartiers, place, 38 chemins, cinq portillons. Le plan et la composition validés restent inchangés. Les façades complètes doivent aussi être considérées pour la navigation PNJ afin d'éviter les toits, en plus des socles physiques des décors. Le corps de référence est 12 × 8 unités (`blocked`), mouvements sous-échantillonnés tous les trois pixels. Les intérieurs D.3.3 ont des dimensions et volumes distincts, avec murs, annexes, mobilier et objets décoratifs solides.

Une seule horloge fictive : `Save.clock`, cycle 180000 ms. Aurore 0–44999, jour 45000–89999, crépuscule 90000–134999, nuit 135000–179999. Le temps n'avance que lorsque le jeu est actif ; delta plafonné à 200 ms. Une phase dure 45 secondes : les trajets et pauses doivent être dimensionnés en conséquence. Les lumières, neige, fumées et flammes utilisent déjà cette horloge et les réglages graphiques/réduction des mouvements.

## Dialogues, calendrier, sauvegarde

Les graphes existants sont réutilisables, conditionnels, avec effets et historique. Les quatre offres et leurs choix/événements restent intacts. Le prototype ajoute une salutation contextuelle sans enlever l'offre originale ; Émile reçoit un dialogue bref sans nouvelle quête. L'avent utilise l'API `advent/api.ts`, le mode privé Supabase, RLS et médias privés ; `calendar.ts` est un ancien adaptateur, pas le moteur actif de l'interface. Le temps fictif ne doit jamais déverrouiller des surprises. D.4.1 ne lit ni ne modifie leur contenu.

Sauvegarde locale IndexedDB `etoilebois`, store `saves`, clé `phase-b`, repli `phase-a`. Schéma v2, migration v1 déjà existante. Persistance toutes les quatre secondes, lors des interactions et à la fermeture/visibilité. Les routines ordinaires peuvent être recalculées ; les rencontres peuvent utiliser quelques flags `world:met:<id>` dans le format actuel, sans nouveau schéma, sans suppression de flags, sans perte des conversations/quêtes/étoiles. Les données de l'Avent restent séparées dans ses mécanismes existants.

## Performances et périmètre de validation

Référence déjà exécutée sur f3e3472 : TypeScript, lint, builds, 170 unités réussies (2 POSIX ignorées), 10 cas navigateur ciblés PC/mobile émulé. D.4.1 ajoute des mesures à son prototype ; ces résultats antérieurs ne sont pas présentés comme des tests du nouveau code. Les atlas et décors sont réutilisés ; pas de génération d'assets ni d'ajout de foule.

Risques : ancien identifiant renommé par erreur ; PNJ de quête absent au mauvais moment ; navigation dans les toits ; socles fins des clôtures ; arrêt de routine non repris après un dialogue ; conservation d'une réservation morte ; durée de trajet supérieure à 45 s ; coût des recherches de chemins ; confusion entre horloge fictive et sécurité serveur. Réponses prévues dans le plan ci-dessous et tests ciblés.

## Prototype vertical retenu

1. **Augustin/noe**, place : rondes vers les lanternes existantes, surveillance et repos debout selon l'heure. Dialogue de quête inchangé, introduction contextuelle.
2. **Émile/emile**, extérieur : tournée vers deux boîtes aux lettres existantes, pauses d'observation du courrier et retour près de son point de départ. Nouvelle interaction simple, sans quête.
3. **Célestine/mira**, bibliothèque : déplacements entre comptoir, rayonnages et lecture ; toujours disponible dans la pièce. Dialogue et quête `album` conservés.

Basile et Madeleine conservent leur présence et leur comportement actuel ; Loyal et Flocon restent gérés par leurs systèmes dédiés. Les trois prototypes utilisent exclusivement leurs atlas existants. Les états métier sont des déplacements et observations crédibles, pas une animation de sciage, de lecture gestuelle ou d'assise inventée.

## Architecture et règles proposées

- `world/registry.ts` : profils stables et horaires déclaratifs, quatre périodes issues de `period`.
- `world/navigation.ts` : grille de huit pixels, A* à quatre voisins, segment validé, préférence pour les chemins existants, façades/solides pris en compte. Cache borné, nombre de recherches limité, pas de grille reconstruite chaque frame.
- `world/points.ts` : positions d'approche réelles, orientation et capacité. Réservations avec libération ; bancs à deux points préparés mais assise désactivée tant que les animations manquent.
- `world/runtime.ts` : états IDLE/WALKING/OBSERVING/RESTING/TALKING_TO_PLAYER, temps de séjour, décisions au changement de période/fin d'activité, pause/reprise et détection de blocage. Pas de téléportation visible ; en échec, attente et nouvel itinéraire plutôt que traverser un obstacle.
- Adaptation localisée de `game/Game.ts` et présentation séparée : sprites natifs, profondeur par les pieds, indications d'activité discrètes, diagnostic en lecture seule pour les tests. Pas de modification du HUD ni des composants de dialogue.
- Simulation logique hors caméra à fréquence réduite ; animations rendues seulement pour les sprites utiles. Les positions en mémoire survivent aux changements de pièce ; à la reprise d'une partie, les routines sont recalculées depuis l'horloge sauvegardée.

## Plan de réalisation et limites de D.4.1

A. Audit/inventaire/catalogue/implantation. B. Navigation et réservations testées en pur TypeScript. C. Trois routines, dialogue interrompant/reprenant l'activité et mémorisation des rencontres. D. Intégration dans le jeu et contrôle des approches sur les collisions réelles. E. Tests unitaires et navigateur, sauvegardes anciennes, calendrier/mini-jeux en régression, performances et galerie légère de captures et courtes démonstrations réelles.

Les nouveaux habitants restent **des propositions documentées** jusqu'à D.4.2 et validation. Assises, transitions autonomes entre pièces, gestes professionnels spécialisés, scènes sociales synchronisées, micro-événements et visiteurs datés ne sont pas déclarés terminés en D.4.1. Ils relèvent de D.4.2 à D.4.5. Validation artistique et fonctionnelle attendue avant généralisation ; aucune fusion, aucun déploiement.

## Constats mesurés et réalisation D.4.1

Le relevé d’exécution initial `d41/BASELINE-RUNTIME.json` a chargé les cinq scènes : aucun habitant initial n’est dans un obstacle. Le p95 RAF de référence est de 4,3 ms sur ce poste ; ce n’est pas une mesure sur téléphone physique. Le prototype comporte dix points d’approche et trois profils. La géométrie et les assets ne sont pas édités.

L’orientation contextuelle est isolée dans `world/facing.ts` : `art/actors.ts` est conservé intégralement. La présentation n’affiche au maximum qu’une indication d’activité, brièvement, hors des noms/enseignes et des dialogues. Les réservations sont libérées aux changements d’activité ; les places d’assise génériques ne sont pas utilisées sans animation validée.

| Habitants du prototype | Aurore | Jour | Crépuscule | Nuit |
|---|---|---|---|---|
| Augustin | Lanternes cadeaux / marché | Marché / lumières | Lanterne du coin convivial / sapin | Repos debout / ronde |
| Émile | Boîte des Livres | Boîte des Veillées | Retour de tournée | Repos au départ |
| Célestine | Rayons / accueil | Accueil / livre | Livre / rayons | Accueil calme |

Les visites ont des pauses de 7 à 18 secondes ; une variation déterministe inférieure à une seconde évite une répétition parfaitement mécanique. Les trajets peuvent occuper une partie importante d’une période de 45 secondes. Le PNJ réévalue sa destination à la période suivante plutôt que d’ignorer l’horloge. L’approche du joueur interrompt temporairement la marche ; une conversation suspend l’horloge et la routine. Les positions ordinaires ne sont pas enregistrées.

Navigation : grille statique de 8 px, hachage spatial des obstacles, cache de 64 itinéraires maximum, une recherche au plus toutes les 250 ms. Hors caméra, la marche est simulée par lots d’environ 250 ms, sans animer les sprites invisibles. Le prototype possède un évitement local et une reprise en cas de blocage ; la circulation dense d’une future population devra être validée séparément.

Les points exacts sont déclarés dans `world/points.ts`. Le schéma `d41/PLAN-REPARTITION.svg` représente les données de la carte, pas une capture du jeu. Les captures et leurs limites sont livrées dans la galerie de validation. Les tests de régression suivent désormais les positions réelles d’Augustin et de Célestine avec le navigateur indépendant déjà disponible, au lieu de présumer leur ancienne petite patrouille.
