# Audit Phase D — 4 novembre 2026

Branche `feature/phase-d-vps`, version 0.4.0, construite sur la Phase C existante. L'audit distant a été exécuté par l'utilisateur dans PuTTY et transmis dans cette conversation, sans accès SSH direct de l'agent. Le domaine retenu est `etoilebois.loyaldev.fr`.

## État du code

| Élément | Fonctionnement constaté | Dépendance restante |
|---|---|---|
| React 19 / Vite 7 / TypeScript / Phaser 3 | Frontend statique, déplacements, quatre intérieurs, PNJ, quêtes et mini-jeux A/B ; 24 activités C | Un serveur de fichiers suffit pour le frontend |
| Démonstration | Contenus fictifs, horloge locale, progression IndexedDB, aperçu développeur séparé | Ne protège aucune véritable surprise |
| Supabase JS | Client Auth, appels RPC SQL, accès aux médias signés, édition administrateur | Projet hébergé, migrations appliquées et comptes invités nécessaires |
| Authentification | E-mail/mot de passe, session persistante, rôle lu dans `app_members` | Configurer les invitations, URLs de retour, CAPTCHA et limites Auth sur le service |
| Autorisations | RLS et RPC avec vérification utilisateur, date serveur, rôle, ordre et version | Vérifications HTTP réelles sur l'instance à effectuer |
| Sauvegardes A/B | IndexedDB, reprise v1/v2 préservée | Locales au navigateur et à l'origine ; ne se synchronisent pas entre PC et téléphone |
| Progression Avent privée | Table `advent_progress`, isolée par compte et mode live/preview ; étoiles conservées après édition/rejeu | Sauvegardée à distance seulement quand Supabase est opérationnel |
| Surprises | Texte dans PostgreSQL, réponses dans `private.advent_rules`, médias dans le bucket privé | Importer les vrais souvenirs uniquement dans le backend |
| Dates | SQL `make_timestamptz(...,'Europe/Paris')`, minuit du 1er au 24 décembre 2026 | Aucun remplacement par l'horloge du VPS ou du navigateur |
| Migrations | SQL Phase C exécuté en tests PostgreSQL embarqué ; aucune nouvelle migration destructive D | Ne pas réexécuter une migration déjà appliquée ; pas de migration automatique au déploiement |

Changer `localhost` pour le domaine crée une nouvelle origine : le navigateur n'y transporte pas automatiquement son ancien IndexedDB. Les sauvegardes A/B restent présentes sur l'ancienne origine ; un changement de domaine n'est pas un effacement par le jeu. La progression privée Avent suit le compte Supabase. Un transfert manuel des archives A/B entre origines n'est pas implémenté et n'est pas revendiqué.

## Architecture retenue

Navigateur → HTTPS Nginx sur le VPS → fichiers statiques compilés. Le navigateur appelle directement Supabase hébergé pour Auth, RPC et Storage. Une base PostgreSQL seule sur le VPS ne remplacerait ni Auth, ni la signature des médias, ni les politiques Storage. **Aucune API Node dédiée n'est nécessaire et aucun processus PM2 n'est ajouté.** Le fichier PM2 livré contient volontairement `apps: []` ; `etoilebois-api` est réservé à une évolution explicitement validée.

Les bots continuent d'utiliser leurs versions Node, leurs utilisateurs, leurs processus PM2 et leurs fichiers. La compilation se fait dans GitHub Actions. Node 22.22.3, déjà présent, satisfait les moteurs déclarés du SDK Supabase (`>=22`) et de Vite (`>=22.12`). Les outils d'infrastructure sont testés en CI avec cette version exacte. Aucun remplacement de Node n'est prévu ; le chemin et son accessibilité au compte dédié restent à confirmer.

## Renforcement D

- Liste explicite des seules illustrations publiques autorisées ; pas de copie aveugle de nouveaux fichiers dans `public/assets` pour le build privé.
- Refus des clés serveur, JWT privilégiés et variables `VITE_*` inattendues **avant compilation**, pas seulement dans le navigateur.
- Artefact statique avec empreinte SHA-256 de chaque fichier, commit exact, contrôle de contenu et refus de symlinks/fichiers supplémentaires.
- Déploiement en versions immuables, activation atomique, retour arrière sans redémarrage de service ; anciens chunks conservés pour les onglets déjà ouverts.
- CAPTCHA Turnstile côté formulaire et transmission du jeton à Supabase. La protection réelle doit être activée et vérifiée côté Supabase ; le code client n'est pas une barrière de limitation.
- Sauvegarde chiffrée des tables applicatives et des octets des médias, avec authentification AES-256-GCM, vérification avant restauration et refus d'écraser des médias différents. Les identités Auth sont exclues de cet export applicatif et nécessitent les sauvegardes complètes de la plateforme.

## VPS et domaine : constat, pas supposition

Une première recherche locale A/AAAA a retourné NXDOMAIN. Le résultat transmis du VPS puis une nouvelle recherche locale confirment désormais **A = 51.210.40.92**, correspondant à l'adresse de son interface ; aucun AAAA n'a été retourné. Aucun DNS n'a été modifié par l'agent et aucun certificat n'a été demandé.

Audit transmis : 3 novembre 23:53 UTC, soit **4 novembre 00:53 Europe/Paris**.

| Mesure | Résultat transmis |
|---|---|
| Système | Ubuntu 24.04.4 LTS, noyau 6.8.0-134-generic |
| Compte SSH | `ubuntu`, uid 1000 |
| CPU / charge | 2 CPU ; charge moyenne 0.00 à cet instant |
| RAM | 3,7 Gio total, 2,6 Gio disponibles ; aucun swap |
| Disque | 38 Go total, 30 Go disponibles, 22 % utilisé |
| Node / npm | 22.22.3 / 10.9.8 |
| PM2 | 7.0.1 ; daemon actif sous `ubuntu` |
| Instantané PM2 | `gestionnaire-ems-dashboard`, `gestionnaire-ems-bot` indiqués online ; liste pouvant être ancienne |
| Services | Nginx et PostgreSQL actifs ; Apache et Caddy inactifs |
| Ports existants | Nginx 80/443 IPv4 et IPv6 ; SSH 22 ; PostgreSQL 127.0.0.1:5432 ; Node 127.0.0.1:3000 et port global 4010 |
| Certbot | `/usr/local/bin/certbot` présent |

La préparation doit **réutiliser le Nginx existant**, conserver le PostgreSQL existant et ne pas réaffecter 3000, 4010 ou 5432. Le fuseau UTC du VPS reste inchangé ; le calendrier utilise Europe/Paris dans PostgreSQL côté Supabase, sans modification de l'horloge globale qui pourrait affecter les bots.

Le premier filtre d'audit ne repérait que les fichiers `.conf` : les vhosts actifs sans extension et les certificats protégés ne sont donc **pas encore inventoriés**. Le complément `ops/audit-web-details.sh` lit les fichiers activés sans contrainte d'extension, affiche les seuls champs utiles des processus PM2 après confirmation d'un daemon existant et demande les seules métadonnées publiques des certificats. Ces résultats sont nécessaires avant de valider le diff Nginx et le choix de certificat.

## Complément reçu

`/usr/bin/node` est un fichier root exécutable, et tous ses parents sont accessibles en lecture/exécution. Le compte dédié peut donc l'utiliser sans installer de binaire supplémentaire ni modifier les permissions du dossier personnel des bots.

Vhosts actifs : `default` (port 80, `/var/www/html`, `server_name _`), `elysium.loyaldev.fr` (80/443 SSL) et `emt.loyaldev.fr` (80/443 SSL, IPv4 et IPv6). Aucun vhost actif Étoilebois n'a été observé. Les fichiers existants et leurs liens ne seront pas remplacés. Les garde-fous d'installation doivent aussi confirmer l'absence d'un éventuel fichier désactivé de même nom.

Certificats publics : `elysium.loyaldev.fr`, valide du 27 octobre 2026 au 25 janvier 2027 ; `emt.loyaldev.fr`, du 5 octobre 2026 au 3 janvier 2027. Chacun ne couvre que son propre nom, pas `etoilebois.loyaldev.fr`. Un certificat dédié au jeu sera nécessaire. Le timer `snap.certbot.renew.timer` existe déjà ; aucun nouveau timer global n'est à installer.

Inventaire PM2 en direct transmis sous le propriétaire `ubuntu` :

| Processus | PID | État | Compteur de redémarrages |
|---|---|---|---|
| gestionnaire-ems-dashboard | 2306214 | online | 54 |
| gestionnaire-ems-bot | 2131044 | online | 8 |
| elysium-bot | 2332726 | online | 5 |
| elysium-dashboard | 2330760 | online | 0 |

Les quatre utilisent `/usr/bin/node` version 22.22.3. Ces valeurs constituent un état de référence à comparer après une éventuelle intervention validée, pas une garantie d'absence de redémarrages autonomes à l'avenir. Aucune commande de modification PM2 n'a été demandée.

L'audit permet désormais de préparer le vhost isolé. Les commandes de contrôle et la recette sur le serveur réel restent à effectuer après validation ; **le jeu n'est pas déclaré déployé**. Supabase n'a pas été provisionné dans cette session.

Un contrôle HTTP HEAD supplémentaire a obtenu 200 sans redirection sur le domaine. Le contrôle HTTPS avec validation normale du certificat échoue avec `ERR_TLS_CERT_ALTNAME_INVALID` : le certificat présenté ne couvre pas ce nom. Ces réponses de l'infrastructure existante ne constituent pas un déploiement du jeu. Aucun contournement de validation TLS n'est prévu en production.
