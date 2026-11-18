# Lot B — Jours 7 à 12

Base propre vérifiée : `feature/production-days-02-06`, commit `c45280cb4851e45547109f1ae5d810f9778c8661`. Le créateur a validé artistiquement le Lot A. Branche de livraison : `feature/production-days-07-12`. Les travaux E.2.1 et Lot A sont conservés. Aucune fusion ni opération de production. Implémentation et tests : commit `813387808aa28f3ef1e4dbf2a02d842cc0fa12c2` ; les rapports sont livrés dans le commit documentaire suivant.

## Audit et contenu privé

Rapports, recette et réserves privées du Lot A lus avant développement. Les six cahiers originaux sont accessibles et ont été examinés intégralement. La compilation privée retrouve les 468 répliques explicitement attribuées des Jours 7–12 ; seuls les espaces de mise en page sont normalisés. Les textes, choix originaux, solutions, extraits, média narratif et captures restent hors Git et hors CI publique.

Les six parcours principaux, activités, choix, restaurations et épilogues sont raccordés au jeu. Les cas où le PDF propose un choix sans écrire toutes ses réponses sont documentés en privé : conserver le choix et le dialogue commun, sans inventer la réplique manquante. Ce relevé de fidélité ne signifie pas que toutes les intentions de dessin/animation du cahier sont réalisées.

## Extensions réutilisables

- `FlowPresentation`, `FlowTask` et les réducteurs existants gèrent les activités, brouillons, choix, dialogues et checkpoints. Ajouts : cadran circulaire, pièces uniques, comparaisons illustrées, variantes autorisées par les conséquences antérieures et consultation d'image privée.
- Accompagnement d'un acteur avec navigation existante, distance de courtoisie, attente au point d'arrivée et checkpoint périodique. Les routines sont réservées durant l'accompagnement, puis libérées. Aucun nouveau moteur de déplacement.
- Trois régions supplémentaires, reliées physiquement par leurs portails et sorties : chemins d'accès déclaratifs, navigation, collisions et reprise. Les quatre intérieurs historiques et la géométrie du village restent préservés. Les nouveaux espaces réutilisent une partie du mobilier et des façades ; voir les réserves artistiques privées.
- Météo temporaire bornée aux budgets de particules existants ; présentation d'un réseau lumineux et seconde célébration cumulée fondée sur les étoiles déjà restaurées. Pas de seconde récompense ni d'étoiles ajoutées à l'atlas du sapin.
- `private-media.ts` réutilise le service Storage privé existant : URL signée, contrôle MIME, décodage et nettoyage à la fermeture. Aucun chemin de secours public. Les médias futurs sont refusés par le validateur et l'import SQL.
- La migration additive `202611180001_production_lot_b.sql` conserve les validateurs historiques, les versions et les progressions. Elle étend les activités, régions, positions d'accompagnement et conséquences autorisées. Les anciennes sauvegardes n'ont pas besoin d'être réinitialisées.
- Neuf PNG génériques supplémentaires, explicitement autorisés ; les originaux et l'image narrative sont séparés. Voir `ASSETS-LOT-B.md`. Les points audio supplémentaires réutilisent volume, muet et activation existants, sans musique protégée téléchargée.

## Défauts reproduits et corrections

Le suivi d'un personnage natif ne doit pas modifier seulement son sprite : la présentation historique réapplique sa position logique. L'accompagnement utilise maintenant cette position et la restaure après chargement. Le calcul d'itinéraire visait initialement la joueuse tout en l'évitant comme obstacle : il vise désormais un point libre proche. Les contrôles navigateur attendent le compagnon sans contourner cette mécanique.

Le rendu de courtoisie du monde arrêtait aussi le clip d'un résident réservé. Les frames de marche natives sont maintenant présentées après ce rendu ; le test contrôle qu'elles changent pendant l'accompagnement, sans créer de nouvelle silhouette. Les points audio déclaratifs passent par le même service que le Jour 1. Les trois lanternes existantes ne sont pas doublées : seuls les deux accessoires nécessaires aux autres points reçoivent une présentation supplémentaire.

Une transition de porte peut conserver brièvement son délai de protection. Le test attend le contrôle activé avant d'interagir ; ce délai existant n'est pas supprimé. Les actions facultatives conditionnelles ne font pas voyager le test vers une action qui n'est pas autorisée par les choix de cette partie.

La photographie narrative est privée, affichée en gros plan et jamais injectée dans les diagnostics de chaque frame. Les captures de cette consultation restent exclusivement dans la galerie privée. Un reflet qui recouvrait le ponton a été repositionné sur l'eau après contrôle visuel.

## Recette et limites

Les résultats exacts et la méthode de continuité sont consignés dans `RECETTE-LOT-B.md`. Les parcours utilisent le véritable build privé avec une fixture Auth/Storage/RPC stricte et PostgreSQL embarqué. Les déplacements passent par les contrôles du jeu et les activités par leurs interfaces ; aucune insertion directe d'étoiles pour les prérequis.

Les animations spécialisées absentes ne sont pas annoncées comme dessinées. Le nouveau personnage dispose de marche et d'attente ; certains gestes restent adaptés aux poses existantes. Aucun fichier musical autorisé fourni : fonctionnement silencieux conservé. Les adaptations d'identité, de lieu et de branches écrites sont détaillées dans `RESERVES-LOT-B.md` de la livraison privée et nécessitent la recette du créateur.

La réussite locale ne valide ni Supabase distant, ni Auth/CAPTCHA réel, ni le VPS, HTTPS ou Safari iOS. Les tests mobiles sont une émulation Chromium. Les avertissements historiques de build (imports JSON, références CSS copiées après build et taille de bundles) restent documentés ; ils ne sont pas présentés comme corrigés.

## Livraison et suite

Code et tests sur la branche dédiée ; guide d'import dans `DEPLOIEMENT-PRIVE.md`. La galerie autonome et les six scénarios compilés sont livrés séparément, hors dépôt. Consulter leurs empreintes et leurs réserves avant validation. Ne pas publier ces archives en pièces jointes publiques.

Les Jours 13–24 ne sont pas implémentés dans ce lot. Leur réalisation et toute intervention distante attendent une autorisation distincte. La priorité reste une chaîne complète et stable avant l'ouverture du 1er décembre ; l'estimation actualisée est dans `PLAN-30-NOVEMBRE.md`.
