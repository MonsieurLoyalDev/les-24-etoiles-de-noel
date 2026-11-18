# Recette du Lot B

Base : `feature/production-days-02-06`, commit `c45280cb4851e45547109f1ae5d810f9778c8661`, arbre propre. Branche dédiée : `feature/production-days-07-12`. Le créateur a validé artistiquement le Lot A. Aucun service distant ne sera modifié.

Audit du 18 novembre 2026 : rapports, recette et réserves du Lot A lus ; les six cahiers privés sont accessibles et examinés. Le PDF reste la référence. Les liens et illustrations tiers présents dans le cahier ne constituent pas des assets autorisés à télécharger.

Réutilisation : réducteurs de quêtes et choix, dialogues RPG, FlowPresentation/FlowTask, checkpoints, RPC versionnés, régions additionnelles, navigation existante, routines et coordinateur lumineux. Aucun deuxième moteur de sauvegarde, dialogue ou calendrier.

Extensions nécessaires : régions reliées par des passages réellement traversables, activité de cadran, placements à usage unique, variantes conditionnées par les conséquences serveur, accompagnement d'un acteur, météo temporaire et présentation de la seconde constellation. Conserver les cartes validées et leurs ressources ; les adaptations d'identité et animations manquantes seront documentées séparément, hors spoilers publics.

## Résultats locaux — 18 novembre 2026

| Commande / contrôle | Résultat obtenu |
|---|---|
| `npx tsc --noEmit` | Réussi |
| `npm run lint` | Réussi |
| `npm test` | 266 réussis, 2 ignorés POSIX/Windows ; 35 fichiers réussis |
| Chaîne `tests/production-chain.test.ts` avec `ETB_PRODUCTION_SOURCE_DIR` privé | 1 réussi avec les douze scripts originaux ; vrais RPC sur PostgreSQL embarqué, douze preuves, Livre cumulatif et Jour 13 refusé |
| Validation des six JSON privés | 6 réussis ; 468 répliques attribuées retrouvées, aucune manquante |
| `npm run build -- --outDir ../../work/lot-b-normal-build` | Réussi dans une sortie séparée |
| `npm run build:private` | Réussi ; 244 ressources contrôlées, octets identiques, démonstration exclue |
| Playwright Lot B, PC 1920 × 1080 | 7/7 réussis : six aperçus complets et Jour 12 canonique ; série complète de 13,9 minutes |
| Contrôle PC après derniers raccords de présentation | 3/3 réussis : Jours 10–12 en aperçu, reprise des escortes, changement des frames natives, points audio et rendu final |
| Mobile secondaire, 390 × 844 | 3/3 réussis : Jours 8 et 12 en aperçu, puis Jour 12 canonique ; tactile, brouillons/reprise et réduction des mouvements |
| Régression du Lot A | 6/6 réussis sur le dernier build privé : Jours 2–6 en aperçu et Jour 6 canonique après les cinq précédents |
| Régression du vrai Jour 1 | 2/2 réussis, PC et mobile, avec script original privé : sept scènes, choix, indices, pauses des aides, reprise, étoile unique, Livre et exploration libre |
| Build privé, MIME, D.4.2 et droits E.1 | 18/18 réussis, PC et mobile : ressources réelles, fauteuil, interruptions, reprise, lettre, lanternes, dates, aperçu, anonymes et compte non invité |
| 24 activités historiques et sauvegardes | 4/4 réussis : PC et mobile, toutes les activités historiques, récompenses, finale, calendrier fermé en novembre et éditeur persistant |
| Galerie privée autonome | 18 images décodées hors réseau ; échelle native et affichage mobile vérifiés, pixels RGBA identiques après conversion sans perte |
| Confidentialité locale | Aucun des 1 265 fragments recherchés, ni le média privé, trouvé dans les fichiers publiables ou le bundle privé |

## Méthode et portée

Les parcours du Lot B utilisent le véritable build privé, les scripts originaux lus hors Git et une fixture stricte Auth/Storage/RPC appuyée sur PostgreSQL embarqué. Les cinq migrations sont exécutées localement. Le stockage vérifie Auth, chemin, durée de signature et RLS avant de servir le média. Aucun Supabase distant ni VPS n'est utilisé.

Les activités sont résolues dans leur interface ; la navigation utilise les touches du jeu et les collisions réelles. Les aperçus ne créent aucune preuve canonique. Pour le Jour 12 canonique, les prérequis 1–11 sont établis avec les vrais réducteurs et RPC, sans insertion directe d'étoiles. Le test SQL complémentaire enchaîne les douze journées et vérifie le verrou suivant. Cela ne prétend pas être une seule session clavier continue jouant les douze jours : les journées sont parcourues séparément dans le navigateur, puis leur continuité serveur est testée.

Les vérifications comprennent brouillon partiel puis rechargement, reprise d'un dialogue, choix/objectifs conservés, checkpoint d'accompagnement et reprise, restauration unique, activités facultatives rejouées sans récompense supplémentaire et absence de texture manquante. Les marqueurs de célébration ne sont acceptés que s'ils sont déclarés ; un marqueur arbitraire, un média futur/externe et une position de compagnon invalide sont refusés par les tests SQL.

Les premiers essais ont détecté puis permis de corriger deux défauts de suivi (position logique non déplacée et objectif de navigation confondu avec l'obstacle joueur) ainsi que le rejet SQL du marqueur de célébration. Les essais intermédiaires en échec ne sont pas présentés comme des succès. Les tests attendent le délai de porte existant et ne tentent pas les activités conditionnelles non autorisées par les choix courants. Le test d'escorte contrôle aussi le changement effectif des frames natives de marche.

## Conditions, performances et limites

Windows, Chrome headless/Chromium, rendu Canvas. Référence Lot B PC 1920 × 1080 ; contrôle secondaire mobile émulé 390 × 844, tactile sur les interactions/validations et réduction des mouvements. Les déplacements automatisés utilisent le clavier même en émulation mobile ; aucun parcours physique iPhone ou intégral au joystick n'est annoncé.

Les échantillons locaux couvrent 120 frames `requestAnimationFrame` en fin de parcours. Les mesures finales sont livrées avec la galerie privée. Ils ne mesurent pas le coût CPU/GPU exclusif et ne constituent ni un profil mémoire exhaustif ni une garantie de performance sur téléphone physique. Les animations coûteuses ne sont pas créées à chaque frame ; les décors sont reconstruits à l'initialisation/changement d'état.

Mesures observées : PC, médianes de 4,6 à 10,8 ms et p95 de 8,1 à 15,8 ms ; mobile émulé, médianes de 4,2 à 5,9 ms et p95 de 4,3 à 7,6 ms. Certains contrôles indépendants ont tourné simultanément sur des ports isolés ; ces mesures de cadence locale ne sont donc pas un benchmark normalisé. Aucun profil mémoire ou téléphone physique n’est annoncé.

Les parcours couvrent la branche de référence, les activités principales et les épilogues disponibles, sans prétendre à toutes les combinaisons de réponses. Les tests de réducteurs et les contrôles de branches complètent cette couverture. Les réponses non écrites et les intentions sans frames dédiées restent des réserves privées.

Avertissements conservés : attribut d'import JSON incohérent, chemins CSS résolus à l'exécution après copie contrôlée, chunks Vite supérieurs à 500 kB et sortie normale hors racine non vidée. Aucun effacement forcé de dossier n'a été effectué. Les ressources du build privé sont vérifiées après copie, pas seulement supposées présentes à partir de ces avertissements.

Pas de validation de Supabase réel, CAPTCHA distant, HTTPS, VPS ou Safari iOS. Aucun déploiement ni merge. La validation artistique du Lot B reste au créateur.

Le premier lancement isolé du Lot A utilisait une origine locale non autorisée par les fixtures et a été bloqué avant le chargement du jeu. La recette a été relancée sur l’origine locale déjà approuvée, sans élargir les protections ; les six cas passent. Ce rejet du banc de test ne constitue pas six défauts de gameplay.

Bilan : **40 cas navigateur distincts réussis**, plus trois reprises ciblées après les derniers raccords de présentation. Aucun échec fonctionnel connu ne reste dans le périmètre exécuté. La validation artistique et la recette distante restent distinctes. Les captures historiques régénérées par les tests ont été conservées en privé puis remises à leur état initial dans Git ; les rapports E.0/E.1 et leurs captures validées ne sont pas remplacés.

Temps mesuré : du 2026-11-18T17:14:26+01:00 au 2026-11-18T19:13:59+01:00, soit 119.6 minutes écoulées. Cela inclut audit, création limitée de ressources, développement, itérations et attentes des tests ; ce n’est pas un chronométrage du codage actif. Les difficultés et l’estimation prudente des Jours 13–24 sont détaillées dans PLAN-30-NOVEMBRE.md.
