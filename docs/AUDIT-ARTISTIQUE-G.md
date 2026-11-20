# Audit artistique · Étoilebois

Base F.4 `ae2241b`, répertoire propre avant ouverture de la branche G. Références détaillées dans les rapports F à F.4. Images du jeu sur le build privé avec fixtures, à 1920 × 1080 sur PC et 390 × 844 sur mobile émulé. Les images sont conservées hors Git. La prise initiale capturait parfois le fondu d’entrée de 180 ms. La série utilisée pour l’audit attend 400 ms après le chargement.

| Lieu | Constat en jeu | Décision |
| --- | --- | --- |
| Place centrale, village | Pavés, neige et accessoires composés, sapin et socle lisibles, façades dorées | Référence de matière, de profondeur et de couleur. Le sapin reste issu de F.4 |
| Chalet, bibliothèque, auberge, atelier | Textures nettes et mobilier distinct par pièce. Après le fondu, la palette chaude est visible même à l’atelier. Les aires sombres correspondent aux contours des plans | Préserver sols, mobilier, accès et éclairage de base |
| Forêt, hameau, montagne | Des îlots répétés de neige tassée suggèrent une piste mais ne relient pas visuellement les lieux | P2. Remplacer ces îlots par des sentiers texturés et irréguliers |
| Jardin | Fontaine et banc lisibles, piste discontinue entre l’arche et le cœur du jardin | P2. Dessiner les raccords vers la fontaine et le banc |
| Lac | Ponton et bordure de glace distincts. Le blanc continu jusqu’au seuil du bois rend l’accès peu marqué sur mobile | P2. Relier la rive au point d’entrée, sans toucher à la glace |
| Observatoire, réserve | Matières chaudes et architecture lisible après le fondu. L’observatoire présente un grand plancher ouvert autour de sa carte | Observer les transitions et l’ambiance lors de la recette des scènes |
| Clairière | Bassin et pierres lisibles sur neige froide | Vérifier pendant les scènes concernées |
| Sanctuaire | La neige, la pierre et les arbres reprennent la palette des autres extérieurs, le cercle domine | Préserver la composition F.3 et vérifier l’arrivée et le Jour 18 |

Pile actuelle. React gère dialogues, journal et calendrier. Phaser dessine les régions, acteurs et collisions. `src/world` possède le graphe de navigation et les activités D.4. `src/narrative` orchestre les scènes privées. IndexedDB et le contrat Supabase gardent des rôles distincts. Les essais locaux utilisent le pipeline Vite privé, la liste de ressources autorisées et PostgreSQL embarqué pour la chaîne canonique.

Les matières historiques de la place et la neige bleutée D.3.1 servent de référence. Pas de nouveau décor avant d’avoir éprouvé la composition avec les atlas existants. Aucune anomalie P0 détectée par la capture seule. Cette observation n’évalue pas les 24 parcours.
