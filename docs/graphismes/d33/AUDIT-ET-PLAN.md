# D.3.3 — Audit et plan de réorganisation avant intégration

Base : D.3.2 v0.7.2, commit a7827c8e9df7595888cdb9b44c91db7714e0a48e. Checkout propre, nouvelle branche dédiée. Les captures originales sont copiées dans `docs/screenshots/phase-d3-3/avant`.

## Diagnostic

Le monde actuel mesure 1024 × 768. Quatre bâtiments fonctionnels : maison de Loyal (largeur 180), bibliothèque (208), atelier (208), auberge (224). Les personnages humains mesurent 52 pixels de haut. Les nouvelles habitations D.3.2 ont des largeurs réelles de 87,5 / 202 / 91 / 120 pixels : ces écarts ne sont pas guidés par une mesure commune des portes. La hauteur de porte devient désormais la référence, autour de 44–52 pixels ; aucune façade ne sera réduite pour tenir dans une parcelle trop étroite.

La maison à baie vitrée est au pied (960,410). Le sapin solide du plan original en (944,416) passe devant ses fenêtres et sa façade ; les arbres décoratifs (979,337) et (988,412) resserrent encore ce groupe. Le sapin (944,416) sera déplacé avec sa collision vers une lisière hors accès. La maison sera réimplantée dans une vraie parcelle, les arbres cadrant les côtés.

Les quatre intérieurs réutilisent exactement le même rectangle 480 × 352, les mêmes trois emprises et des meubles dispersés. De nombreux réglages physiques sont codés directement dans Game.ts. Le système de dialogue, de quêtes et de sauvegarde n'a pas besoin de changer ; les dimensions et plans doivent être centralisés dans un module spatial.

## Village retenu

Extension contrôlée à 1920 × 1408 : centre historique au nord-ouest, quartier résidentiel à l'est, artisans au sud-est, quartier calme au sud-ouest. Les bâtiments publics, entrées, PNJ, sapin et points de quête conservent leurs coordonnées. Le trajet historique y608/x208 reste libre. Aucun décalage des anciennes coordonnées de sauvegarde.

Objectif de composition : seize habitations décoratives, avec seize silhouettes (huit ressources existantes à recalibrer et huit nouvelles). Parcelles de 220–280 pixels, circulations de 28–40 pixels, jardins particuliers ; aucune maison n'est un nouveau portail. Le sapin reste le repère du centre historique.

Les nouvelles voies prolongent les pavés de l'atelier vers une petite jonction (1120,580), puis une rue résidentielle (1400,580) → (1760,580). Une boucle artisanale descend vers (1760,920), rejoint (1120,920) et le chemin sud du centre en (512,920). Des sentiers courts rejoignent chaque porte. Les textures de neige validées restent inchangées ; l'extension réutilise ces textures et les matériaux existants. Les décors de l'ancienne bordure sont ouverts là où passent les nouvelles rues, sans supprimer toute la végétation.

## Quatre plans distincts

- Maison : salon historique relié à un volume en L à droite, coin repas, foyer et alcôve de lecture. Dimension cible 864 × 560.
- Bibliothèque : grande salle transversale, rayonnages regroupés et alcôve de lecture au sud-est. Dimension cible 960 × 560.
- Atelier : fabrication à l'ouest, couloir large vers un volume de rangement/emballage à l'est. Dimension cible 896 × 512.
- Auberge : grande salle conviviale, comptoir, deux salons latéraux au sud et sortie centrale dégagée. Dimension cible 960 × 544.

Le vestibule et la sortie historiques (240,315) restent fonctionnels pour limiter les changements de sauvegarde. Les murs intérieurs entre volumes sont réellement ouverts ; les limites extérieures suivent les plans. Les dix-sept identifiants décoratifs sont conservés et leurs approches restent praticables. Les grandes pièces seront meublées par groupes cohérents, à plusieurs profondeurs, plutôt que remplies d'objets aléatoires.

## Ordre et garde-fous

A audit → B plan → C façades et échelles → D jardins/chemins/vie extérieure → E architecture intérieure → F mobilier → G interactions → H polissage → I validation. Commits intermédiaires. Les personnages, portraits, HUD, dialogues existants, atlas du sapin, neige, règles de progression, calendrier et mini-jeux sont protégés. Les anciens emplacements devenus occupés seront replacés en zone sûre par le mécanisme existant, en conservant tous les autres champs sauvegardés.

Les contrats de tests purement géométriques D.3.1/D.3.2 devenus obsolètes seront remplacés par des contrôles des nouveaux plans ; les parcours fonctionnels du calendrier et des mini-jeux doivent continuer à fonctionner. Lint, TypeScript, unités, builds et navigateur PC/mobile seront exécutés et leurs résultats réels rapportés. Aucune fusion, aucun déploiement, aucune D.4.


## Ajustement du plan après inspection graphique

Le plan initial de travail ci-dessus a été affiné en conservant la même extension et les mêmes quartiers. Les voies principales passent désormais autour de y400, y750, y1100 et y1360, avec des inflexions, des coins courts arrondis et des parcelles décalées. Les positions finales font foi dans `src/art/urban-plan.ts`, le plan SVG actualisé et le tableau du rapport. La maison à baie vitrée est implantée en (1230,610). Les arbres ajoutés encadrent les parcelles plutôt que les portes ; les bosquets de lisière ne remplacent pas les textures de terrain validées.
