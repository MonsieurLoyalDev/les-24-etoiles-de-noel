# D.4.2 — Ajouter et régler une activité

Le système prolonge D.4.1 ; il ne remplace ni l’horloge, ni la navigation, ni les dialogues.

## Modules

- `world/registry.ts` : identité, horaires et gestes sociaux autorisés. Les périodes et vitesses restent celles de D.4.1.
- `world/points.ts` : approche libre, regard, capacité et éventuelle projection d’assise. La position logique reste hors du meuble ; la pose dessinée rejoint son assise réservée.
- `world/activity-clips.ts` : feuille, orientation, catégorie, dessins d’entrée/boucle/sortie, durées, interruption et marqueur synchronisé. `loopOnce` empêche la réapparition d’une lettre déposée ou la répétition d’un allumage.
- `world/activities.ts` : liens habitant/point/activité et sessions transitoires, progression, interruption et reprise. Les catégories activité, réaction, sociale et spéciale partagent le même échantillonneur.
- `world/activity-presentation.ts` : chargement des trois atlas, échelle constante, ancrage par pose, retournement sans rotation, projection et premier plan du fauteuil. Aucun dessin d’accessoire temporaire flottant.
- `world/lanterns.ts` : réservation et état des trois lanternes existantes. `art/ambience.ts` consomme ce même état pour ses lumières et la teinte des objets d’origine. Aucun nouveau halo permanent.

## Ajouter un habitant ou un geste

1. Fournir une feuille RGBA transparente avec une vraie pose pour chaque image, puis son JSON d’atlas et ses ancrages. Ne pas fabriquer une assise en déplaçant une pose debout.
2. Enregistrer la feuille dans le registre `sheets` du présentateur. `referenceHeight` donne la référence de taille ; les personnages actuels restent à 52 unités debout. Une pose assise ou accroupie ne doit pas être renormalisée à la hauteur debout.
3. Déclarer le clip : images d’entrée, boucle et sortie, intervalles, interruption et éventuel marqueur. Les actions de dépôt/allumage sont à passage unique.
4. Déclarer un point d’approche avec sa capacité. Vérifier l’itinéraire réel et la portée des mains/outils. Ajouter, pour un fauteuil, le meuble exact, le décalage d’assise et les parties du meuble au premier plan dans `seatProjection`.
5. Lier le point et le profil au clip dans les données. Ajouter le point aux horaires seulement si le scénario l’autorise. Pas de copie du moteur pour un nouveau personnage.
6. Tester les images, l’ancrage retourné, l’entrée/sortie, l’interruption, la réduction des mouvements et la compatibilité des sauvegardes.

Les interactions avec Debby conservent E et le bouton tactile. L’approche interrompt le geste ; le dialogue reste déclenché par le joueur. Au fauteuil, le livre se referme et Célestine conserve sa pose assise. Ailleurs, la pose canonique orientée vers Debby reprend, sans accessoire temporaire. La fermeture du dialogue permet la reprise, ou le retour à la routine si le séjour se termine.

## Points adaptés sans modification du monde

| Point | Approche D.4.1 | Approche D.4.2 | Motif |
|---|---|---|---|
| Courrier des Livres | 213,422 | 173,446 | Viser l’ouverture de la boîte depuis son côté accessible, éviter la petite collision voisine |
| Courrier des Veillées | 1335,588 | 1315,588 | Placer l’enveloppe à hauteur de la boîte avec la pose de profil |
| Lanterne du marché | 807,775 | 805,764 | Contact de l’outil avec une lanterne de sol |
| Lanterne des cadeaux | 850,690 | 855,664 | Même contact, sans masquer la façade |
| Lanterne du coin convivial | 1040,868 | 1036,844 | Même contact avec la pose retournée vers la gauche |
| Fauteuil de la bibliothèque | — | 910,316 | Approche devant le meuble existant à 910,310 ; assise dessinée à 910,288 |

Les tracés, largeurs, solides, maisons, jardins et intérieurs ne sont pas déplacés. Au crépuscule, Célestine rejoint le fauteuil au lieu du poste de lecture du bureau, pendant le même créneau de 12 secondes. Les autres créneaux restent conservés.

## Éclairage

Les trois points d’Augustin utilisent des lanternes de sol existantes, pas des lampadaires inventés. À l’aurore il peut les éteindre ; au jour il inspecte ; au crépuscule il les allume ; la nuit l’état automatique garantit la lisibilité. Une lanterne déjà à l’état demandé produit une inspection, sans faux allumage. Le marqueur du geste commande une seule transition de 800 ms sur la lumière existante. Le réglage de réduction des mouvements affiche un état stable plutôt qu’un scintillement.

Les teintes ambrées peintes dans l’image de la lanterne ne sont pas remplacées par un nouveau dessin : l’extinction coupe sa lumière et refroidit sa teinte. Les autres lumières, le sapin, les fenêtres et les effets D.3 restent gérés par leur système original.

## Reproduction des contrôles

`npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build:e2e`, puis `ETB_E2E_BUILT=1 npm run test:e2e` (syntaxe de variable adaptée au shell). Les nouveaux cas sont dans `phase-d4-2.spec.ts` ; les anciens parcours de quêtes utilisent la position logique accessible des PNJ, notamment lorsqu’une pose occupe un fauteuil.

Les scripts de capture utilisent des parties de test éphémères et des ports locaux : 5185 pour le build D.4.2 et 5184 pour le build D.4.1 conservé à part. Ils n’écrivent aucune sauvegarde personnelle existante. `capture-d42.ts` enregistre les activités ; `capture-d42-comparisons.ts` les références et les écrans mobiles. La vidéo de dialogue inclut les véritables captures successives du jeu et de l’interface React ; les autres clips viennent du canvas Phaser.
