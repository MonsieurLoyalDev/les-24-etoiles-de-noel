# Recette narrative E.1

Cette fondation narrative est distincte de la livraison privée E.1 antérieure. Ne pas remplacer `RAPPORT-E1.md` ni les rapports E.0.

## Développement local

1. Installer avec `npm ci`, puis lancer `npm run dev`.
2. Entrer dans le village et fermer l'accueil historique.
3. Ouvrir « Avent 2026 », puis « Aventure narrative ».
4. Importer le cahier JSON compilé conservé **hors du dépôt**, puis commencer l'épisode disponible.
5. Suivre l'objectif dans le monde : clavier/joystick, E/bouton d'interaction, choix tactiles. Le bouton Courir et Maj sont réservés à l'aventure active.

L'atelier local est un aperçu de développement, sans authentification ni protection des dates. Son contenu est stocké sur cet appareil. Il n'est pas inclus dans un build privé et ne constitue pas une livraison de production.

Le PDF reçu, son extraction, le cahier compilé et les captures narratives sont conservés dans le dossier `work/narrative-private` du workspace **parent**, jamais dans ce dépôt public. Ne pas les copier dans `public`, les tests, les seeds ou les rapports versionnés.

## Recette privée

Le module réutilise Auth, les membres et l'horloge serveur Europe/Paris existants. La migration `supabase/migrations/202611160001_narrative.sql` vient après `202611030001_advent.sql`. Elle n'a pas été appliquée à une infrastructure réelle pendant cette intervention.

Après installation sur une instance de recette autorisée, un administrateur peut importer le JSON avec l'interface. Les versions publiées sont immuables : changer le contenu exige un nouveau numéro. Une partie existante conserve sa version. L'aperçu administrateur et la relecture ont des sessions distinctes de la partie réelle. Un joueur ne peut ni importer un scénario ni activer l'aperçu.

RPC ajoutées : `episode_admin_put`, `episode_status`, `episode_load`, `episode_save`. Le statut ne révèle pas les titres futurs ; le contenu est envoyé seulement après autorisation serveur. Les checkpoints locaux contiennent des faits et des curseurs, sans répliques. Auth, serveur et stockage privé restent indispensables ; ne pas exposer de clé serveur avec une variable Vite.

La progression narrative utilise sa propre table et ses propres clés IndexedDB. Elle ne supprime pas les quêtes, étoiles fictives ou sauvegardes historiques. Les écritures concurrentes échouent explicitement au lieu d'écraser silencieusement une autre session.

## Vérifications reproductibles

```text
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run build:private
npx playwright test --config playwright.author.config.ts
npx playwright test tests/private-e2e/narrative.spec.ts --config playwright.private.config.ts
```

Le parcours auteur utilise par défaut une fixture technique publique, sans texte du PDF. Pour tester le véritable cahier privé, définir `ETB_EPISODE_SOURCE` sur son chemin local absolu. Définir éventuellement `ETB_NARRATIVE_CAPTURE_DIR` sur un dossier **hors dépôt** pour les captures. Ces deux variables appartiennent au processus de test et ne doivent pas être préfixées `VITE_`.

Les tests du build privé nécessitent les trois valeurs publiques fictives documentées dans le rapport de livraison privée, puis une compilation privée configurée. Les appels réseau sont interceptés ; le nouveau parcours exécute les migrations réelles dans PGlite. Il ne valide pas Supabase hébergé, le VPS ou Safari iOS.

## Suite

Les 24 identifiants et quatre constellations sont enregistrés, mais seuls les contenus privés explicitement intégrés sont lançables. Les Jours 2 à 24 restent à intégrer après validation du premier parcours. Le réducteur est générique ; les nouvelles capacités de mise en scène nécessiteront des adaptateurs ciblés. Ne pas confondre les 24 démonstrations de Phase C avec ces futurs épisodes narratifs.
