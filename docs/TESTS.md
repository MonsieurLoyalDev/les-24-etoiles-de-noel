# Rapport de validation — Phase A

Exécution locale le 3 novembre 2026, Windows, Node.js 24.14.0, Chrome headless.

| Vérification                                | Résultat                                         |
| ------------------------------------------- | ------------------------------------------------ |
| TypeScript strict et build Vite production  | Réussis                                          |
| Vitest                                      | 7 tests réussis, 2 fichiers                      |
| Playwright PC 1280 × 800                    | Quête complète, rechargement et joystick réussis |
| Playwright mobile simulé 390 × 844          | Quête complète, rechargement et joystick réussis |
| Erreurs JavaScript dans le parcours complet | Aucune                                           |
| Audit npm après mise à jour de Vitest       | 0 vulnérabilité signalée                         |

Unitaires : progression ordonnée et idempotence ; collisions et glissement ; visibilité interdisant l’interaction à travers un mur ; validation des 3 072 tuiles ; rejet de sauvegardes invalides ; aller-retour IndexedDB ; régression garantissant que seuls x/y sont copiés depuis un objet Phaser.

E2E : le joueur ferme l’accueil, parle à Loyal, se déplace à la porte de sa maison, entre, rejoint et lit la lettre, ressort, revient au sapin, place l’étoile, recharge la page et retrouve la progression. Le journal contient 24 cases. Les déplacements au clavier attendent les coordonnées réellement atteintes, exposées en lecture seule sur le canvas. Le second parcours utilise le joystick et vérifie un déplacement réel et l’absence de débordement horizontal. Aucun raccourci de quête ni téléportation de test n’est utilisé.

## Corrections pendant la validation

La copie d’un objet Phaser par décomposition introduisait sa scène dans les données de position et faisait échouer `structuredClone`. Le déplacement construit désormais une position composée uniquement de nombres. Un test de régression couvre ce défaut. Les tests attendent aussi la fermeture effective des dialogues avant l’interaction suivante. La première CI Linux a révélé la fragilité des déplacements testés avec des durées fixes ; les tests attendent désormais les coordonnées atteintes sans modifier le jeu.

## Limites

Simulation mobile avec Chrome, pas de test sur téléphone physique ni Safari. Récupération du compagnon implémentée mais pas couverte par un scénario E2E où il serait volontairement coincé. Échecs/quota IndexedDB signalés dans l’interface mais non injectés dans les E2E. Le vrai calendrier n’est pas connecté. Vite signale le poids du chunk Phaser (~1,21 Mo non compressé, ~332 Ko gzip) ; le build aboutit. Aucune mesure exhaustive de performance sur téléphone modeste.

Les résultats GitHub Actions seront distincts des résultats locaux : consulter la PR et le workflow, sans supposer leur succès avant exécution.
