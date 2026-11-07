# CODEX — ÉTOILEBOIS PHASE D.2.1 — FINITIONS ARTISTIQUES

Base obligatoire : projet `etoilebois-phase-d2-embellissement.zip` (version 0.6.0). Ne pas repartir de zéro.

## Important : nature du pack
Les deux planches dans `references/` sont des **références artistiques**, PAS des atlas prêts à découper automatiquement : elles contiennent des titres, cadres, fonds sombres et des exemples d'enseignes avec texte incrusté. Ne jamais les importer directement comme sprites du jeu. Ne pas les détourer à l'aveugle. Les 4 textures `terrain/` sont de vrais PNG répétables 64×64, utilisables pour tester un fond de neige subtile. Vérifier la qualité à l'échelle réelle.

## Objectifs
1. **Neige** : conserver les sols, collisions et chemins D2 ; remplacer l'effet de grand aplat blanc par une texture discrète. Tester les variantes de `terrain/`, faire une transition douce entre neige et pavés, éviter la répétition apparente. La neige doit rester majoritairement claire et lisible.
2. **Arbres et arbustes** : retirer progressivement les anciens buissons/sapins cubiques (`bush_berries`, `bush_snow`, `pine_large`) et les remplacer UNIQUEMENT par des sprites isolés transparents propres et validés, avec feuillage irrégulier et neige volumétrique. Les planches de référence montrent le style désiré, mais ne sont pas des sprites utilisables. Si les nouveaux PNG transparents ne sont pas fournis, créer une liste de ressources manquantes et ne pas prétendre avoir remplacé la végétation.
3. **Enseignes** : concevoir des plaques en bois sombre, cuivre et neige, à texte DYNAMIQUE dans le jeu (jamais texte gravé dans les PNG). Pour les lieux, afficher les noms contextuels : « Maison de Loyal », « Atelier de Basile », « Bibliothèque de Célestine », « Boulangerie de Madeleine », « Poste d’Émile », « Mairie d’Augustin » quand le lieu correspondant existe. N'afficher aucune enseigne flottante permanente encombrante : privilégier une plaque attachée au bâtiment ou une étiquette au survol / à proximité. Taille lisible mobile et desktop.
4. **Ambiance** : améliorer les bordures des chemins, petites congères, traces de pas, disposition des bancs, lanternes, clôtures, jardinières. Préserver la circulation, les interactions et la lisibilité.
5. **Cohérence** : ne pas remplacer les personnages, bâtiments et HUD validés. Ne pas créer de nouvelle mission, calendrier, système de quêtes ou gameplay.

## Validation
Captures PC/mobile avant-après et vue globale ; inventaire des assets réellement utilisés ; lister séparément les références non intégrables et les ressources manquantes ; exécuter lint, build et tests. Arrêter et demander validation avant D3.
