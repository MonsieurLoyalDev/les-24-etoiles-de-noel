# Recette Lot C — résultats locaux

## Environnement et méthode

Windows, Chromium via Chrome installé, rendu Canvas de repli pour la recette privée. PC 1920 × 1080 ; mobile Chromium émulé 390 × 844 avec tactile et réduction des mouvements. Les scénarios originaux sont lus uniquement depuis le workspace privé ; ils sont refusés par les tests en CI publique.

Les parcours navigateur utilisent le build privé réel et une fixture Auth/Storage/RPC stricte adossée à PostgreSQL embarqué. Les actions passent par les contrôles du jeu et les interfaces des activités. Les prérequis canoniques sont produits par les réducteurs/solveurs puis validés par les RPC existants, sans insertion directe d’étoiles.

## Commandes observées

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | Réussi |
| `npm run lint` | Réussi, aucun avertissement ESLint |
| `npm test`, sources privées autorisées localement | 38 fichiers réussis ; 281 tests réussis, 2 ignorés sous Windows, aucun échec |
| `npm run build` (sortie de recette séparée) | Réussi |
| `npm run build:private` avec configuration publique fictive contrôlée | Réussi ; 269 ressources vérifiées, octets identiques, démonstrations exclues |
| Build E2E des démonstrations historiques | Réussi ; réservé à la recette, jamais livré comme build privé |
| RPC / migrations | Six migrations exécutées dans PGlite ; chaîne canonique 1–16, Livre cumulatif, conséquences et refus du suivant vérifiés |
| Confidentialité | Recherche des fragments privés et empreintes de médias dans les fichiers publics et le build : aucun résultat trouvé lors du contrôle |

Les deux tests ignorés portent sur des commandes POSIX indisponibles sous Windows. Les tests de sources privées ont bien été exécutés, et non ignorés faute de source.

Les avertissements de build subsistent : attributs d’import JSON historiques, références CSS résolues au moment de la copie autorisée et bundles dépassant 500 ko. Les sorties de recette placées hors dépôt ne sont pas vidées automatiquement ; elles ne constituent pas un paquet de production. Aucune prétendue correction de taille de bundle n’est annoncée.

## Couverture spécifique

Les activités, brouillons, choix, reprise dans les dialogues et spectacles, récompense unique et Livre sont contrôlés. Les rencontres libres des deux dernières journées sont testées dans leurs six ordres avec les vrais réducteurs. Les projections héritées utilisent le choix autorisé antérieur, tandis qu’un aperçu isolé reste neutre.

La chaîne canonique 1–16 utilise les véritables scénarios autorisés et les vrais RPC sur PostgreSQL embarqué. Cela ne signifie pas qu’un unique enregistrement vidéo montre seize journées successives au clavier ; les parcours navigateur sont exécutés individuellement, et le canonique final part des prérequis produits par cette chaîne.

Le suivi reproduit l’ancienne position bloquée et vérifie les collisions à des pas de temps de 16,7, 50, 100 et 200 ms. Les activités facultatives finales ont des approches libres distinctes. Les sous-titres sont testés géométriquement pour les zooms 0,9, 1, 2 et 3 sur PC et téléphone.

## Échecs intermédiaires et corrections

Les premières recettes ont effectivement échoué : cinématique auto-suspendue, arrivée de rassemblement trop stricte, acteur momentanément absent, suivi coupant un coin, interactions facultatives superposées et sortie sélectionnant un PNJ proche. Les corrections applicatives sont décrites dans le rapport. La recette de sortie approche maintenant la porte par son côté libre, au lieu de supposer qu’une touche d’interaction choisit la porte même lorsqu’un PNJ est plus proche.

La fixture E.1 refusait aussi un endpoint nouvellement utilisé ; seule cette requête attendue a été ajoutée avec ses contrôles stricts. Une tentative de recette historique sur build normal ne disposait pas du mode développeur : la recette a été relancée sur le build E2E prévu pour cela. Un premier essai sur serveur de développement a été interrompu par HMR ; les recettes finales utilisent des builds fixes. Ces essais ne sont pas annoncés comme des validations réussies.

## Limites

Aucun Supabase distant, VPS, CAPTCHA réel, Safari iOS ou téléphone physique n’a été testé. Les mesures de performance jointes sont des intervalles `requestAnimationFrame` locaux sur 120 images, parfois pendant des recettes parallèles ; elles ne mesurent ni une autonomie mobile ni un débit garanti du moteur sur un autre appareil.

La fidélité des répliques ne remplace pas la validation artistique. Les branches principales et les reprises sont parcourues ; toutes les combinaisons de choix des seize journées ne font pas l’objet d’un parcours navigateur exhaustif. Les réserves privées identifient les gestes adaptés et l’absence d’enregistrements audio.


## Résultats navigateur finaux

| Périmètre | Résultat observé |
|---|---:|
| E.1 : ressources, MIME, rôles et véritables activités D.4.2, PC/mobile | 18 / 18 réussis |
| Jour 1 original : PC et mobile émulé | 2 / 2 réussis |
| Jours 2–12 : onze aperçus PC et Jour 12 canonique | 12 / 12 réussis |
| Jours 13–15 : trois aperçus, PC et mobile | 6 / 6 réussis |
| Jour 16 : aperçu et canonique, PC et mobile, après corrections | 4 / 4 réussis |
| Démonstrations historiques : 24 activités et calendrier/éditeur, PC/mobile | 4 / 4 réussis |

Total de couverture navigateur distincte validée : **46 cas réussis**, lors des exécutions ciblées consignées dans le workspace privé. Les six cas des Jours 13–15 ont réussi avant les derniers correctifs localisés au sous-titrage du concert et aux approches facultatives finales. Le Jour 16 a ensuite été rejoué intégralement sur le build privé final. Les fichiers `.last-run.json` des dernières recettes du Jour 16 et des Lots A/B indiquent `passed` et une liste d’échecs vide.

Le canonique du Jour 16 vérifie quinze étoiles pendant le concert, puis seize après l’unique restauration, le choix hérité, la page du Livre et le repère fermé. Les activités facultatives sont rejouées sans récompense supplémentaire. Les captures PC/mobile sont conservées uniquement dans la livraison privée.

## Temps écoulé

Branche créée le 18 novembre à 19:38:14 (Paris) ; préparation de livraison le 19 novembre 2026 à 07:31 (Paris). Amplitude murale : 11.89 heures, incluant les interruptions et l’attente nocturne. Le temps actif n’a pas été instrumenté ; cette amplitude ne doit pas être présentée comme une durée de développement continu.

## Échantillons de performance locaux

120 intervalles rAF par échantillon, en millisecondes. Ils ne constituent pas une mesure garantie des FPS du jeu.

| Capture | Médiane | P95 |
|---|---:|---:|
| `mobile-day-13-performance.json` | 4.5 | 6.5 |
| `mobile-day-14-performance.json` | 4.6 | 7.2 |
| `mobile-day-15-performance.json` | 4.2 | 4.3 |
| `mobile-day-16-performance.json` | 4.2 | 4.3 |
| `pc-day-13-performance.json` | 4.2 | 6.3 |
| `pc-day-14-performance.json` | 4.2 | 6.3 |
| `pc-day-15-performance.json` | 4.2 | 4.3 |
| `pc-day-16-performance.json` | 4.2 | 5.7 |

## Contrôle de la galerie

Vingt images décodées dans Chromium, aucune requête externe, échelle native vérifiée et absence de débordement à 390 px. Les exports WebP conservent exactement les pixels RGBA des PNG sources et leurs dimensions. Le rapport automatisé est inclus dans la galerie privée.

## Contrôle des archives

Les deux ZIP passent le contrôle CRC et le contrôle de leurs chemins ; aucun dossier node_modules, .git ou dist. Après extraction séparée, les quatre scénarios privés sont recompilés avec les seuls scripts et extraits livrés : les quatre JSON sont identiques octet pour octet aux sorties originales. Les deux médias privés inclus se décodent correctement. Tailles exactes et SHA-256 dans le manifeste privé `LIVRAISON.json`.
