# Plan de déploiement privé · Phase G

Ce document décrit le processus pour la version intégrale. La branche publique sert à la revue de code.

1. Figer le commit autorisé. Exécuter la suite locale et préparer l’artefact avec `npm run build:private`, puis `npm run package:vps -- <répertoire-local>`. Utiliser exclusivement les variables de build publiques du modèle et conserver le manifeste avec les sommes.
2. En recette autorisée, inventorier les migrations déjà appliquées et exporter une sauvegarde chiffrée de la base et du Storage. Vérifier l’archive et répéter la restauration sur une cible isolée avec `ops/backup.mjs`.
3. Appliquer les migrations manquantes dans l’ordre du dossier `supabase/migrations`. Le socle `202611030001` précède les trois migrations `202611160001` à `202611160003`, puis `202611180001`, `202611180002` et la finale `202611190001`. La Phase G n’en ajoute aucune.
4. Préparer la remise privée des scénarios et médias via les opérations administratives existantes. Vérifier les règles et la séparation des rôles avant d’inviter une vraie personne.
5. Préparer Nginx et HTTPS selon `ops/nginx`. Contrôler les configurations avant activation et conserver l’artefact antérieur. `ops/release.mjs` dissocie `stage`, `activate` et `rollback`. La publication sert un build statique, les processus de supervision et de sauvegarde restent distincts.
6. Tester la recette distante et la surveillance. Consulter les codes de réponse et erreurs d’infrastructure en retirant les identités, jetons et informations personnelles. En cas de régression du site, restaurer d’abord le pointeur de version. Une restauration des données nécessite une décision séparée et un contrôle du périmètre.

Voir aussi `production/PLAN-RECETTE-DEPLOIEMENT.md`. Les commandes de préparation locale sont distinctes des opérations sur un hébergeur.

Les emplacements audio, l’activation volontaire, le muet, les volumes de canal et le fondu entre pistes existent. La recette locale garde les pistes silencieuses faute de fichiers autorisés. Avant intégration, associer chaque fichier et sa provenance au registre des ressources privées, inclure son type MIME dans le contrôle de livraison et vérifier la lecture dans les navigateurs cibles. Voir `production/BESOINS-AUDIO.md`.
