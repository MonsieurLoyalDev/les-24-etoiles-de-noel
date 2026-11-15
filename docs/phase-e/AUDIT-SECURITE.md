# E.0 — Confidentialité, accès et sauvegardes

Analyse statique et tests locaux au commit `7001466`, 15 novembre 2026. Aucune connexion à un projet Supabase réel, aucun secret demandé ou publié, aucune configuration distante modifiée.

## Frontière de confidentialité

**Alerte P0 : l'API du connecteur GitHub retourne `visibility: public` pour `MonsieurLoyalDev/les-24-etoiles-de-noel` le 15 novembre pendant cet audit.** Le dépôt n'est donc pas attesté privé ; la valeur observée contredit cette exigence. Ne pas ajouter de données personnelles. Aucun changement de visibilité n'a été exécuté. Confirmer/corriger le réglage puis examiner l'exposition historique et révoquer les éventuels secrets exposés s'il y en a ; une conversion en privé ne rend pas privées les copies déjà récupérées. Aucun secret réel exposé n'est affirmé sans preuve.

Le mode par défaut est **demo** et embarque les 24 contenus fictifs ; sa vérification JavaScript de date n'est pas une sécurité. Ne jamais y remplacer les textes par les véritables surprises. Le mode privé importe `createPrivateAPI`, ne bascule pas silencieusement en demo et requiert un compte invité pour consulter le calendrier. Le village statique reste accessible : l'authentification protège le calendrier et ses données, pas l'existence ou l'ensemble des graphismes du jeu.

Le build privé supprime la copie automatique de `public`, copie une liste autorisée et élimine le module demo. Cette séparation est réelle mais sa liste est obsolète pour D.4.2. `check-private-build.ts` recherche le dossier demo, un nom de module et une phrase témoin : succès insuffisant pour prouver l'absence de toute fuite future ou l'exhaustivité des assets. Aucun contenu personnel réel n'a été fourni pour cet audit ; aucun examen exhaustif de l'historique Git pour secrets n'est revendiqué.

## Mécanismes vérifiés dans le code

| Sujet | Preuve locale | Limite de preuve / action |
|---|---|---|
| Minuit Paris | SQL `private.unlocked_at` utilise `make_timestamptz(2026,12,d,0,0,0,'Europe/Paris')` et `server_now()` | Indépendant de l'horloge navigateur ; tests JS des 24 frontières et SQL des bornes 1/24. Horloge/service distant non recettés |
| Accès direct aux jours | `advent_day/start/check_step` appellent `assert_day` ; SELECT direct de `advent_days` filtré RLS | Admin peut lire tous les jours par conception ; joueur membre seulement jours ouverts |
| Métadonnées futures | `advent_status` renvoie numéro/disponibilité/progression, pas le titre ni le contenu futur | Ne pas ajouter de préchargement ultérieur de toutes les définitions |
| Identité privée | Auth `getUser`, puis table `app_members` ; rôles player/admin, lecture de sa propre ligne | Invitations et désactivation de l'inscription publique sont manuelles, pas établies par le code frontend |
| Autorisation | Rôles issus de la table, pas de métadonnées éditables ; écritures client directes retirées ; RPC admin protégées | Les paramètres réels du projet et d'éventuelles politiques ajoutées hors migration sont inconnus |
| Réponses | `private.advent_rules`, sans SELECT joueur ; validation serveur de l'ordre, run UUID et version ; verrou ligne de progression | Ce n'est pas un anti-triche : un joueur autorisé peut fabriquer une preuve valide pour un jour ouvert |
| RPC privilégiées | `SECURITY DEFINER`, `search_path=''`, noms qualifiés, droits d'exécution explicitement retirés/réattribués | Audit de migration examinée, pas audit complet d'un serveur existant |
| Médias | Bucket `advent-media` privé ; préfixes 1…24 ; lecture membre/date, écriture admin | Tester Storage HTTP réel, URL publique refusée et accès direct futur. Admin peut naturellement signer ses aperçus |
| URL signées | Demande après autorisation, validité 300 s dans `supabase.ts` | URL porteuse d'accès jusqu'à expiration ; un média téléchargé n'est pas révocable rétroactivement. Tester lecture vidéo longue/reprise et expiration |
| Preview | `advent_progress.mode` live/preview, clé primaire user/day/mode ; preview admin uniquement | UI et brouillons séparés ; effet visuel courant sur le sapin ne doit pas être confondu avec attribution serveur |
| Clés publiques | Contrôles client et `ops/lib/public-config.mjs` : refus `sb_secret_*`, JWT privilégié et variables VITE inattendues | Détection de formes connues, pas analyse universelle de secrets ; seules URL/clé anon-publiable/site CAPTCHA sont publiques |
| Tentatives Auth | Token CAPTCHA transmis, refus 429 traité sans boucle automatique | CAPTCHA et limites doivent être activés côté Supabase ; le navigateur seul ne les garantit pas |

Dates exactes : ouverture du jour 1 au **30 novembre 2026 à 23:00:00 UTC**, jour 24 au **23 décembre 2026 à 23:00:00 UTC**. Les jours ouverts restent rejouables après le 24. L'horloge fictive de village (180 s) ne participe pas aux autorisations.

## Validation des contenus et des preuves

`validateEditable` et `advent_admin_save` bornent taille, types principaux, identifiants, nombre d'étapes, pièces et chemins média. Les réponses de premier niveau dans une étape sont refusées ; les règles restent séparées. `evidence_valid` borne les preuves, contrôle l'ordre et rejette les preuves incorrectes, doublons et SQL NULL. Les tests SQL parcourent les 24 définitions demo.

Limites : le schéma n'est pas une validation exhaustive de chaque combinaison de type/règle/liste/graphe. Une édition admin mal formée peut rester impossible à terminer ; la validation de publication doit simuler chaque définition. Le client et le serveur diffèrent sur certains détails (date/destinataire du bon, par exemple) : la recette serveur reste l'autorité. Les URLs/médias et champs JSON ne doivent pas servir à contourner le stockage privé. Aucun contenu personnel ne doit être placé dans une propriété imbriquée publique en croyant qu'un nom « secret » la rend privée.

## Sauvegardes : contrat réel

| Données | Où elles vivent | Reprise |
|---|---|---|
| Village, position, quêtes, inventaire, flags, historique, scores | IndexedDB `etoilebois/saves`, clé `phase-b` ; fallback v1 `phase-a` | Même navigateur/origine ; migration decode v1/v2 ; pas de synchronisation Supabase du Save complet |
| Étapes Avent validées et dernier souvenir terminé | `advent_progress` par compte/jour/mode en privé | Récupération serveur, à éprouver sur deux appareils |
| Brouillons de textes / manche active | IndexedDB, clés user/mode/day/run | Même appareil ; séparation de namespaces, pas chiffrement local |
| Plateaux et préférences | Stockage local des composants | Pas une sauvegarde serveur de chaque clic |
| Routines et états visuels D.4 | Recalculés, simulation transitoire | Pas de persistance de chaque position de PNJ ; cela n'efface pas les étoiles |

Une mise à jour de contenu renouvelle la manche active mais conserve `completed_at` et la mémoire précédente jusqu'à nouvelle complétion. Un rejeu n'attribue pas de seconde étoile. Les sauvegardes anciennes ne doivent jamais être remplacées par un reset pour résoudre un problème de recette.

Les sessions Auth et brouillons restent sur l'appareil. Se déconnecter isole l'interface mais ne constitue pas une suppression/chiffrement de tous les brouillons stockés. Le Save village est commun à l'origine, pas cloisonné par compte Supabase. Définir l'usage prévu sur appareil partagé ; ne pas annoncer une isolation complète des parties locales entre comptes.

## Sauvegarde d'exploitation

`ops/backup.mjs` prévoit dump applicatif et octets Storage, chiffrement AES-256-GCM, marqueur COMPLETE et vérification d'intégrité. L'export exclut les identités Auth et les paramètres du service : leur restauration doit être prévue séparément en conservant les UUID. Le stockage et PostgreSQL ne forment pas un instantané distribué unique ; garder les médias immuables et contrôler la complétude. Clés et connexions hors Git/webroot, copie de récupération séparée. Rétention/planification et exercice de restauration ne sont pas mis en place par cet audit.

## P0 avant toute ouverture

Prérequis : confirmer et remettre le dépôt en visibilité privée, avec accord hors de cette mission strictement documentaire. Examiner les collaborateurs et l'éventuelle exposition passée.

1. Artefact privé complet et inventorié, sans module/médias demo ou souvenirs publics ; test navigateur du véritable artefact.
2. Staging dédié : anonyme et non-membre refusés ; joueur incapable de lire/écrire un jour futur, les règles, un média futur, une autre progression ou l'admin ; essais via API et Storage directs.
3. Invitations, rôles, CAPTCHA, limites Auth et retour après invitation validés. Ne pas lancer une campagne de tentatives sur les comptes de Debby ; `probe-auth-limits.mjs` est prévu pour staging explicite.
4. Test des 24 preuves et des versions/rejeux sur staging, puis publication privée des contenus réels sans copier ces contenus dans les rapports Git.
5. Backup et restauration dans un projet isolé, validation des identités et médias, contrat écrit de reprise locale/serveur.

Les tests PGlite simulent Auth et Storage : ils prouvent les règles SQL exercées, pas les serveurs GoTrue, PostgREST, CAPTCHA ou la livraison HTTP Storage réels. Safari iOS, Supabase réel, rate limiting réel et VPS ne sont pas déclarés validés.
