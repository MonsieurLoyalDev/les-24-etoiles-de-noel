# E.0 — Préparation du déploiement

Commit `7001466`, audit du 15 novembre 2026. Domaine prévu : `etoilebois.loyaldev.fr`. **Aucun service contacté ou modifié sur le VPS ; aucune installation, activation, émission de certificat ou restauration exécutée.**

## Architecture réellement préparée

React/Vite/Phaser compilé en fichiers statiques, servi par Nginx ; Supabase hébergé séparément assure Auth, RPC PostgreSQL/RLS et stockage privé. **Aucune API Node dédiée n'est nécessaire à cette architecture.** `ops/pm2/ecosystem.config.cjs` est volontairement vide : ne pas lancer un processus PM2 artificiel ni remplacer Supabase par le PostgreSQL local du VPS.

Les informations VPS fournies le 3 novembre sont historiques : Ubuntu 24.04.4, Node 22.22.3 `/usr/bin/node`, PM2 7.0.1, Nginx/Certbot existants, PostgreSQL local, sites elysium/emt et quatre processus PM2. Le domaine résolvait alors vers 51.210.40.92. Ces éléments ne constituent pas une vérification de disponibilité, DNS, certificat ou charge au 15 novembre.

## État par composant

| Composant | Prêt dans le dépôt | À configurer / tester | Priorité |
|---|---|---|---|
| Compilation privée | Mode private, élimination demo, liste autorisée, contrôle de clés | Corriger la liste pour les 3 spritesheets D.4.2 ; vérifier toutes les ressources par requêtes réelles | P0 |
| Configuration du build | `.env.example`, `public-config.mjs`, métadonnées build | URL Supabase, clé publique anon/publishable, clé publique Turnstile réelles ; build sans ces valeurs peut réussir mais n'est pas une livraison fonctionnelle | P0 |
| Supabase | Une migration SQL complète, seed fictif, client et RPC | Projet dédié, migration appliquée une fois, membres invités, rôles, Storage privé, Auth/CAPTCHA/limites, 24 contenus publiés | P0 |
| CI qualité | `.github/workflows/ci.yml` : lint, unitaires, builds, Playwright et lot infrastructure Linux | Vérifier le résultat distant sur SHA exact ; aucun succès GitHub Actions distant attesté dans E.0 | P0 |
| Artefact GitHub | `vps-artifact.yml` manuel, SHA exact, permissions contents:read, pas d'étape SSH | **Connecteur GitHub : visibility public observé** ; confirmer/corriger le réglage, contrôler accès ; variables GitHub, revue SHA et téléchargement d'artefact | P0 |
| Paquet VPS | `package-vps.mjs`, manifeste/hash et allowlist de fichiers, refus d'un backend/CAPTCHA non configuré | Construire une release réelle après correctifs ; le manifeste ne prouve pas à lui seul l'exhaustivité des dépendances runtime | P0 |
| Dossiers isolés | `bootstrap-vps.sh`, `/var/www/etoilebois`, dossiers dédiés et comptes séparés | Relecture d'un audit frais et accord préalable ; ne pas écraser un dossier existant ni une configuration locale | P0 |
| Nginx / HTTPS | Générateur de vhost, exemples HTTP/HTTPS, CSP, ACME webroot, hook spécifique | Revalider conflits server_name, A/AAAA, vraie origine backend, certificat du jeu, `nginx -t`, recette HTTPS | P0 |
| Activation/restauration de version | `release.mjs` : contrôle de racine, manifeste, verrou et liens atomiques | Deux cas POSIX ignorés sur Windows ; exécuter sous Linux puis restauration contrôlée de l'artefact précédent | P0 |
| Sauvegardes données | Export chiffré, vérification et outils de restauration ; guide des secrets | Config hors Git, identités Auth, sauvegarde externe et exercice en staging ; aucun backup de production vérifié | P0 |
| Recette privée | `verify-backend.mjs`, `verify-host.mjs`, `tests/vps-e2e/private.spec.ts`, test Nginx isolé | Comptes/jetons de test ; vrai Storage/RLS/HTTPS ; tests fixtures ne prouvent pas le service réel | P0 |
| Exploitation | Guide de mise à jour, versions conservées, contrôles ciblés | Responsable de maintenance, point de retour, suivi erreurs et renouvellement certificat ; définir un plan d'incident pour décembre | P1 |

## Résultats de construction à interpréter correctement

`npm run build:private` passe sans configuration distante : il force le mode Supabase mais `build-info.configured` reste faux quand URL/clé manquent. Le jeu affiche alors une indisponibilité du calendrier ; il ne retombe pas en mode fictif. Le packaging de release exige ensuite configuration et CAPTCHA. Il faut distinguer succès de compilation, succès du paquet, disponibilité Auth et recette de production.

Le workflow d'artefact ne déploie pas automatiquement. Il ne contient ni clé SSH, ni commande Nginx/PM2. Il évite de compiler dans les répertoires des bots. La CI infrastructure utilise une origine et des clés factices, un runner jetable et un test de sauvegarde local : ces preuves restent séparées d'un hébergement réel.

Dimensionnement : l'estimation historique de 4,7 Mo par version dans `PLAN-VALIDATION-VPS.md` est dépassée. L'artefact privé E.0 sans configuration réelle représente **92 605 977 octets / 227 fichiers**, avant ajout des trois feuilles manquantes. Prévoir l'espace pour plusieurs versions, assets historiques conservés, originaux privés et sauvegardes ; mesurer le transfert initial plutôt que l'assimiler à ce total de fichiers. Aucune compression ou suppression de ressource n'est effectuée dans l'audit.

## Contrôles à effectuer après autorisation, dans cet ordre

1. Corriger et approuver le code de livraison, installation vierge, tests et build privé sur SHA figé. Les branches main/develop sont encore Phase A : revue de l'écart complet avant toute intégration.
2. Recette staging Supabase et données fictives : accès négatifs directs, invitations, admin/joueur, médias, versions, rejeu, reprise. Ne pas changer l'horloge de production.
3. Préparer les 24 contenus personnels dans Supabase, y compris média jour 10, sans Git ; les valider en aperçu séparé et sauvegarder.
4. Audit VPS/DNS renouvelé, présentation des seuls changements nécessaires, accord explicite ; créer vhost/dossiers dédiés et HTTPS sans toucher aux bots ou autres sites.
5. Activer l'artefact approuvé, vérifier `verify-host` et parcours HTTPS PC/téléphone, calendrier, données persistantes, restauration de version puis sauvegarde/restauration des données sur environnement isolé.
6. Décision d'ouverture et procédure de retour revue par le propriétaire ; aucune étape n'est implicitement autorisée par ce rapport.

Ne jamais employer `pm2 restart all`, `pm2 delete all`, un remplacement global Nginx ou une restauration dans le PostgreSQL d'une autre application. L'E.0 ne nécessite aucune intervention sur ces services.

## Non exécuté en E.0

Vérification locale complémentaire exécutée : syntaxe seule (`bash -n`) des scripts d'audit VPS, audit web, bootstrap et hook Certbot : quatre succès sous Git Bash. Cela ne valide ni leurs effets sous Ubuntu ni les tests POSIX ignorés par Vitest.

SSH/PuTTY/WinSCP, DNS/HTTPS public actuel, Certbot, Nginx système, PM2, migrations distantes, invitations réelles, CAPTCHA/rate limiting réels, `verify-backend` distant, `verify-host` distant, backup/restore réel et tests Safari iOS. Aucun de ces postes n'est marqué « prêt en production ».

Références locales examinées : `docs/VPS-UBUNTU.md`, `CONFIGURATION-SUPABASE.md`, `SECRETS-ET-SAUVEGARDES.md`, `PLAN-VALIDATION-VPS.md`, `ops/`, `scripts/package-vps.mjs`, workflows GitHub. Les guides constituent une procédure à recetter, pas un compte rendu d'installation.
