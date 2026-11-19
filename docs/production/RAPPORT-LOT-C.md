# Lot C — Jours 13 à 16

## Base et périmètre

Branche : `feature/production-days-13-16`, créée depuis le Lot B approuvé, commit `12de3284969fa655109238400c83d8d544cc1499`. Les Lots A/B et E.2.1 sont conservés. Implémentation et tests : `32774f319ea6b07b51562681c38ad9a92b7bc8ef` ; rapports dans le commit documentaire suivant. Aucune fusion, aucun déploiement et aucune modification de Supabase ou du VPS distant.

Les quatre cahiers originaux (pages 122–165 du PDF de référence) ont été lus avant développement. La compilation privée conserve les 335 répliques explicitement attribuées : 74, 85, 84 et 92 par journée. Ce relevé de fidélité ne vaut pas validation artistique de toutes les intentions d’animation. Les textes, solutions, compilations, matrices détaillées et captures restent hors Git et hors CI publique.

## Fonctionnement livré

Quatre parcours de dix séquences déclaratives chacun, avec activités réellement jouables, dialogues d’origine, choix persistants, rencontres libres lorsqu’elles sont prévues, checkpoints et reprises. Les épilogues obligatoires restent requis ; les moments facultatifs ne bloquent pas le lendemain. La restauration et le Livre passent par le contrat existant et les preuves serveur, sans attribution parallèle locale.

Le moteur existant est étendu par des activités illustrées à étapes, des présentations temporelles reprenables, des conséquences inter-épisodes, des confidences filtrées par consentement et un repère de connaissance en lecture seule. Il n’existe ni second calendrier, ni second moteur de sauvegarde ou de dialogue. Les projections visuelles permanentes sont dérivées de la progression autorisée.

Trois petites régions additives utilisent des points d’approche nommés et les collisions existantes : les quatre intérieurs historiques, les bâtiments, la géométrie du village et les textures validées ne sont pas redessinés. Les nouveaux PNG sont génériques ; une illustration narrative fictive est conservée dans les médias privés. Voir `ASSETS-LOT-C.md`.

Les spectacles utilisent des budgets de particules bornés, le réglage graphique existant et la réduction des mouvements. Les transitions d’ambiance utilisent l’horloge fictive existante et restaurent son état à la sortie. Les compositions sont créées à l’initialisation, pas recalculées comme textures à chaque frame.

## Compatibilité et sécurité

Migration additive `202611180002_production_lot_c.sql` : extension bornée des validateurs et du contexte autorisé, sans réinitialisation de progression. Les fonctions internes restent privées. Les états brouillon/privé ne livrent aucun corps de correspondance ; seuls les éléments volontairement partagés alimentent le Livre. Les épisodes futurs ne sont ni importés ni déverrouillés par les nouveaux repères.

Le build privé conserve son allowlist, refuse les configurations dangereuses et exclut les modules de démonstration. Les contrôles locaux ne valident pas Auth/CAPTCHA, RLS/Storage Supabase distant, VPS/HTTPS ou Safari iOS réel.

## Défauts reproduits et corrigés

- Une cinématique narrative pouvait suspendre sa propre horloge par le verrou global : la présentation garde sa responsabilité, tandis que menus et dialogues suspendent toujours le temps actif.
- Le rassemblement utilisait un point d’attente différent du trajet et une tolérance trop stricte : le même point accessible sert au déplacement et à l’arrivée.
- Une transition intérieure pouvait encore viser un acteur absent de la pièce : l’objectif attend désormais le personnage réellement présent.
- Le suivi pouvait couper un angle en abandonnant un point de route à moins d’un pixel et rester bloqué contre une façade. Le déplacement consomme maintenant le dernier sous-pixel avant de tourner, sans modifier les collisions. Le test reproduit l’ancienne position bloquée à quatre pas de temps.
- La fixture privée historique refusait la lecture de l’historique autorisé : ajout du seul endpoint attendu, avec contrôles de rôle/arguments conservés. Les requêtes inconnues restent refusées.
- Trois activités facultatives partageaient exactement un même point : leurs approches privées sont maintenant distinctes et contrôlées sur la navigation réelle, sans déplacement de décor.
- Le zoom de caméra pouvait décaler les sous-titres hors écran : leur ancrage et leur échelle sont maintenant compensés, avec un test à quatre zooms sur deux résolutions.

## Recette, livraison et limites

Consulter `RECETTE-LOT-C.md` pour les commandes et résultats réellement observés. La continuité canonique utilise PostgreSQL embarqué et les réducteurs/solveurs réels, sans insertion directe de récompenses. Les recettes navigateur utilisent le vrai build privé, les contrôles de jeu et une fixture Auth/Storage/RPC stricte.

La galerie autonome et les quatre scénarios compilés sont livrés en deux archives privées distinctes, hors dépôt public. Les réserves narratives et artistiques détaillées les accompagnent. Aucun morceau musical ou enregistrement vocal n’est fourni ; les points audio et réglages existent, le fonctionnement reste silencieux. Les gestes sans frames dédiées ne sont pas déclarés comme animations finales. La validation artistique du Lot C reste à effectuer par le créateur.

Les Jours 17–24 ne sont pas commencés. Toute suite, fusion ou intervention distante attend une autorisation distincte.
