# Recette locale · Phase G

Les résultats ci-dessous concernent la Phase G intégrale sur sa base F.4. Pour les contrôles de la branche publique adaptée au Lot C, voir le [journal de revue](PHASE-G-ETAT-AVANCEMENT.md).

| Vérification | Résultat |
| --- | --- |
| TypeScript et lint | `npx tsc --noEmit` et `npm run lint` réussis sur les sources finales. |
| Vitest | 308 tests réussis dans 47 fichiers, 2 tests POSIX ignorés sous Windows, aucun échec sur la relance. |
| SQL et progression | 24 jours dans la chaîne canonique PostgreSQL embarquée, avec les validateurs et RPC réels. |
| Build privé | 288 ressources conformes. La sortie isolée contient 293 fichiers, avec les mêmes contrôles de confidentialité. |
| Préparation du paquet VPS | Artefact de fixture préparé localement. |
| Comparaisons des régions | 28 vues de référence et 28 contrôles finaux réussis. PC 1920 × 1080 et mobile émulé 390 × 844, Canvas. Collisions sérialisées identiques et aucune texture manquante dans les scènes observées. |
| Vues de nuit | 8 contrôles réussis au village, au lac, au jardin et au sanctuaire. Le sanctuaire conserve l’éclairage propre de F.3. |
| Réduction des mouvements | Dix flocons au lac en PC animé, zéro en mobile avec réduction. |
| Recette privée E.1 | 10 tests réussis, contrôle des images et fontes, rôles, anonymes, calendrier, interruption et reprise de l’activité de Célestine. |
| Activités de métier | 6 contrôles réussis sur PC et mobile. Lecture et fauteuil, courrier, poses et lumière de lanterne. |
| Dialogue long | 2 tests réussis, quatre choix sans débordement, défilement au clavier et reprise du choix sauvegardé. |
| Jour 1 | 2 parcours réussis sur le build privé final. L’échec mobile intermédiaire sur le geste de couple est corrigé et le cas a été rejoué. |
| Jour 18 | Deux parcours complets d’aperçu, PC et mobile émulé. Les neuf scènes et la reprise sont vérifiées. |
| Jour 24 canonique | 2 parcours réussis sur le build final, cinq tableaux, danse à plusieurs poses sur PC, épilogue et 24 récompenses. Cette suite laisse de côté les rejeux facultatifs sans geste. |
| Rejeux du Jour 24 | Dans la suite élargie, 4 cas ont atteint la fin du récit puis expiré sur une relecture facultative. Les traces exploitables montrent un second lancement. Après chargement d’une progression canonique obtenue via les RPC, deux rejeux de 120 secondes sur chacun des deux profils passent et conservent exactement 24 récompenses. Le scénario réduit à 10 secondes sert uniquement au diagnostic et passe aussi sur les deux profils. |

Les mesures sur 120 trames au village, au lac et au sanctuaire situent le p95 observé entre 17 et 19 ms sur ce poste, à travers les deux profils. Les suites se chevauchaient pendant ces mesures. Elles ne constituent pas un benchmark sur plusieurs appareils.

La recette principale totalise 60 tests navigateur réussis. Les mesures de référence en contiennent 28. Cinq tests de rejeu isolé réussissent en plus de la recette principale. Les échecs de la suite longue restent consignés, car les rejeux isolés ne reproduisent pas l’enchaînement immédiatement après une partie continue.

Le premier build de test utilisait une valeur de fixture différente de celle exigée par les parcours privés. Après alignement, les parcours ont démarré. La première série de captures en parallèle sur une origine non prévue a été rejetée par les fixtures. Elle a été rejouée sur l’origine déjà autorisée. Les premiers essais ne sont pas comptés parmi les contrôles réussis.

Les avertissements Vite de ressources CSS résolues à l’exécution et de taille de blocs sont présents. La vérification finale recoupe les ressources statiques avec la liste d’autorisation. L’intégration Nginx est prévue pour CI Linux. Supabase et VPS réels ainsi que Safari sur appareil physique restent à contrôler.

Le JavaScript final représente 266,77 kB gzip pour l’application et 332,17 kB gzip pour Phaser, selon Vite. L’artefact issu du build standard a été vérifié par `package:vps` sur le poste.

Le diff à partir de `ae2241b` confirme que `public`, les migrations, le modèle de sauvegarde et le calendrier sont identiques. Les changements d’interface passent par les composants partagés et conservent les textes des scénarios.
