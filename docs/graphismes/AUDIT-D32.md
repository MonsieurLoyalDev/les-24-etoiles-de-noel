# D.3.2 — Audit et plan d'implantation

Base exclusive : D.3.1 v0.7.1, commit `21f1e0a8c615b585e2600651f412ed0c565fb46c`, checkout propre au départ. Branche `feature/phase-d3-2-village-habite`.

## Intérieurs en priorité

Les quatre pièces gardent 480 × 352, leurs trois meubles actuels, leur architecture, leurs sorties et interactions. Les documents et textiles D.3.1 restent présents. Les rayonnages, outils, tables, foyers et plaids existants sont réutilisés.

Nouveaux besoins identifiés avant génération : quatre petits meubles de souvenirs/rangement en bas à gauche, deux poses d'un chat dans son panier, une bougie éteinte, une lampe éteinte, deux petites flammes transparentes, une volute de vapeur et un jouet mécanique. Les objets allumables ont des flammes/couches lumineuses distinctes ; masquer un glow devant une flamme peinte ne sera pas présenté comme une vraie extinction.

Les meubles périphériques sont réservés à x36..84, y260..320. Ils évitent les chemins des PNJ (x100..160, y175..230), l'apparition en (240,280), la sortie (240,315), l'ancre du calendrier (300,270) et les activités actuelles. Le chat et le jouet restent près du bord droit, hors du passage x385 utilisé par les parcours existants. Les nouvelles emprises seront ajoutées séparément : aucun rectangle de collision antérieur n'est déplacé ou réduit.

Les états décoratifs sont sauvegardés sous une clé indépendante des sauvegardes du RPG et de l'Avent. Les interactions utilisent le bouton, la touche E et le composant de dialogue existants. Aucun événement de quête ni étoile ne doit résulter d'un objet décoratif.

L'assise réelle est écartée : aucun sprite assis validé n'est disponible. Les fauteuils pourront être examinés, sans couper ni déformer les personnages pour simuler une posture.

## Village : étude avant placement

Le monde reste 1024 × 768. Les chemins, terrains, entrées et bâtiments antérieurs restent inchangés. Huit emplacements candidats sont étudiés pour de petites habitations de 96 à 126 pixels de large : (300,160), (632,210), (57,455), (310,590), (337,732), (650,704), (970,610), (965,370). Il s'agit de réservations à contrôler géométriquement et visuellement, pas d'un quota à imposer.

Les voies ouest et de Flocon, les grands parvis, la place, les points de quête et les portails sont des zones d'exclusion. Les nouvelles maisons seront décoratives, sans nouveaux intérieurs ni personnages. Des collisions additives seront limitées à leurs seules emprises ; elles ne doivent pas empiéter sur les accès existants. Les emplacements trop serrés seront écartés plutôt que d'agrandir le monde ou de déplacer les éléments validés.

Les silhouettes seront réellement distinctes, avec des abords composés : porche, volets, cheminée, courrier, bûches ou jardinet. Aucune grande plaque de neige peinte ne recouvrira le terrain validé. Les lumières et fumées seront ancrées aux nouveaux éléments et respecteront les préférences graphiques.

## Ordre et vérifications

A. Enrichir les intérieurs avec les ressources manquantes. B. Intégrer le système décoratif et tester chaque action, les états persistants, les accès et la réduction des mouvements. C. Contrôler les emplacements et intégrer les maisons. D. Ajouter les détails et animations extérieurs. E. Polir et optimiser, puis exécuter lint, TypeScript, unités, build, parcours navigateur historiques et nouveaux. Commits séparés pour les intérieurs/interactions, les habitations/ambiances et la livraison.

Les nouvelles ressources seront créées avec `image_gen` intégré, inspectées, puis exportées à leur résolution utile. Les originaux et prompts seront conservés. Les ressources D.3.1 validées, notamment la neige, ne seront pas réexportées ou remplacées.

## Décision après contrôle rapproché

Les huit candidates ont passé l'exclusion géométrique, mais plusieurs petites façades se sont révélées disproportionnées face à Debby. La livraison retient quatre maisons agrandies : porche (48,505), jardin (285,630), pignon haut (385,740), baie vitrée (960,410). Les quatre autres restent seulement comme originaux de recherche, sans export public ni chargement. Les emprises ont été ajustées à la silhouette réelle puis les exclusions et collisions retestées. Le monde n'a pas été agrandi pour atteindre un quota.

Deux nouveaux ensembles par intérieur complètent finalement les meubles D.3.1 : console personnelle et coin bas de vie/lecture/rangement. Les collisions des consoles se limitent à leur pied, de largeur propre à chaque sprite, plutôt qu'à leur silhouette haute. Les interactions prévues restent au nombre de dix-sept. Le budget supplémentaire des quartiers est de huit volutes en qualité complète et quatre en qualité douce.
