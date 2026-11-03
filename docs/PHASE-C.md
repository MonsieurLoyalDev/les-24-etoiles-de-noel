# Phase C — architecture et utilisation

Version 0.3.0. Le calendrier complète le RPG existant ; il ne remplace ni les pièces, ni les PNJ, ni les quêtes A/B.

## Parcours

Ouvrir le calendrier, choisir une journée autorisée, lire son introduction, puis « Suivre la quête ». Rejoindre la pièce indiquée et interagir avec la lueur « Jour N » avec E ou le bouton tactile. Les recherches des jours 5 et 13 demandent de véritables déplacements sur la place. Les autres activités s'ouvrent à proximité de leur point d'interaction. On peut fermer une activité, explorer ou reprendre plus tard.

Le calendrier montre 24 numéros, leurs verrous et leurs étoiles. Les anciens jours sont rejouables ; le journal conserve les dernières réponses terminées et permet d'en télécharger une copie. Les journées sont indépendantes après leur ouverture temporelle : pas d'obligation de finir la veille. Chaque réussite ajoute une lumière au grand sapin. Le final joue une cérémonie avec 24 lumières, mais n'attribue que l'étoile du jour 24.

En novembre 2026, utiliser explicitement l'aperçu développeur pour tester. En démonstration il n'existe que dans le serveur de développement Vite. En mode Supabase, le rôle administrateur est nécessaire, y compris pour les appels serveur. Les manches et récompenses d'aperçu sont séparées du calendrier réel. Une réouverture du jeu revient au calendrier daté ; réactiver explicitement l'aperçu pour reprendre ses tests.

## Modules

| Module | Responsabilité |
|---|---|
| `src/advent/model.ts` | Contrats des journées, étapes, preuves, versions et validation d'édition |
| `src/advent/demo.ts` | 24 contenus fictifs, jamais utilisés par le build privé |
| `src/advent/api.ts` | Contrat partagé démonstration/backend |
| `src/advent/demoApi.ts` | Simulation locale datée, éditeur fictif, espaces de progression séparés |
| `src/advent/supabase.ts` | Auth, RPC PostgreSQL, import privé, URL signées après autorisation |
| `src/advent/Hub.tsx` | Calendrier, choix de jour, suivi de quête, journal, connexion et éditeur |
| `src/advent/Task.tsx` | Interfaces interactives génériques, mélodie audio au clic, cartes, histoire, écritures, film |
| `src/ui/MiniGame.tsx` | Les mêmes moteurs photo/mémoire/emballage que Phase B, avec preuves et reprise C |
| `src/game/Game.ts` | Points d'interaction, cachettes, lueurs, illumination et séquence jouable finale |
| `supabase/migrations/202611030001_advent.sql` | Backend autoritaire, RLS, validation, versions, stockage privé |

La définition d'une journée contient plusieurs étapes ordonnées et une récompense ; elle ne contient pas sa logique métier spécifique. Le moteur choisit un composant par `kind`. Une réussite est validée par l'API ; la version serveur ne fait confiance ni au drapeau « terminé » du navigateur ni à sa date. Les anciennes sauvegardes restent au schéma 2 ; l'Avent utilise des clés supplémentaires et des tables distinctes. Aucun effacement automatique de la progression A/B n'est ajouté.

## Limites assumées

Graphismes et court film fictifs conservés. Les décorations sont des interactions simples, pas un éditeur graphique de placement libre. Le jeu de fabrication utilise les commandes d'emballage existantes. La cinématique est une séquence en moteur avec dialogues avancés par le joueur, pas une vidéo définitive. Le calendrier vérifie sa disponibilité au serveur à l'ouverture, toutes les cinq secondes lorsqu'il est affiché et lors de chaque requête de contenu/validation ; seule la décision PostgreSQL fait autorité.

Les tests mobiles sont une émulation Chrome 390 × 844. Pas de validation revendiquée sur Safari iOS, téléphone physique ou instance Supabase réelle non configurée. Le frontend et ses ressources artistiques provisoires sont publics lors d'un déploiement ; seules les surprises et médias du backend sont privés. Ne pas mettre de souvenirs dans les sources ou le répertoire public.
