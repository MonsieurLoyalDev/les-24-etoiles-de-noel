# Vérifications Phase D — 4 novembre 2026

Version 0.4.0. Les constats VPS proviennent des deux audits en lecture seule exécutés par l'utilisateur dans PuTTY. Aucun déploiement, rechargement Nginx, changement PM2 ou opération PostgreSQL n'a été effectué sur son serveur.

## Résultats locaux Windows

| Contrôle | Résultat |
|---|---|
| ESLint | Réussi |
| TypeScript strict / build Vite | Builds privé et démonstration réussis |
| Tests unitaires/SQL et infrastructure | 111 réussis, 2 tests POSIX réservés à Linux, 8 fichiers |
| Playwright Phases A/B/C | 10 tests réussis, PC 1280×800 et mobile 390×844, ~4 min 6 s |
| 24 journées | Terminées dans les deux formats ; progression/rejeu/éditeur fictif conservés |
| Scripts Bash d'audit et de renouvellement | Syntaxe vérifiée par Git Bash ; scripts d'audit exécutés réellement dans PuTTY par l'utilisateur |
| DNS | A confirmé vers 51.210.40.92 ; aucun AAAA retourné au dernier contrôle |
| HTTPS actuel du domaine | Refusé par la validation du nom de certificat ; certificat dédié à créer après accord |

Les nouveaux tests couvrent : refus des fichiers supplémentaires/altérés, des clés serveur et variables publiques inattendues, absence de configuration Auth/CAPTCHA, isolation des versions, absence d'activation implicite, validation des chemins, génération du vhost, chiffrement/restauration des médias et données, refus de mauvaise clé/corruption/mélange de sauvegardes/média existant différent, jeton CAPTCHA obligatoire et refus serveur 429. Les tests SQL de Phase C continuent de vérifier les dates Paris, les rôles, RLS et les preuves des 24 journées. Les 24 journées ont aussi été rejouées après l'ajustement qui demande une URL média signée seulement à l'ouverture réelle de l'activité, et la renouvelle à sa réouverture.

## Vérifications Linux CI

Le workflow comporte un job de régression Node 24 et un job d'infrastructure **Node 22.22.3, version exacte du VPS**. Ce dernier exécute aussi les deux tests POSIX : activation/rollback atomiques et refus des liens symboliques.

Les intégrations préparées utilisent exclusivement le runner jetable :

- Nginx réel sur des ports locaux temporaires, certificat TLS de test : syntaxe, HTTPS, en-têtes, accès directs privés refusés, ACME, cache, SPA, changement de version, anciens chunks et rollback.
- Vrai frontend compilé privé servi par ce Nginx : deux tests PC/mobile avec CSP, reprise d'une sauvegarde A/B et formulaire CAPTCHA/réponse 429. Auth et Turnstile sont simulés pour cette fixture ; aucune authentification distante n'est prétendue testée.
- Conteneur PostgreSQL 17 créé par le test : migration, `pg_dump`, chiffrement, déchiffrement, `pg_restore` transactionnel et conservation d'une progression. Les octets Storage utilisent un double ; les identités Auth sont des fixtures, pas des comptes réels.

Le job infrastructure GitHub Actions du commit ff3293b a réussi : les 113 tests passent sur Linux, ainsi que Nginx réel, les deux parcours privés HTTPS PC/mobile et la restauration PostgreSQL chiffrée. Le test navigateur de mémoire utilise désormais une attente sur l’état réel des cartes, plutôt qu’une temporisation supposée suffisante sur un rendu logiciel lent. Consulter la Pull Request pour le résultat du dernier commit et du job complet de régression. Les certificats locaux de test ne prouvent pas un certificat Let's Encrypt pour le domaine réel.

## Encore à vérifier avant mise en service

- Validation du nouveau vhost et des chemins après l'audit reçu, puis autorisation explicite d'intervention.
- Supabase réel : configuration, invitations, RLS, Storage, CAPTCHA, limites serveur et sauvegardes complètes incluant Auth.
- Certificat public HTTPS du domaine, `verify-host`, `verify-backend`, connexion et sauvegarde sur téléphone physique.
- Restauration répétée sur une cible de test de la plateforme réelle et comparaison PM2 avant/après.

`etoilebois-api` et son redémarrage indépendant sont **sans objet** dans l'architecture retenue : aucune API Node locale n'est nécessaire et le fichier PM2 contient zéro application. L'indépendance des bots découle du déploiement statique et doit être confirmée par leurs états/PID après l'intervention future. La présence d'un domaine qui résout ou d'un autre site Nginx sur le VPS ne signifie pas que le jeu est déployé.
