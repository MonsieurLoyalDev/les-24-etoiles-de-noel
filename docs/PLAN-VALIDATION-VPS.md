# Changements proposés — à valider après l'audit

Cible : `etoilebois.loyaldev.fr`. Ce plan ne constitue pas une autorisation d'exécuter les commandes. Le VPS reste inchangé par cette préparation.

| Ajout prévu | Rôle | Portée |
|---|---|---|
| Utilisateur système `etoilebois`, sans connexion interactive | Propriétaire des versions du jeu | Aucun changement des utilisateurs des bots |
| `/var/www/etoilebois` | Versions statiques, liens `current`/`previous`, anciens assets et webroot ACME | Nouveau dossier dédié ; refus s'il contient des données inconnues |
| `/var/lib/etoilebois/inbox` | Réception WinSCP des paquets approuvés et outils | Nouveaux sous-dossiers, jamais de copie sur une version active |
| `/etc/nginx/sites-available/etoilebois.conf` et lien correspondant | Vhost du seul domaine du jeu | Aucun vhost existant remplacé ; comparaison préalable de l'audit |
| Certificat `etoilebois.loyaldev.fr` dans Let's Encrypt | HTTPS | Webroot dédié, sans plugin qui réécrit les autres vhosts |
| `/usr/local/lib/etoilebois/ops` et `cert-renew-hook.sh` | Outils root en lecture seule pour le compte du site ; renouvellement du seul certificat du jeu | Nouveaux fichiers root ; hook attaché au certificat dédié |
| `/etc/etoilebois` en 0700 | Variables et fichiers de sauvegarde privés | Aucun secret dans le site, le ZIP ou GitHub |
| `/var/backups/etoilebois` en 0700, si les sauvegardes sont exécutées ici | Archives chiffrées | Export off-site et clés conservées séparément |
| Node 22.22.3 existant | Outils de déploiement, après contrôle du chemin et des permissions | Aucune installation/version globale changée ; solution privée seulement si son accès l'impose |

Les fichiers publics compilés occupent actuellement environ 4,7 Mo par version. Le VPS audité dispose de 2 CPU, 3,7 Gio de RAM dont 2,6 disponibles et 30 Go libres à cet instant. La compilation reste dans GitHub. Les versions conservées et médias devront être dimensionnés ; les sauvegardes peuvent être exécutées sur un poste d'administration pour limiter la charge du VPS. Le Nginx et Certbot existants sont réutilisés : leur réinstallation n'est pas prévue.

## Décisions soumises à validation

1. Audit reçu : les ports 80/443 sont déjà servis par Nginx. Réutiliser ce service ; aucun paquet Nginx/Node/PM2/PostgreSQL n'est à réinstaller. Conserver les vhosts `default`, `elysium.loyaldev.fr` et `emt.loyaldev.fr`.
2. IP confirmée : `51.210.40.92`, déjà retournée par l'enregistrement A du jeu. Conserver ce DNS. Un nouveau certificat dédié est nécessaire ; les certificats des deux autres domaines ne le couvrent pas. Conserver le timer Certbot Snap existant et laisser AAAA absent pour le vhost IPv4 préparé.
3. Diff exact du nouveau fichier Nginx et absence de `server_name` en conflit. Le premier chargement et le renouvellement exigent un rechargement gracieux de Nginx après `nginx -t`. Aucun redémarrage d'un bot n'est nécessaire.
4. Projet Supabase dédié hébergé, CAPTCHA et limites Auth activés, comptes invités et politique de sauvegarde décidée.
5. Commit exact à publier, artefact vérifié et tests d'acceptation à effectuer.

Aucune commande PM2 globale, installation PostgreSQL locale, mise à jour globale de Node/PM2, modification du pare-feu ou activation de déploiement SSH automatique n'est incluse. Les règles réseau nécessaires devront être examinées dans l'audit avant toute décision. Le fichier PM2 vide ne doit pas être lancé : aucune API n'est à démarrer ou redémarrer dans cette architecture.

## Critères pour déclarer le déploiement terminé

- DNS et certificat HTTPS valides pour le domaine réel ; vérification sans ignorer les erreurs TLS.
- `ops/verify-host.mjs` valide le bon artefact, les en-têtes et les refus d'accès direct.
- Connexion réelle de comptes de test, administration autorisée/refusée selon le rôle, jour ouvert accessible et jour futur refusé par le serveur.
- Médias privés inaccessibles par URL publique ; limites Auth et CAPTCHA contrôlés sur le service.
- Parcours PC et téléphone réel, sauvegarde puis fermeture/réouverture, retour arrière du frontend testé.
- Sauvegarde complète de la plateforme et répétition de restauration applicative/médias sur cible de test.
- Comparaison des noms, PID, compteurs de redémarrage et états des bots avant/après, sous le compte qui les possède. Le remplacement des seuls fichiers statiques n'émet aucun signal vers eux.

Les tests CI prouvent le comportement des outils dans leurs fixtures isolées ; ils ne remplacent pas ces contrôles sur le VPS réel.
