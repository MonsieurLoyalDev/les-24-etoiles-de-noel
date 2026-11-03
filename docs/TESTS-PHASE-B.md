# Validation Phase B — 3 novembre 2026

Version 0.2.0, Windows, Node.js 24.14.0, Chrome headless. La Phase A n’a pas été remplacée : sa quête et ses tests restent présents.

## Résultats locaux

| Commande / parcours | Résultat |
|---|---|
| `npm test` | **33 tests réussis**, 3 fichiers |
| `npm run build` | **TypeScript strict et build Vite réussis** |
| `npm run test:e2e` | **6 tests réussis**, environ 3 min 12 s |
| PC 1280 × 800 | Phase A, joystick, parcours Phase B complet réussis |
| Mobile simulé 390 × 844 | Phase A, joystick, parcours Phase B complet réussis |
| Erreurs JavaScript des parcours complets | Aucune |
| Audit npm | 0 vulnérabilité signalée |

### Ce qui est couvert

- Migration des cinq étapes de sauvegarde Phase A, conservation de salle/position/étoile, aller-retour du schéma 2, préservation de la clé d’origine, rejet de versions ou champs invalides.
- Objectifs ordonnés des cinq quêtes, absence de progression avant acceptation, conservation d’une quête déjà acceptée et récompenses non répétables.
- Conditions de dialogue, réponses incorrectes et correctes, effets, séparation des historiques des habitants et sérialisation du nœud courant.
- Photographie réellement remise en ordre, permutation sans perte de fragments, mémoire avec verrouillage des erreurs et paires reconnues, deux matériaux vérifiés pour chaque commande d’emballage.
- Collisions, visibilité, dimensions de carte, chemins des habitants libres de mobilier et comportements jour/nuit.
- Client du calendrier refusant les jours hors limites et respectant le refus du futur serveur ; aucun déverrouillage fondé sur l’horloge locale.

Le parcours Phase B part d’une **sauvegarde Phase A terminée**, puis se déplace réellement au clavier, sans téléporter Debby. Il accepte la quête de Noé, visite les quatre intérieurs, rencontre les habitants, retrouve les deux objets, essaie une mauvaise réponse à l’énigme puis la bonne, résout les trois jeux et retrouve cinq étoiles après rechargement. La mémoire est résolue en observant uniquement les cartes retournées dans l’interface, sans lire le paquet caché. Une commande erronée, l’abandon d’une photographie sans récompense, la reprise d’un dialogue après rechargement et le verrouillage des jours futurs sont également vérifiés.

## Captures livrées

`docs/screenshots/phase-b-{desktop|mobile}-{photo|memory|wrap|quests|village}.png` : dix captures. Les anciennes captures de quête sont actualisées par les tests de non-régression. Les interfaces des trois mini-jeux ont été inspectées visuellement aux deux formats.

## Corrections et limites

Les premiers essais ont ajusté le trajet de test pour contourner les arbres et le sapin solides. Le sélecteur d’une carte réunie a été corrigé pour tenir compte de son nom accessible changeant ; le test observait une carte qui avait déjà trouvé sa paire.

Le contrôle visuel a également corrigé une opacité de remplissage nulle qui masquait le voile de nuit. Le voile et les halos utilisent maintenant un remplissage opaque modulé par leur alpha ; les captures sont régénérées après cette correction.

La CI initiale a aussi révélé un démarrage trop coûteux sur un moteur WebGL logiciel : la construction du sol lançait un dessin séparé pour chaque tuile. Elle utilise maintenant `beginDraw` / `batchDrawFrame` / `endDraw`, avec un seul lot de construction. Les tests autorisent jusqu’à 20 secondes pour le premier chargement. La CI force SwiftShader ; la variable `SOFTWARE_GL=1` permet de reproduire ce mode localement. Ces options ne changent pas le navigateur utilisé par le joueur.

Une deuxième vérification Linux a montré que le plafonnement du temps de déplacement ralentissait Debby sur les grands écrans rendus très lentement. Les déplacements utilisent maintenant le temps écoulé jusqu’à 200 ms, avec des sous-pas de 3 px pour ne pas traverser les murs. Deux tests vérifient un déplacement rapide face à une paroi fine et une distance identique en une seconde à 5 et 60 images/seconde. Le trajet de Loyal est échantillonné par distance et consommé selon son budget de déplacement ; le parcours vérifie aussi qu’il reste près de Debby.

La simulation mobile utilise Chrome, pas Safari ni un téléphone physique. Aucun test de batterie, de FPS sur téléphone modeste ou de quota IndexedDB n’est revendiqué. Le rendu du sol est regroupé dans une texture et la neige limitée à 36 particules pour réduire le coût de rendu. Vite signale encore le poids du chunk Phaser (~1,21 Mo brut / 332 Ko gzip), sans empêcher le build.

La position et les choix d’une conversation sont repris ; une manche de mini-jeu inachevée recommence si elle est quittée ou si la page est rechargée. Les habitants suivent des trajets et comportements simples selon un cycle fictif de trois minutes ; ce n’est pas une simulation quotidienne réelle. Le backend et l’authentification du calendrier restent futurs. La sauvegarde est locale, sans synchronisation entre appareils.

## GitHub

[PR nº 2 — Phase B](https://github.com/MonsieurLoyalDev/les-24-etoiles-de-noel/pull/2). La CI exécute les mêmes tests et le build sous Linux/Chromium et publie les captures ainsi que les traces d’échec. Consulter les vérifications de la PR pour leur conclusion distante, distincte des résultats locaux ci-dessus. La branche est `feature/phase-b` ; **aucune fusion dans `main` sans accord explicite**.


