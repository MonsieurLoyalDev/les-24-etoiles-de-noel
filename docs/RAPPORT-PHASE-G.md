# Phase G · L’Édition enchantée

Le rapport décrit la Phase G intégrale, réalisée sur la base F.4. La branche de revue publique part du Lot C. Le code adapté couvre les sentiers de la forêt, du hameau et du lac, les animations et l’ambiance compatibles, la lecture des dialogues, les gestes de couple, le retour de caméra et la fiabilité du build privé. La montagne, le jardin et les raccords propres à la présentation F.4 sont consultables dans le [diff de référence](PHASE-G-DELTA-F4.patch). Il documente les changements de code et de tests de la Phase G.

La forêt, le hameau, la montagne, le lac et le jardin disposent de sentiers en neige tassée. Les embranchements rejoignent les seuils, le banc et le ponton. Les couches sont construites à la première visite et les collisions des 14 zones comparées sont identiques à la référence. La composition F.3 du sanctuaire et le sapin F.4 servent de témoins.

Le clignement de Loyal et ses changements de posture utilisent ses poses V9, avec des temps de repos plus longs. Émile salue dans la direction du voisin lorsque la scène et la caméra le permettent. Les régions d’hiver reçoivent quelques flocons en mode animé. Les choix du dialogue se déploient sur une colonne sur téléphone étroit et le texte peut recevoir le focus clavier. Le cadrage des spectacles tient compte de la hauteur et de la largeur.

La tentative mobile du Jour 1 a mis en évidence un geste optionnel qui pouvait disparaître avant que Loyal ait rejoint Debby. La demande passe désormais par l’attente déjà utilisée par les séquences du couple. Le geste démarre à portée et s’annule si la joueuse repart ou change de scène.

Le dossier de lancement contient un ordre de migrations, les étapes de remise privée, une procédure de retour arrière et la checklist de recette distante. Les validations créateur, mobile physique et infrastructure restent ouvertes. Voir la recette pour les résultats et le registre des réserves pour la portée de la finition.

Le build Vite privé écrivait ses ressources dans `dist` même avec un autre répertoire de sortie explicite. Les fichiers contrôlés et le manifeste suivent désormais la sortie de Rollup. Le build isolé est vérifié avec le même vérificateur et la même liste d’actifs que le build standard.
