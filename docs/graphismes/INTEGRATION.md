# Intégration et vérification de la refonte

Le projet actuel reste la source de vérité. Le code de référence du ZIP (97 fichiers) n'a pas été recopié sur le projet. Ni les migrations de schéma, ni le format des sauvegardes, ni les preuves de réussite des activités ne sont remplacés.

## Répartition des ressources

| Groupe | Utilisation |
|---|---|
| Terrains | Neige/pavés/terre V7 en coordonnées spatiales continues ; autotiles V6 uniquement sur les bords extérieurs des routes |
| Façades | Quatre découpes V10 ; collisions, entrées et destinations du jeu conservées |
| Décors | Lanternes, banc, panneaux, stand de cadeaux, jardinière, clôture, brasero et bonhomme de neige V11 ; pins V1 fournis |
| Personnages | Debby V3, Loyal V19.1 + V9, Augustin V4 + idle V5, Madeleine V7, Émile/Célestine/Basile V1, Flocon V4 |
| Réactions | Quatre animations de couple et huit de Debby, purement cosmétiques, sans effet sur les quêtes |
| HUD | V3 narratif et boutons séparés pour le nombre réel de choix ; variante à quatre choix pré-dessinés inutilisée |
| Portraits | 32 images originales, quatre émotions par personnage ; les portraits d'Émile et Flocon sont prêts dans le catalogue mais ne créent pas de nouveau dialogue |
| Sapin/calendrier | V11.4 (25 états 0–24), fond V12.0 et ses 24 positions ; aucune logique de déverrouillage du HTML autonome importée |
| Réserve | Loyal V18.1, variantes de HUD et décors non placés restent identifiés comme non chargés ; aucune prévisualisation utilisée comme sprite |

`INVENTAIRE.json` détaille chaque fichier du pack, sa provenance, ses dimensions, sa taille, son SHA256, sa destination et son usage/non-usage. 108 PNG de production sont copiés sans retouche ; les métadonnées de 24 atlas sont intégrées au code pour ne pas exposer des fichiers JSON arbitraires dans le paquet privé. Trois fichiers de police supplémentaires proviennent de Google Fonts officiel ; leurs empreintes sont dans `POLICES.json` et leurs licences SIL OFL sont jointes.

## Exécution locale

```sh
npm ci
npm run dev
```

Le mode développeur de démonstration permet de rejouer les 24 journées fictives. Le build normal ne donne pas cet aperçu développeur. Le mode privé garde le contrôle serveur Supabase ; un projet réel reste nécessaire pour prouver Auth et stockage distants.

## Contrôles reproductibles

```sh
npm run lint
npm test
npm run build:private
npm run build
```

Pour les tests navigateur sans rechargement de développement, compiler la fixture de démonstration dédiée :

```powershell
npm run build:e2e
$env:ETB_E2E_BUILT='1'
npm run test:e2e
```

Sous Linux : `ETB_E2E_BUILT=1 npm run test:e2e`. La fixture `e2e` autorise uniquement l'aperçu des contenus fictifs du mode démonstration, comme `npm run dev`. Elle n'est pas le paquet privé de production. `npm run build:private` exclut toujours les modules de démonstration, quel que soit l'état du calendrier affiché.

Les tests vérifient aussi les empreintes des PNG copiés, les limites des frames d'atlas, les 24 positions, les 25 états du sapin, les identités des portraits et les réglages audio. Les diagnostics de navigation restent en lecture seule ; aucune étoile n'est injectée pour réussir les activités.

## Limites à conserver visibles dans le bilan

Les intérieurs sans ressources dédiées restent provisoires. Les découpes de façades, le composite du dialogue et certains contours contiennent des défauts signalés par les sources. Les portraits Loyal/Flocon diffèrent de leurs sprites sur les lunettes/l'étoile frontale. Aucun remplacement dessiné n'a été inventé. La performance sur téléphone physique et le backend Supabase réel nécessitent encore une vérification sur les appareils/services concernés ; une émulation navigateur ne les remplace pas.
