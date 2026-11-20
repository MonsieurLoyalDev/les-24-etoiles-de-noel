# Confidentialité · Audit local Phase G

| Frontière | Contrôle local | Vérification avant ouverture |
| --- | --- | --- |
| Navigateur et bundle | Mode privé Vite, publication contrôlée par la liste d’actifs et vérification du bundle. Contrôles de configuration publique dans `ops/lib/public-config.mjs`. | Inspecter les fichiers effectivement servis, les types MIME, le cache et les en-têtes du proxy. |
| Identité et invitation | Client avec clé publiable et Turnstile, sessions et client de fixture séparés. | Confirmer les inscriptions, redirections, invitations et limites d’authentification avec deux identités de recette. |
| Calendrier et progression | RLS et vérifications de dates dans les RPC existantes. La chaîne embarquée utilise les validateurs des migrations. | Vérifier les rôles et les dates sur l’environnement autorisé, avec les droits et réglages réellement déployés. |
| Scénarios et médias | Chargement authentifié des scénarios, stockage privé et règles de visibilité par jour. Les données sources et captures restent hors Git et de la CI. | Vérifier les réponses anonyme, joueur, aperçu et administrateur après import. |
| Données et rollback | Écritures canoniques distinctes de l’aperçu. Scripts de sauvegarde chiffrée et contrôle de restauration présents. | Restaurer en recette isolée avant de basculer. Tester chacun des périmètres de la sauvegarde avec les identités courantes. |

Les changements G sont locaux à la présentation. Aucun changement dans les migrations ou leurs droits. Cette revue s’appuie sur les tests locaux, les sources et le diff de la phase. Elle ne certifie pas l’historique complet du dépôt ni la configuration des services distants.
