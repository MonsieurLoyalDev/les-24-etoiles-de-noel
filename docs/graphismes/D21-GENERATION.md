# Sprites D.2.1 — provenance et prompts

Création autorisée explicitement par l'utilisateur après lecture du pack. Outil intégré **image_gen**, avec `transparent_background: true`. Aucun appel CLI, aucune clé API fournie et aucun détourage des planches. Référence stylistique pour chaque appel : `references-d21/planche_reference_1.png` ; seconde planche examinée comme complément visuel, jamais importée dans le runtime.

Fichiers livrés dans `public/assets/refinements-d21/` : `fir-source.png`, `bush-source.png`, `berries-source.png`. Les originaux générés sont copiés sans modification. Le recadrage alpha et la réduction de texture se font dans le jeu, comme traitement d'intégration mis en cache. Les quatre textures de neige viennent directement du pack utilisateur.

## Sapin — prompt exact

```text
Generate ONE isolated evergreen fir tree game sprite, not a sheet, no frame, no lettering. Reference image is STYLE ONLY, never copy board, text or background. Modern detailed cozy pixel art matching the painted Christmas village buildings in the reference. Three-quarter overhead RPG view, front-facing. Natural asymmetric layered dark forest-green branches with lush rounded irregular cushions of blue-white snow, short visible warm brown trunk. Entire tree including tip and base fully visible with wide transparent margins. No ornaments, no lights, no presents, no ground or shadow rectangle. Actual transparent background, clean alpha silhouette, no white outline, no isolated particles. Tall mature fir. Use crisp visible pixel clusters, softly modeled volume but no blurry edges. Intended display 55–77 world pixels wide; silhouette remains readable at that scale.
```

## Arbustes — prompts exacts

```text
Create ONE isolated transparent game sprite. One small rounded irregular evergreen shrub, no berries, naturally dense dark green leaves peeking under fluffy blue-white snow cushions. Reference is STYLE ONLY: modern detailed cozy pixel art matching reference buildings and vegetation examples. Three-quarter overhead RPG perspective, front view. Crisp visible pixel clusters, natural organic irregular silhouette and softly modeled volume. Entire plant visible, wide transparent margins. No text, no frame, no sheet, no other objects, no ground, no ground shadow, no white outline, no particles, no baked background. Intended display about 30 pixels wide in an RPG. Actual transparent alpha. Do not copy the reference board.
```

```text
Create ONE isolated transparent game sprite. One rounded compact winter holly shrub, irregular dark green leaves, several small red berry clusters and fluffy blue-white snow cushions. Reference is STYLE ONLY: modern detailed cozy pixel art matching reference buildings and vegetation examples. Three-quarter overhead RPG perspective, front view. Crisp visible pixel clusters, natural organic irregular silhouette and softly modeled volume. Entire plant visible, wide transparent margins. No text, no frame, no sheet, no other objects, no ground, no ground shadow, no white outline, no particles, no baked background. Intended display about 30 pixels wide in an RPG. Actual transparent alpha. Do not copy the reference board.
```

Les aperçus sont inclus dans le comparatif ; l'utilisateur conserve la validation artistique finale. Aucune approbation antérieure des personnages ou façades ne s'étend implicitement à ces nouvelles créations.
