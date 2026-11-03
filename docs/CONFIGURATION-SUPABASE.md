# Configuration privée — Phase C

Le dépôt livre un backend PostgreSQL pour Supabase, pas un projet Supabase déjà provisionné. Aucun compte réel, mot de passe, souvenir personnel ou secret serveur n'est fourni. Le mode par défaut est une **démonstration fictive non sécurisée**. Ne pas y saisir les véritables surprises.

## Installation

1. Créer un projet Supabase privé dans votre organisation. Dans Auth, désactiver les nouvelles inscriptions publiques. Configurer Site URL et Redirect URLs vers votre frontend HTTPS (et `http://localhost:5173` pour vos essais locaux). Inviter les comptes Debby et administrateur depuis le tableau de bord. Le formulaire du jeu utilise e-mail/mot de passe, sans inscription.
2. Exécuter `supabase/migrations/202611030001_advent.sql` dans SQL Editor, ou avec `supabase db push` après avoir lié votre projet via la CLI. La migration s'applique une fois. Elle crée les tables, RPC, droits, RLS et le bucket **privé** `advent-media`.
3. Facultatif : exécuter `supabase/seed.sql` pour importer les 24 journées **fictives**. Ce seed ne remplace pas les lignes déjà personnalisées. `npm run seed:demo` le régénère à partir des démonstrations ; ne pas ajouter vos souvenirs au code ou au seed.
4. Copier les UUID Auth réels dans les commandes suivantes, exécutées uniquement dans SQL Editor administrateur :

```sql
insert into public.app_members(user_id, role)
values ('UUID_ADMIN'::uuid, 'admin'), ('UUID_DEBBY'::uuid, 'player');
```

Les UUID ci-dessus sont des emplacements à remplacer. Les rôles sont lus dans cette table protégée, jamais dans les métadonnées modifiables de l'utilisateur. Un compte Auth absent de cette liste ne reçoit aucun contenu. Ajouter les membres avant leur première ouverture du lien d'invitation ; ce lien établit leur session dans le frontend. Dans le calendrier, « Mon compte privé · définir mon mot de passe » permet alors d'enregistrer un mot de passe (12 caractères minimum). Tester ensuite déconnexion et connexion classique.

5. Copier `.env.example` vers `.env.local`, renseigner :

```dotenv
VITE_APP_MODE=supabase
VITE_SUPABASE_URL=https://VOTRE_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIABLE_OU_ANON
```

La clé publiable/anon peut être envoyée au navigateur. **Jamais** de clé `service_role`, `sb_secret_*`, mot de passe PostgreSQL ou JWT privilégié dans une variable `VITE_*`. Le client refuse les clés secrètes connues. Les fichiers `.env*` sont ignorés par Git, sauf l'exemple vide.

6. Lancer `npm run dev`, se connecter et personnaliser depuis « Administration des surprises ». En mode privé, l'aperçu des 24 jours est réservé au rôle administrateur et sauvegardé dans un espace distinct des étoiles réelles.
7. Importer le film du jour 10 via l'éditeur : le chemin `/demo/surprise.webm` est un exemple local et n'est pas disponible dans le build privé. Le remplacer par le chemin privé retourné par l'import. La transcription reste une alternative interactive accessible.

## Publication Vercel

Configurer les trois variables ci-dessus dans Vercel avant le build, commande `npm run build:private`, répertoire `dist`, installation `npm ci`. Le projet contient déjà la réécriture SPA `vercel.json`. Le mode privé ne bascule jamais silencieusement en démonstration si Auth ou les variables manquent. Une modification d'environnement nécessite un nouveau build. Le déploiement Vercel reste à réaliser sur votre compte.

## Frontière de sécurité

- Les dates sont calculées dans PostgreSQL avec `make_timestamptz(2026,12,jour,0,0,0,'Europe/Paris')`, jamais autorisées par l'horloge du téléphone. Le 1er décembre ouvre le 30 novembre à 23:00 UTC ; le 24 ouvre le 23 décembre à 23:00 UTC. Les jours passés restent ouverts sans expiration.
- `advent_status` ne retourne que numéros, disponibilité et progression personnelle ; aucun titre, texte ni réponse d'une journée future. `advent_day` vérifie membre/date côté serveur. La sélection directe de table applique aussi RLS. Pas de préchargement des surprises futures.
- Les réponses sont dans le schéma `private`, sans droit de lecture client. Les RPC valident les preuves, l'ordre, l'utilisateur, l'identifiant de manche et la version. Un rejeu ne crée pas une seconde étoile. Les champs de progression ne peuvent pas être écrits directement par un joueur.
- Authentification privée + liste de membres + RLS : rendre l'URL du frontend difficile à deviner ne constitue pas la protection. Les fonctions `SECURITY DEFINER` fixent `search_path=''`, leurs droits d'exécution sont explicitement restreints.
- Médias : bucket privé, dossiers `1/` à `24/`, lecture selon membre/date, écriture administrateur uniquement. Les URL signées sont demandées après autorisation et expirent après 300 secondes. Un média déjà ouvert et téléchargé ne peut pas être rendu secret à nouveau. Aucune URL publique de stockage n'est utilisée.
- Les brouillons locaux et les jetons Auth persistent sur l'appareil : utiliser des appareils de confiance et se déconnecter sur un appareil partagé. Les brouillons sont isolés par utilisateur/manche/mode. Les anciennes sauvegardes A/B restent dans leur espace existant ; le backend sauvegarde séparément l'Avent par compte.
- Les validations de mini-jeux contrôlent les résultats et l'ordre, mais ne constituent pas un système anti-triche compétitif : un joueur autorisé qui fabrique une preuve valide de son jour ouvert peut la soumettre. Cela ne donne accès ni à un jour futur ni aux réponses privées.

## Vérifications avant utilisation réelle

`npm test` exécute la migration réelle sur PostgreSQL embarqué PGlite avec des doubles des schémas Auth/Storage. Cela vérifie SQL, privilèges, RLS, dates, isolation et validation, mais ne remplace pas un essai sur votre instance Supabase : connexion/invitation réelle, URL signées et téléchargement HTTP Storage doivent être contrôlés après configuration. Ne pas avancer l'horloge de production pour tester ; utiliser l'aperçu administrateur.

Références officielles : [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [fonctions SQL](https://supabase.com/docs/guides/database/functions), [sécurité Storage](https://supabase.com/docs/guides/storage/security/access-control).
