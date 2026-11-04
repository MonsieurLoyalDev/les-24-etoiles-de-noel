# Ubuntu, WinSCP et PuTTY — installation préparée

Le domaine prévu est **etoilebois.loyaldev.fr**. Le dépôt reste privé. Le premier audit reçu confirme Ubuntu 24.04.4, Node 22.22.3, Nginx et Certbot déjà présents, PostgreSQL et bots existants. Ce guide prépare une installation ; il ne prouve pas que le jeu est hébergé. **Terminer uniquement l'audit maintenant. Les étapes suivantes attendent votre validation du plan adapté.**

## 1. Audit, sans installation

Ouvrir votre connexion habituelle dans WinSCP et PuTTY. Ne transmettre ici aucun mot de passe, fichier PPK ou clé privée.

Dans WinSCP, transférer le fichier `ops/audit-vps.sh` du ZIP dans votre dossier personnel, sous le nom `etoilebois-audit-vps.sh`. C'est un fichier d'audit, pas un installateur. Dans PuTTY :

```bash
bash "$HOME/etoilebois-audit-vps.sh" etoilebois.loyaldev.fr
```

Copier le résultat pour examen. Le script ne modifie aucun service ou fichier de configuration et ne lance pas PM2. Il affiche seulement des versions, noms/PID, ports, ressources, directives de domaines et métadonnées publiques de certificats. Les secrets et variables des bots ne sont pas affichés. Son aperçu PM2 vient d'un éventuel `dump.pm2` et peut être ancien ; la liste en direct sera confirmée sous le compte propriétaire du daemon déjà actif. Les erreurs de permission signifient « pas encore vérifié ».

**Point d'arrêt : envoyer l'audit et attendre la proposition adaptée puis la validation.** Si vous préférez éviter le transfert du script, ces premières commandes sont uniquement en lecture :

```bash
cat /etc/os-release
id
node --version
command -v pm2 nginx apache2 caddy certbot
ps -eo user,pid,comm
ss -lntup
free -h
df -h
getconf _NPROCESSORS_ONLN
```

Après le premier audit, transférer aussi `ops/audit-web-details.sh` et lancer `bash "$HOME/audit-web-details.sh"` pour lire les vhosts sans extension, le chemin de Node, les métadonnées publiques des certificats et l'état PM2 actuel. Ce complément reste en lecture ; les erreurs de permissions signalent ce qui manque. Aucune installation ne suit automatiquement.

## 2. Architecture après validation

- Nginx sert le résultat compilé, sans `vite preview` en production.
- Supabase reste hébergé séparément pour Auth, PostgreSQL/RLS, RPC et Storage privé.
- Aucun nouveau processus PM2 ni PostgreSQL local. Le fichier `ops/pm2/ecosystem.config.cjs` contient `apps: []` et ne doit pas être lancé.
- GitHub compile ; WinSCP transfère un nouveau dossier d'artefact, puis PuTTY active une version par changement atomique de lien. Les bots et leur Node ne sont pas touchés.

Si Apache/Caddy occupe 80/443, ou si le domaine apparaît déjà dans un vhost, ce guide s'arrête : préparer une intégration spécifique après audit plutôt que remplacer un service. Aucune règle de pare-feu n'est ajoutée automatiquement.

## 3. Configuration confirmée après audit — en attente de validation

Le VPS dispose déjà de Nginx, Certbot et de **Node 22.22.3 dans /usr/bin/node**, accessible en lecture/exécution. Aucune installation ou mise à niveau de ces composants n'est nécessaire. Le PostgreSQL local, les sites elysium.loyaldev.fr et emt.loyaldev.fr, les quatre processus PM2 et le timer snap.certbot.renew.timer sont conservés.

La compilation reste dans GitHub avec Node 24 ; les outils sont testés en CI avec le Node 22.22.3 du VPS. Les exemples ci-dessous utilisent son chemin réel, sans modifier PATH, NVM ou les processus des bots. Le fuseau UTC du serveur reste inchangé.

Les paramètres VOTRE_UTILISATEUR_PUTTY (ici ubuntu), PROJECT_REF, RUN_ID, SHA et l'adresse e-mail doivent être remplis avec les valeurs approuvées. Exécuter une étape à la fois et s'arrêter à la première erreur. Ne pas exécuter ces étapes avant validation.

### Dossiers dédiés

Les noms doivent être libres. Le script de préparation contrôle tous les chemins, le compte, les outils et la version Node avant toute création. Il refuse un dossier existant, un lien ou un utilisateur/groupe déjà présent ; il ne les répare pas par écrasement.

Après validation, transférer avec WinSCP le dossier ops complet dans votre dossier personnel sous le nom etoilebois-ops (avec son sous-dossier lib). Exécuter ensuite uniquement :

```bash
sudo bash "$HOME/etoilebois-ops/bootstrap-vps.sh" --apply-approved --ssh-user ubuntu
```

Ce script crée le compte système sans connexion interactive, les nouveaux dossiers et les seuls outils de déploiement root en lecture seule. Il n'installe aucun paquet, ne modifie aucun service et ne contacte aucune base de données. En cas d'erreur, arrêter et examiner ; aucun nettoyage ou retrait de compte n'est lancé automatiquement.

Pour les étapes suivantes :

```bash
ETB_NODE=/usr/bin/node
ETB_OPS=/usr/local/lib/etoilebois/ops
```

Les paquets de versions seront transférés dans /var/lib/etoilebois/inbox. Aucun dossier de bot ou checkout modifié n'est utilisé. Les vrais secrets restent hors de ces paquets.

## 4. Configurer Supabase avant le vrai calendrier

Suivre [le guide Supabase](CONFIGURATION-SUPABASE.md) : appliquer la migration une seule fois dans le projet Supabase dédié, **pas dans le PostgreSQL existant du VPS**, inviter les comptes, créer leurs lignes `app_members`, garder `advent-media` privé, importer les souvenirs depuis l'éditeur. Configurer Site URL et Redirect URLs sur `https://etoilebois.loyaldev.fr`.

Créer une clé publique Turnstile autorisant ce domaine ; enregistrer **sa clé secrète uniquement dans Supabase Auth**, activer la protection CAPTCHA et ajuster Auth → Rate Limits. Le formulaire transmet le jeton ; Supabase doit le contrôler. Les appels Auth viennent directement du navigateur, donc le VPS n'a pas à transmettre artificiellement l'adresse IP du joueur.

Variables publiques de compilation :

```dotenv
VITE_APP_MODE=supabase
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIABLE_OU_ANON
VITE_TURNSTILE_SITE_KEY=VOTRE_CLE_PUBLIQUE_TURNSTILE
```

Les surprises, réponses, clé secrète Turnstile, service_role et mots de passe PostgreSQL ne vont jamais dans Vite. Les fichiers réels restent hors Git, dans `/etc/etoilebois` si nécessaires aux outils. Les exemples `ops/config/*.example` sont vides de secrets réels.

## 5. Préparer l'artefact depuis GitHub privé

Après revue, le workflow `.github/workflows/vps-artifact.yml` permet une compilation manuelle d'un **SHA exact de 40 caractères**. Il ne contient aucune connexion SSH. Renseigner les trois variables publiques Supabase/Turnstile dans Settings → Secrets and variables → Actions → Variables du dépôt privé.

Le bouton manuel GitHub nécessite que le workflow soit enregistré sur la branche par défaut ; il peut donc nécessiter une intégration approuvée ultérieure. Aucune fusion n'est faite par cette livraison. Les fonctionnalités payantes GitHub Environments ne sont pas nécessaires et aucune approbation automatique de production n'est supposée. [Fonctionnement officiel des workflows manuels](https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow).

Choisir **Prepare approved VPS artifact**, saisir le SHA revu, attendre les tests puis télécharger l'artefact privé `etoilebois-private-SHA`. Décompresser sur votre PC : il contient `site/` et `release-manifest.json`. Dans WinSCP, transférer ces deux éléments dans un **nouveau dossier** `/var/lib/etoilebois/inbox/SHA-RUN_ID/`. Le transfert doit conserver les octets ; le contrôle des empreintes détecte une conversion ou un fichier manquant.

Alternative avant disponibilité du workflow : compiler sur un poste d'administration dans un nouveau clone détaché au SHA revu, avec Node 24, les variables publiques ci-dessus, `npm ci`, `npm run build:private`, puis `npm run package:vps`. Ne pas compiler dans le dossier des bots ou effectuer de `git pull/reset/clean` dans un checkout modifié. Le paquet échoue si Auth/CAPTCHA sont absents du build, si des fichiers inattendus ou des liens symboliques apparaissent. Les contrôles de configuration ne prouvent pas à eux seuls que le projet Supabase fonctionne : la recette réelle reste obligatoire.

## 6. Préparer et examiner une version

```bash
ETB_RELEASE=SHA-RUN_ID
sudo -u etoilebois "$ETB_NODE" "$ETB_OPS/release.mjs" stage /var/www/etoilebois "/var/lib/etoilebois/inbox/$ETB_RELEASE" "$ETB_RELEASE"
```

`SHA` doit être le commit exact du manifeste, `RUN_ID` un entier ; le script refuse les noms arbitraires et les écrasements. Cette étape **n'active pas** la version. Examiner le manifeste et les résultats de tests avant l'activation :

```bash
sudo -u etoilebois "$ETB_NODE" "$ETB_OPS/release.mjs" activate /var/www/etoilebois "$ETB_RELEASE"
```

Le changement de lien est atomique. Aucun appel à PM2, Nginx, un bot ou PostgreSQL n'est effectué. Les anciens chunks hashés restent disponibles pour les onglets déjà ouverts. Les archives, sources et secrets ne sont jamais placés dans `site/`.

## 7. DNS, Nginx et certificat — après validation du diff

La nouvelle vérification DNS confirme **A = 51.210.40.92**, correspondant au VPS. Ne pas recréer ou modifier cet enregistrement sans nécessité. Les exemples Nginx sont IPv4 : laisser AAAA absent, sauf si une configuration IPv6 du serveur et du vhost a été auditée, adaptée et testée séparément. Vérifier A et AAAA avant l'émission du certificat. La première recherche renvoyait NXDOMAIN ; le résultat s'est actualisé pendant la préparation.

Les exemples `ops/nginx/*.example.conf` utilisent un faux projet Supabase ; **générer la configuration avec votre vraie origine** :

```bash
"$ETB_NODE" "$ETB_OPS/nginx.mjs" etoilebois.loyaldev.fr https://PROJECT_REF.supabase.co "$HOME/etoilebois.http.conf" http
"$ETB_NODE" "$ETB_OPS/nginx.mjs" etoilebois.loyaldev.fr https://PROJECT_REF.supabase.co "$HOME/etoilebois.https.conf"
```

Le générateur écrit seulement de nouveaux fichiers et refuse d'écraser un fichier existant. Examiner les deux fichiers, le DNS et les conflits `server_name`. Puis, après validation, ajouter le vhost HTTP isolé (préparation ACME) :

```bash
sudo test ! -e /etc/nginx/sites-available/etoilebois.conf
sudo test ! -e /etc/nginx/sites-enabled/etoilebois.conf
# S'arrêter si l'un des tests échoue ; ne pas remplacer une configuration existante.
sudo "$ETB_NODE" "$ETB_OPS/nginx.mjs" etoilebois.loyaldev.fr https://PROJECT_REF.supabase.co /etc/nginx/sites-available/etoilebois.conf http
sudo cmp "$HOME/etoilebois.http.conf" /etc/nginx/sites-available/etoilebois.conf
sudo ln -s /etc/nginx/sites-available/etoilebois.conf /etc/nginx/sites-enabled/etoilebois.conf
sudo nginx -t && sudo systemctl reload nginx
```

Si le test Nginx échoue, ne pas recharger. Examiner uniquement le nouveau fichier/lien ; ne pas corriger aveuglément les autres vhosts. Le site HTTP répond 503 jusqu'à activation HTTPS, sauf pour ACME. Il ne sert pas le jeu avec un mot de passe en clair.

Installer le hook root dédié, vérifier qu'aucun certificat du même nom n'existe, puis demander le certificat :

```bash
sudo install -d -m 0755 /usr/local/lib/etoilebois
sudo install -m 0755 "$ETB_OPS/cert-renew-hook.sh" /usr/local/lib/etoilebois/cert-renew-hook.sh
sudo test ! -e /etc/letsencrypt/live/etoilebois.loyaldev.fr
# Si le certificat existe, arrêter et l'auditer au lieu de le remplacer.
sudo certbot certonly --webroot -w /var/www/etoilebois/acme -d etoilebois.loyaldev.fr --cert-name etoilebois.loyaldev.fr --email VOTRE_EMAIL --agree-tos --non-interactive --deploy-hook /usr/local/lib/etoilebois/cert-renew-hook.sh
```

La méthode webroot ne coupe pas le serveur et ne réécrit pas ses autres configurations. Après émission, remplacer **uniquement le nouveau vhost du jeu** par le fichier HTTPS déjà revu :

```bash
sudo cp --no-clobber /etc/nginx/sites-available/etoilebois.conf /root/etoilebois-nginx-http.conf
sudo cmp "$HOME/etoilebois.http.conf" /etc/nginx/sites-available/etoilebois.conf && sudo install -m 0644 "$HOME/etoilebois.https.conf" /etc/nginx/sites-available/etoilebois.conf && sudo nginx -t && sudo systemctl reload nginx
```

Confirmer le timer Certbot existant et la procédure de renouvellement, sans modifier les autres certificats :

```bash
systemctl list-timers --all '*certbot*'
sudo certbot renew --cert-name etoilebois.loyaldev.fr --dry-run
```

Si aucun mécanisme de renouvellement n'existe, faire valider son ajout séparément. Le hook est attaché au certificat du jeu et ne recharge Nginx que pour ce certificat, après test. Sources : [Certbot webroot](https://eff-certbot.readthedocs.io/en/stable/using.html#webroot), [test et rechargement Nginx](https://nginx.org/en/docs/switches.html).

## 8. Recette réelle

Depuis le poste d'administration disposant du code et de l'artefact approuvé :

```bash
node ops/verify-host.mjs https://etoilebois.loyaldev.fr /CHEMIN/ARTEFACT_APPROUVE
```

Le contrôle utilise la validation normale du certificat : aucun `curl -k` ou désactivation TLS. Il compare l'index et les bundles au manifeste, teste redirection, en-têtes, fichiers privés et médias directs refusés. `/healthz` vérifie le vhost statique, **pas Supabase**.

Effectuer ensuite `ops/verify-backend.mjs` avec les comptes de test et jetons CAPTCHA frais, puis une connexion réelle et un parcours sur PC/téléphone : administration, jour ouvert/aperçu, refus du futur, sauvegarde, fermeture et réouverture. Les variables de test restent hors Git. Le test des limites réelles se fait uniquement sur un projet de staging dédié, avec `ops/probe-auth-limits.mjs --confirm-staging-project` ; ne pas saturer les connexions de Debby en production.

Comparer l'état réel des bots avant/après sous leur compte propriétaire, sans commande de redémarrage. Les vérifications absentes sont consignées comme non effectuées. Ne déclarer le jeu déployé qu'après cette recette.

## 9. Mise à jour et retour arrière

Pour chaque mise à jour : nouveau SHA revu → nouveau build GitHub → nouveau dossier WinSCP → `stage` → examen → `activate` → `verify-host` et test utilisateur. Aucun fichier local n'est écrasé, aucune branche active n'est réinitialisée, aucune migration SQL n'est exécutée automatiquement.

En cas de régression du frontend :

```bash
sudo -u etoilebois "$ETB_NODE" "$ETB_OPS/release.mjs" rollback /var/www/etoilebois
```

Le lien revient à la version précédente, sans redémarrer Nginx ou PM2. Les sauvegardes/progressions ne sont pas annulées. Réexécuter la recette. La restauration des données suit une procédure séparée avec validation, décrite dans [Sauvegardes](SECRETS-ET-SAUVEGARDES.md). Aucun nettoyage automatique des anciennes versions n'est fourni.
