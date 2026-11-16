# Déploiement privé contrôlé

Aucun déploiement automatique ni intervention réelle dans cette opération. Réutiliser les guides et scripts VPS existants ; ne pas toucher aux autres vhosts, bases ou processus PM2.

Le dépôt de **code est public par choix du créateur**. Les formulations anciennes « dépôt privé » dans les guides historiques ne changent pas cette décision. Aucun scénario original, capture personnelle, PDF, média privé, clé serveur ou mot de passe ne doit passer dans GitHub Actions ou ses artefacts. La CI ajoutée utilise uniquement les fixtures fictives du dépôt.

## Supabase, après validation et sauvegarde

Suivre [la configuration Auth/Storage existante](../CONFIGURATION-SUPABASE.md), puis appliquer **une seule fois**, dans l'ordre, les migrations manquantes de `supabase/migrations/` :

```text
202611030001_advent.sql
202611160001_narrative.sql
202611160002_episode_calendar_contract.sql
202611160003_production_activities.sql
```

La dernière migration est additive : elle garde les versions de contenus et les progressions existantes. Elle valide les brouillons/solutions des nouvelles activités, transporte les conséquences/pages déjà gagnées et réserve la recette sans prérequis aux administrateurs en aperçu. Une version déjà utilisée ne se réécrit pas : publier une nouvelle version, conserver l'ancienne pour les sauvegardes qui y sont attachées.

Inviter les deux comptes via Auth (inscriptions publiques fermées), activer CAPTCHA et limitation de connexion, puis renseigner `public.app_members` avec leurs véritables UUID uniquement dans SQL Editor administrateur. Les placeholders et commandes du guide Supabase ne sont pas des comptes préconfigurés. URL et redirections autorisées : `https://etoilebois.loyaldev.fr` et, si nécessaire, l'origine locale de recette. La clé secrète Turnstile se règle dans Auth, jamais dans Vite.

## Import narratif depuis le poste privé

Les scénarios JSON compilés sont livrés **hors dépôt**, avec leurs empreintes dans le dossier privé de production. Avant import local :

```powershell
npm ci
npx tsx scripts/check-narrative-source.ts CHEMIN_PRIVE/episode-02.json CHEMIN_PRIVE/episode-03.json
```

Répéter pour tous les fichiers à importer. Ce contrôle refuse la CI publique et n'affiche pas les répliques. Dans le jeu privé, se connecter en administrateur, ouvrir le calendrier puis « Aventure narrative » / atelier d'import administrateur et charger chaque JSON. Ne pas copier ces fichiers sous `public/`, dans un seed SQL versionné ou dans un bundle Vite. Tester chaque import dans l'aperçu séparé ; tester ensuite la chaîne de prérequis dans un projet de staging distinct, sans avancer l'horloge de production ni éditer artificiellement une progression réelle.

## Compilation et artefact statique

Configurer hors Git `.env.local` avec les seules valeurs publiques : `VITE_APP_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` publiable/anon et `VITE_TURNSTILE_SITE_KEY`. Les valeurs fictives de recette ne conviennent pas à une livraison. Puis :

```powershell
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build:private
npm run package:vps
```

Les messages de build concernant les fontes/images CSS sont suivis du contrôle effectif des fichiers copiés et de leurs octets ; une ressource réellement manquante fait échouer le contrôle. L'artefact de recette local avec URL `example.supabase.co` n'est jamais un site fonctionnel sur l'infrastructure réelle.

Pour le transfert WinSCP, la préparation de release, le vhost Nginx isolé, HTTPS et le retour arrière, suivre [les commandes VPS existantes](../VPS-UBUNTU.md) après audit frais et accord sur le diff concret. Aucun nouveau processus PM2/API n'est requis par cette architecture : Supabase reste hébergé séparément. Ne pas exécuter les commandes d'installation des guides tant que l'intervention réelle n'a pas été autorisée.

1. Sauvegarder les tables/progressions, médias privés et migrations appliquées ; tester la restauration sur une instance isolée.
2. Configurer Supabase Auth, membres invités, administrateur, CAPTCHA et URLs de redirection HTTPS conformément aux guides E.1/E.2.
3. Appliquer les migrations versionnées dans l'ordre, sur une copie de recette d'abord. Les scripts de scénarios sont absents de Git et de tout seed public.
4. Importer les fichiers narratifs privés depuis l'atelier administrateur ; conserver les versions déjà utilisées par une sauvegarde. Vérifier les publications et prérequis sans contourner les dates canoniques.
5. Fournir seulement les variables Vite publiques requises au build privé. Les clés privilégiées restent hors Git et hors frontend. Exécuter le contrôle de toutes les ressources autorisées et des types MIME.
6. Préparer l'artefact statique avec les scripts VPS existants ; le présenter pour validation avant installation. Utiliser le vhost isolé du domaine prévu et HTTPS ; aucun redémarrage global PM2 ou Nginx sans audit/validation.
7. Recetter sur le domaine réel : invitation, connexion, droits, URL média privée, date Europe/Paris à la frontière du 1er décembre, reprise après fermeture et sauvegarde/restauration. Les tests à horloge de fixture ne prouvent pas ce déploiement.

Retour arrière : conserver l'artefact précédent et ses configurations hors secrets ; remettre seulement le lien de release du jeu via la procédure existante. Ne pas supprimer une version de scénario ou une colonne utilisée par des sauvegardes ; les migrations nouvelles doivent être additives. Une restauration de données réelles nécessite une décision explicite après sauvegarde des écritures postérieures.

Le frontend de retour arrière doit savoir lire les scénarios déjà publiés. Ne pas revenir à E.2.1 après le démarrage d'épisodes qui utilisent les activités du Lot A : conserver une release compatible, fermer temporairement l'ouverture de nouveaux épisodes si nécessaire et préparer le correctif sur staging. Les anciens onglets doivent recharger la dernière version. Les versions de scénario et les checkpoints restent conservés ; un ancien client ne doit jamais servir à réécrire ces progressions.
