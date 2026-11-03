# Phase B — village, rencontres et activités

Cette version poursuit la Phase A sur `feature/phase-b`. Les ressources artistiques restent provisoires. La PR ne doit pas être fusionnée dans `main` sans l’accord de l’utilisateur.

## Parcours jouable

La première quête avec Loyal reste disponible pour une nouvelle partie. Les anciennes parties reprennent à la même étape. On peut aussi explorer librement et rencontrer :

| Habitants / lieu              | Activités                                                           | Souvenir fictif |
| ----------------------------- | ------------------------------------------------------------------- | --------------- |
| Loyal / maison au sud-est     | Lettre et retour au sapin, quête Phase A                            | Jour 1          |
| Mira / bibliothèque à l’ouest | Marque-page, énigme à choix, photographie en neuf fragments         | Jour 2          |
| Oscar / atelier au nord-est   | Ruban, trois commandes d’emballage avec choix du papier et du ruban | Jour 3          |
| Alma / auberge au nord        | Quatre paires de cartes mémoire                                     | Jour 4          |
| Noé / place au sud-est        | Visite des quatre maisons dans l’ordre du journal                   | Jour 5          |

Parler à chaque habitant et accepter sa proposition active sa quête. Les objectifs sont ordonnés, consultables dans le journal ; les jeux peuvent être rejoués si une activité a été faite avant l’étape correspondante. Une récompense ne peut être attribuée qu’une fois. Il faut revenir parler au commanditaire après les activités. Les autres jours sont des emplacements réservés, sans surprise réelle dans le code.

Les portes s’abordent par le sud. Les meubles, bâtiments et socles des grands objets bloquent le déplacement. Les interactions vérifient la distance et la visibilité. Loyal reste disponible en l’absence d’un autre objet ou habitant proche, pour éviter qu’il monopolise le bouton d’interaction.

## Les trois jeux

- **Photographie** : sélectionner deux fragments pour échanger leur position. Les neuf doivent retrouver leur ordre. Les numéros sont une aide volontaire. Illustration vectorielle simple de démonstration.
- **Mémoire** : retourner deux cartes, retrouver quatre paires. Une erreur masque à nouveau les deux cartes après un court délai ; les entrées sont verrouillées pendant ce délai. Pas de chronomètre.
- **Emballage** : lire trois commandes, choisir papier et ruban, emballer. Une erreur laisse réessayer la même commande. Les deux matériaux sont vérifiés.

Les commandes utilisent des boutons accessibles au clavier et au toucher. Les jeux mettent le monde en pause. Quitter abandonne seulement la manche en cours ; les quêtes, souvenirs et meilleurs scores déjà gagnés restent sauvegardés. Les manches inachevées ne sont pas reprises au milieu d’une partie.

## Monde vivant

Quatre PNJ humains suivent des trajets simples sans traverser le mobilier. Ils attendent lorsque Debby est à portée de conversation et reprennent leur trajet quand elle s’éloigne. Leurs déplacements et vitesses changent à la nuit ; Noé inspecte la place puis entretient les lanternes. Le cycle visuel fictif dure trois minutes (aurore, jour, crépuscule, nuit) et sa position est sauvegardée. Les conversations, le journal et les jeux arrêtent ce temps de jeu. Cela ne représente pas le calendrier réel.

Neige limitée à 36 particules, halos de lanternes, oscillations simples des PNJ, réactions de Loyal et ornements du sapin selon les étoiles. Le sol du village est précalculé dans une texture, en un lot de dessins groupés, plutôt qu’affiché au moyen de 3 072 objets distincts. Aucune nouvelle ressource artistique définitive.

## Sauvegardes

La base IndexedDB `etoilebois`, store `saves`, est conservée. La Phase B lit d’abord la clé `phase-b` (schéma 2), sinon migre `phase-a` (schéma 1). Elle préserve la salle, la position et chacune des cinq étapes possibles de Phase A. La clé originale reste intacte.

Le schéma 2 ajoute quêtes, objets, drapeaux, étoiles, meilleurs scores, temps du monde et historique des choix. Le nœud de dialogue courant est enregistré et repris après rechargement. Une version inconnue ou des données invalides sont rejetées ; si possible, la sauvegarde Phase A est alors utilisée. Une erreur de stockage est signalée dans l’interface.

## Extension par les données

`src/rpg/quests.ts` contient les définitions et le moteur. Une quête donne un identifiant, un titre, un jour de démonstration et une liste d’objectifs `{ kind, target, label }`. Les types reconnus sont `talk`, `explore`, `find`, `solve`, `minigame` et `interact`. Le moteur consomme les événements, avance uniquement l’objectif attendu des quêtes actives et déduplique les récompenses. Ajouter un jour ne demande pas de modifier ce moteur.

`src/rpg/dialogue.ts` définit des graphes de nœuds, choix et effets. Les conditions testent objets, drapeaux et états de quêtes, avec négation. Les effets peuvent accepter une quête, ajouter un objet/drapeau et émettre un événement. Les réponses disponibles dépendent de la progression. Les intérieurs et les trajets sont définis dans `src/rpg/world.ts` ; les règles des jeux sont séparées dans `src/rpg/minigames.ts`.

## Frontière du calendrier réel

`createServerCalendar()` prépare un client pour :

- `GET /api/advent` → `{ "days": [1, 2] }`, liste décidée par le serveur.
- `GET /api/advent/2` → `{ "text": "contenu autorisé" }` ou refus HTTP.

Les appels utilisent les identifiants de session de même origine et désactivent le cache. Le serveur devra authentifier Debby, déterminer les ouvertures avec une horloge fiable en **Europe/Paris**, autoriser chaque lecture et ne jamais envoyer les contenus verrouillés. Aucun endpoint réel, compte utilisateur, authentification ni contenu secret n’est fourni dans cette phase. Les étoiles locales et l’heure du téléphone ne prouvent aucune autorisation côté serveur.

## Lancer et vérifier

Node.js 24, puis `npm ci`, `npm run dev`. Vérifications : `npm test`, `npm run build`, `npm run test:e2e`. Le workflow GitHub Actions exécute également les parcours sous Chromium Linux. Les anciens tests Phase A restent dans la suite. Les tests Phase B démarrent depuis une sauvegarde Phase A, puis parcourent le monde au clavier et résolvent les jeux par leur interface publique, sans téléportation ni modification de la progression.

Les captures sont enregistrées dans `docs/screenshots/phase-b-*`. Le rapport final distingue validation locale, validation CI et limites. Les essais mobiles simulent Chrome en 390 × 844 ; une vérification sur iPhone/Safari et Android physiques reste nécessaire avant déploiement.
