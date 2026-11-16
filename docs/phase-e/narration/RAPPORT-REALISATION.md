# E.1 narrative — rapport de réalisation

Base `547fbeb657abadcadca85fbac7a73a5c9c3615c8`, branche `feature/phase-e1-narrative-foundation`. Aucun déploiement ni fusion. Les sept rapports E.0 et le rapport E.1 de livraison privée sont conservés.

## Réalisé

- Moteur déclaratif d'épisodes, scènes, objectifs ordonnés, choix immuables, conditions et faits découverts. Registre public de 24 identifiants, sans scénario futur embarqué.
- Adaptateur optionnel Phaser : déplacements existants, réservations temporaires des habitants, dialogues/portraits existants, indices successifs, caméra et effets temporaires, sapin utilisant son atlas intact.
- Parcours principal du Jour 1 : accueil, trois rencontres libres, découverte du sapin, dispersion, trois indices ordonnés, restitution d'une étoile, conclusion dans la maison et ouverture du Livre. Exploration réelle, pas un écran récapitulatif.
- Célestine conserve son identité `mira`, traverse la porte de la bibliothèque pour participer puis reprend sa routine. Loyal et Flocon sont conservés ; aucun nouveau personnage ou asset graphique.
- Journal enrichi avec texte privé déverrouillé, choix réels, habitants rencontrés et pièces visitées. Suivi discret masqué pendant les conversations et le journal.
- Checkpoints atomiques IndexedDB, reprise, conflits explicites ; sessions privées/aperçu/relecture séparées. Sauvegardes historiques et formats inchangés.
- Migration SQL : contenu privé versionné immuable, accès membres/administrateur, dates contrôlées au serveur, récompense dédupliquée et validation des checkpoints. Aucun texte narratif ou secret ajouté à la migration.

Les 67 répliques parlées compilées du Jour 1 se retrouvent toutes dans le PDF après normalisation des espaces et apostrophes ; deux invites de choix sont des éléments d'interface. Le PDF de 279 pages a été extrait intégralement ; le contrôle narratif détaillé porte sur les pages 3 à 13, pas sur une prétendue validation des 23 autres cahiers.

## Fichiers

Nouveaux modules `src/narrative` : catalogue, réducteur, validation, checkpoints, API, atelier local DEV, adaptateur Phaser et interface. Migration `202611160001_narrative.sql`. Tests de fondation, sécurité, parcours auteur et build privé ; fixture technique uniquement. Configuration `playwright.author.config.ts`.

Intégration localisée dans `src/game/Game.ts`, `src/world/runtime.ts`, `src/advent/Hub.tsx`, `src/main.tsx`, `src/style.css` et garde du build dans `vite.config.ts`. Les ressources, géométries, intérieurs et sauvegardes ne sont pas modifiés.

Le contrôle historique D35 comparait aussi l'empreinte complète de trois fichiers d'interface. Leur modification autorisée empêchait ce contrôle de passer. Le manifeste historique est conservé intact ; `PRESERVATION-UI.json` fixe les nouvelles empreintes de ces seuls trois fichiers. Tous les autres fichiers restent contrôlés par les empreintes historiques.

## Corrections constatées en recette

Le test initial devait fermer l'accueil historique avant d'ouvrir le calendrier, marcher vers le point d'accueil avant d'attendre les compagnons, et utiliser le libellé réel du bouton Livre. Un PNJ voisin pouvait prendre la priorité sur un indice : priorité corrigée pour le point narratif actif à portée. Un marqueur pouvait rester visible après sa scène : visibilité bornée. Le retour hors aventure de Célestine rétablit une position intérieure sûre. Les comparaisons de diagnostics tiennent compte de la pause du jeu pendant le journal. Le suivi d'objectif ne recouvre plus les dialogues. Les captures attendent la fin de la transition d'interface.

## Limites à ne pas confondre avec des validations

Le parcours principal est implémenté ; **la mise en scène complète du cahier n'est pas déclarée terminée**. Les poses spécifiques de couple assis, ajustement des lunettes, certaines animations romantiques et les thèmes musicaux dédiés ne sont pas disponibles/validés dans cette livraison. Les interactions facultatives détaillées du cahier ne sont pas toutes réalisées. La dispersion et la restitution utilisent des effets existants ; elles ne constituent pas toutes les animations spécialisées décrites par le PDF.

La durée cible de 35 minutes n'est pas validée auprès d'un joueur ; un parcours automatisé qui connaît les lieux ne mesure pas cette durée. Aucune mesure comparative FPS sur matériel physique n'est revendiquée. Mobile signifie Chrome émulé, pas Safari iOS. Auth/Storage sont des fixtures dans les tests ; Supabase réel, VPS, HTTPS du domaine et import de production ne sont pas validés. Les 23 épisodes suivants restent à intégrer. La protection serveur des dates ne transforme pas les événements envoyés par un client en preuve anti-triche de chaque geste.

La prochaine étape proposée consiste à valider ce premier parcours, puis terminer ses poses, activités facultatives et rythme avant l'intégration du Jour 2. Aucune nouvelle phase n'est commencée automatiquement.

## Résultats

| Vérification exécutée | Résultat |
|---|---|
| `npx tsc --noEmit` | Code 0 |
| `npm run lint` | Code 0 |
| `npm test` | 220 réussis, 0 échoué, 2 ignorés Windows, 28 fichiers ; 5,14 s pour le dernier lot |
| `npm run build` | Code 0 |
| `npm run build:private`, configuration publique fictive de recette | Code 0 ; 225 ressources exactes, modules de démonstration et atelier auteur exclus |
| Parcours auteur avec le véritable cahier privé compilé du PDF | 2/2 PC et mobile émulé, sept scènes, rencontres, indices, choix, restitution, livre, reprise après rechargement ; dernier lot 1,8 min |
| Nouveau parcours du build privé avec RPC réelles exécutées dans PGlite et Auth/Storage de fixture | 2/2 PC/mobile ; 18 s ; choix, checkpoint et reprise |
| Suite privée historique `release.spec.ts` | 16/16 PC/mobile ; 3,4 min ; MIME/octets, animations D.4.2, interruptions/reprise, autorisations, aperçu et refus des accès |
| Contrôle de fidélité du cahier | 67/67 répliques normalisées retrouvées dans le PDF |
| Recherche de fuite des longues répliques privées dans les sources et le bundle privé | Aucun résultat pour les 31 répliques de plus de 45 caractères ; contrôle ciblé, pas un audit universel de secrets |

Les tests unitaires incluent les 24 activités fictives historiques, sauvegardes, mini-jeux, navigation, routines et sécurité SQL. Ils ne prétendent pas valider 24 nouveaux épisodes narratifs. Les deux tests ignorés concernent les opérations POSIX indisponibles sous Windows.

Les premiers essais navigateur ont échoué pendant la mise au point des interactions et des sélecteurs. Un parcours mobile a aussi rencontré un angle dans le pilote de navigation : il recalcule désormais une fois l'itinéraire à partir de la position réellement mesurée, avec les mêmes collisions et touches. Aucun placement direct du joueur ne contourne les déplacements. Les résultats du tableau sont ceux des derniers lots terminés, pas ceux des essais échoués.

Avertissements de compilation conservés : taille du chunk Phaser et du bundle principal ; import JSON avec attributs hétérogènes dans le terrain existant ; chemins CSS d'assets copiés après compilation privée. Le contrôle final des 225 ressources et les tests MIME passent. Sans configuration Auth/CAPTCHA, une compilation de contrôle peut réussir mais le paquet reste explicitement interdit à la livraison.

Les captures privées du jeu exécuté sont réunies dans une galerie HTML locale hors dépôt. Les WebP sont sans perte, sans redimensionnement ; comparaison RGBA exacte avec les PNG. Les captures historiques E.1 produites à nouveau par la recette ont été conservées à part puis leurs fichiers versionnés remis à l'état initial, pour ne pas remplacer la livraison précédente.

Archive locale de validation : `E1-NARRATION-VALIDATION.zip`, **11 743 097 octets** (11,74 Mo décimaux), 22 captures et HTML autonome. SHA-256 : `9fb2cd14a3fb8b332494d9cabb35f79ab85d0882d8ec0666af07358e35938ec5`. Cette archive privée n'est pas versionnée et ne doit pas être publiée sur GitHub.
