# Phase G · Journal de revue publique

La branche de revue part du commit public du Lot C `dc96b61`. Le delta fonctionnel adapté et les rapports sont suivis ici. Le diff de référence sans contexte additionnel couvre les changements de code et de tests entre F.4 et la Phase G.

Les captures, les scénarios et les traces de la recette intégrale sont conservés séparément. La recette décrite dans les rapports de la Phase G concerne la version intégrale F.4 + G.

La relecture longue immédiatement après la campagne reste à vérifier. Les deux relectures de même durée sur une sauvegarde rechargée ont réussi sur PC et mobile émulé.

## Contrôles de la branche publique

| Contrôle local | Résultat |
| --- | --- |
| TypeScript et lint | Réussis |
| Vitest | 279 réussis, 4 ignorés, 0 échec. 37 fichiers exécutés, 1 ignoré |
| Compilation privée et inventaire | Réussis, 269 ressources contrôlées, paquet de démonstration exclu |
| Chromium sous Windows | 10 réussis, 0 échec sur PC et mobile émulé. Images et fontes, limites des rôles, calendrier daté, médias futurs refusés et dialogue fictif à quatre choix |

Les protections sont exercées avec des comptes et données de test fictifs. La revue des modifications porte aussi sur les 11 commits locaux de la Phase G et leurs fichiers successifs. L’historique publié repart du Lot C, avec des métadonnées de commit dédiées à la revue. Aucun actif statique, workflow ou schéma Supabase ne figure dans le delta de revue.
