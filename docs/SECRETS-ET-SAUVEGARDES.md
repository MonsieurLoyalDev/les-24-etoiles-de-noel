# Secrets, sauvegardes et restauration

Cette procédure reste à exécuter après configuration du projet réel et validation. Les tests locaux/CI utilisent des données fictives et des services isolés.

## Emplacement et variables

| Usage | Variables / fichiers | Destination |
|---|---|---|
| Build navigateur | `VITE_APP_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY` | Variables publiques de compilation GitHub ou fichier privé sur le poste de build |
| CAPTCHA | Clé secrète Turnstile | Paramètres Supabase Auth uniquement |
| Export privé | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `/etc/etoilebois/backup.env`, 0600, jamais `VITE_*` |
| Chiffrement | `ETB_BACKUP_KEY_FILE=/etc/etoilebois/backup.key` | Clé aléatoire de 32 octets en base64, fichier régulier 0600 |
| PostgreSQL | `PGSERVICE`, `PGSERVICEFILE`, `PGPASSFILE` | Profil libpq du seul projet Étoilebois, certificat CA et mot de passe hors Git |
| Recette Auth | `ETB_TEST_PLAYER_EMAIL/PASSWORD/CAPTCHA_TOKEN`, `ETB_TEST_ADMIN_EMAIL/PASSWORD/CAPTCHA_TOKEN`, `ETB_FUTURE_MEDIA_PATH` | Fichier privé temporaire sur le poste de test, comptes dédiés |

Les fichiers exemples sont dans `ops/config`. Ils ne contiennent aucun vrai secret. Le frontend n'utilise pas la clé service_role. Le build refuse les secrets connus et les variables publiques inattendues ; le packaging n'inclut que les fichiers statiques autorisés. Les backups ne sont jamais placés sous `/var/www`.

Le dépôt privé ne protège pas un secret déjà copié dans un bundle public. Les vrais textes, réponses, photos et vidéos doivent être importés dans Supabase et rester absents des sources, des exports JSON committés et du répertoire public. Les noms et le nombre des fichiers de sauvegarde sont génériques ; le manifeste et les noms des médias sont chiffrés.

## Auth et limitation des tentatives

1. Désactiver l'inscription publique et inviter les comptes.
2. Activer Turnstile dans Supabase Auth, avec sa clé secrète, et la clé publique dans le build. Le jeton est transmis via `options.captchaToken`, renouvelé après chaque tentative et invalidé à expiration.
3. Examiner Auth → Rate Limits. La limitation est appliquée par Supabase à ses endpoints, y compris `/auth/v1/token` ; elle ne repose pas sur le JavaScript ou un proxy Nginx contournable. Le client respecte un refus 429 et ne réessaie pas automatiquement.
4. Sur un **projet de staging dédié**, lancer si souhaité `node ops/probe-auth-limits.mjs --confirm-staging-project` avec les variables publiques de ce staging. Le test est borné à 40 tentatives vers un compte fictif `.invalid`, s'arrête au premier 429 et échoue explicitement si aucune limite n'est constatée. Ne pas l'exécuter sur le projet utilisé par Debby : une limite par IP peut aussi freiner des connexions légitimes derrière la même IP.
5. Sur le projet réel, `node ops/verify-backend.mjs` vérifie en lecture les refus anonymes, CAPTCHA absent, rôle joueur/admin, accès direct, médias futurs et jours ouverts lorsqu'il y en a. Il exige des comptes de test et des jetons CAPTCHA frais ; il n'attribue aucune étoile. Il annonce les contrôles temporels non applicables après le 24 décembre ou avant l'ouverture du premier jour, au lieu de les déclarer réussis.

Les tests unitaires couvrent l'absence de jeton et la réponse 429 ; cela **ne prouve pas** les limites d'un projet distant non configuré. [Documentation officielle des limites Auth](https://supabase.com/docs/guides/auth/rate-limits), [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).

## Périmètre des sauvegardes

`ops/backup.mjs` exporte les données de `app_members`, `advent_days`, `private.advent_rules`, `advent_progress` via `pg_dump`, puis télécharge les octets de tous les médias du bucket privé `advent-media`. Chaque fichier est chiffré en flux avec AES-256-GCM, IV aléatoire et authentification liée à son identifiant et à un identifiant unique de sauvegarde. Un marqueur `COMPLETE` n'est écrit qu'après succès complet. Une mauvaise clé, un mélange de fichiers de sauvegardes différentes, une corruption ou une sauvegarde incomplète bloque la restauration.

**Cet export applicatif exclut les identités Auth et les paramètres du service.** Conserver aussi les sauvegardes complètes Supabase adaptées à votre plan (ou une procédure officielle d'export/restauration de la plateforme). Les UUID Auth doivent être préservés avant de restaurer les lignes applicatives : les clés étrangères refusent des utilisateurs manquants. Les sauvegardes de base de données Supabase n'incluent pas les octets Storage : notre export des médias est complémentaire. [Source officielle](https://supabase.com/docs/guides/platform/backups).

Les médias importés par le jeu ont des noms UUID. Les garder immuables et suspendre les suppressions manuelles pendant une sauvegarde. Le dump PostgreSQL est cohérent à son instantané ; la lecture du stockage séparé ne constitue pas une transaction distribuée. Une suppression concurrente fait échouer le téléchargement et empêche le marqueur de succès.

## Installer les outils, après accord

Ils peuvent tourner sur un poste d'administration ou un serveur de sauvegarde séparé si les ressources du VPS sont limitées. Si le VPS les exécute, utiliser le compte dédié et un nouveau dossier privé hors du webroot. Le client `pg_dump/pg_restore` doit être au moins compatible avec la version PostgreSQL distante ; un client plus ancien peut refuser le dump. Ne pas installer de serveur PostgreSQL local. Le choix du paquet client se fait après audit de la version distante et d'Ubuntu.

Le dossier d'outils doit contenir le `package.json`/lock approuvé, `ops/` et les dépendances du SDK. Installer uniquement dans ce dossier, avec Node >=22 et sans scripts d'installation :

```bash
cd /CHEMIN/PRIVE/ETOILEBOIS_TOOLS
npm ci --omit=dev --ignore-scripts
```

Les fichiers de connexion doivent être créés sur place via votre éditeur privé/WinSCP et jamais copiés ici. Exemple de profil **sans mot de passe** :

```ini
[etoilebois]
host=HOTE_DU_TABLEAU_DE_BORD_SUPABASE
port=5432
dbname=postgres
user=UTILISATEUR_DU_PROJET
sslmode=verify-full
sslrootcert=/etc/etoilebois/supabase-ca.crt
```

`pgpass` contient `HOTE:PORT:BASE:UTILISATEUR:MOT_DE_PASSE` et appartient au compte exécutant le backup, mode 0600. Préférer une connexion directe ou le pooler en mode session compatible avec les outils PostgreSQL, pas le pooler transactionnel. Vérifier ensemble l'origine Supabase et ce profil avant toute restauration, pour viser le même projet dédié. Aucun profil d'un bot ou d'une autre application n'est réutilisé.

Créer la clé sous le compte de sauvegarde après validation :

```bash
( umask 077; set -C; openssl rand -base64 32 > /etc/etoilebois/backup.key )
chmod 0600 /etc/etoilebois/backup.key /etc/etoilebois/backup.env /etc/etoilebois/pgpass /etc/etoilebois/pg_service.conf
```

Le mode `set -C` refuse d'écraser une clé existante. Conserver une copie de récupération hors du VPS, séparée des backups ; une clé perdue empêcherait d'ouvrir les anciennes archives. Aucun script de cette livraison ne génère ou remplace une clé automatiquement.

## Export et contrôle

Dans une session du compte de sauvegarde, charger le fichier privé approuvé, puis choisir un nouveau dossier :

```bash
set -a
. /etc/etoilebois/backup.env
set +a
ETB_BACKUP=/var/backups/etoilebois/$(date -u +%Y%m%dT%H%M%SZ)
/usr/bin/node /CHEMIN/PRIVE/ETOILEBOIS_TOOLS/ops/backup.mjs backup "$ETB_BACKUP"
/usr/bin/node /CHEMIN/PRIVE/ETOILEBOIS_TOOLS/ops/backup.mjs verify "$ETB_BACKUP"
```

Le dossier doit être nouveau. `verify` déchiffre dans un répertoire temporaire 0700 et vérifie les tags de tous les fichiers, sans modifier la base ni le stockage. Ce répertoire est indiqué pour inspection ; il contient des données privées en clair et doit être retiré manuellement après la recette, en contrôlant son chemin exact. Les archives restent chiffrées. Il faut prévoir l'espace pour les médias, les archives et cette vérification ; ne pas lancer un export important sans l'audit RAM/disque.

Copier les archives complètes chiffrées hors du VPS par WinSCP ou un stockage privé adapté, puis contrôler une copie. La seule présence du dossier n'est pas un succès : le marqueur et la vérification doivent passer. Aucune rétention destructive, tâche cron, timer ou suppression automatique n'est installé. Une politique initiale possible est sept sauvegardes quotidiennes et quatre hebdomadaires, à dimensionner et valider selon la taille des vidéos.

## Restauration contrôlée

1. Valider explicitement la cible, la date et la perte de données acceptable. Une restauration de données est différente d'un retour arrière du frontend.
2. Répéter d'abord sur une copie de test de la plateforme avec ses identités Auth préservées. Préparer le schéma applicatif et des tables applicatives vides ; le script ne vide aucune table et ne désactive aucune contrainte. Une restauration sur des données existantes provoque un refus/rollback PostgreSQL plutôt qu'un effacement implicite.
3. Vérifier les archives avec `verify`, la correspondance de l'origine et du profil PostgreSQL, puis seulement appliquer sur la cible approuvée :

```bash
/usr/bin/node /CHEMIN/PRIVE/ETOILEBOIS_TOOLS/ops/backup.mjs restore /CHEMIN/BACKUP_CHIFFRE --apply-to=PROJECT_REF.supabase.co
```

L'origine doit correspondre au projet du manifeste ; un changement de projet est refusé et relève d'une migration séparée, revue avec les UUID Auth. Les médias sont restaurés en premier, sans écrasement : un fichier existant identique est conservé ; un fichier différent bloque la procédure. Le dump est ensuite importé avec `pg_restore --single-transaction --exit-on-error`. Si l'import DB échoue, des médias privés supplémentaires peuvent être présents mais aucune table n'est partiellement importée. Cela n'est pas une transaction atomique entre PostgreSQL et Storage.

4. Tester rôle joueur/admin, progression et étoiles, textes et médias, puis rouvrir le jeu. Une restauration globale de la plateforme via Supabase peut occasionner une indisponibilité ; elle exige une validation distincte et ne s'exécute pas via ce script.

Les fixtures CI testent un véritable aller-retour `pg_dump/pg_restore` PostgreSQL 17 et les octets des médias via un double Storage ; elles ne prouvent pas la restauration complète d'un compte Supabase réel. La première répétition sur votre infrastructure reste une condition de mise en service.
