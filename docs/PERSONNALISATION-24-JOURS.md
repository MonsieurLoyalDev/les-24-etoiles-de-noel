# Personnaliser les 24 surprises

En développement local : `npm ci`, `npm run dev`, entrer dans le village, ouvrir « ✦ Avent 2026 », puis « Mode développeur : tester les 24 journées ». Le calendrier daté de novembre est normalement verrouillé. Ce mode est **fictif et non sécurisé**, avec progression distincte. Dans un build de production de démonstration, les outils développeur sont retirés.

Pour vos véritables souvenirs, configurer d'abord le [backend privé](CONFIGURATION-SUPABASE.md). Le compte administrateur dispose alors de l'éditeur et de l'aperçu séparé. Le joueur n'a aucun accès à ces fonctions, même par appel RPC direct.

## Éditeur

Choisir une journée dans Administration. Modifier titre, introduction, récompense, objectifs, textes et réponse attendue des énigmes. Importer images/vidéos avec le champ média privé, puis **enregistrer la surprise**. L'import seul ne change pas la définition. Le chemin doit commencer par le numéro du jour, par exemple `10/identifiant.webm`. Formats acceptés : PNG/JPEG/WebP, MP4/WebM, taille maximale 50 Mio. Les médias et leurs noms ne doivent contenir aucune information à révéler avant le jour ouvert dans une ressource publique.

« Configuration complète » permet de modifier les cartes, choix, branches d'histoire, transcriptions, suites et règles sans modifier le code. Import/export JSON servent aux sauvegardes personnelles ; **ne jamais committer un export réel ou le placer dans `public/`**. Le bouton Appliquer permet de vérifier le JSON avant d'enregistrer. Les versions empêchent d'écraser silencieusement une modification concurrente.

Structure :

```json
{
  "content": {
    "day": 8, "version": 1, "title": "Notre coffre",
    "intro": "Un indice à personnaliser", "room": "workshop",
    "reward": "Une étoile et notre souvenir",
    "steps": [{"id":"code","kind":"input","prompt":"Quel est le code ?"}]
  },
  "rules": {"code":{"expected":"2412"}}
}
```

`content` est livré uniquement après ouverture autorisée. `rules` reste privé, y compris après ouverture pour le joueur. Ne jamais mettre une réponse secrète dans `content.steps` ; les champs `answer`, `expected` et `rules` y sont refusés. Un indice ou la mélodie à reproduire peuvent naturellement faire partie de l'activité ouverte. Les identifiants d'étape sont uniques, composés de lettres minuscules/chiffres/tirets/underscore (40 caractères max).

Types génériques : `read`, `choice`, `input`, `write`, `collect`, `sequence`, `melody`, `photo`, `memory`, `wrap`, `media`, `hunt`, `decorate`, `story`, `voucher`, `connect`, `scene`. Pièces : `village`, `house`, `library`, `workshop`, `inn`. Pas de logique individuelle des 24 dates dans le moteur.

| Jour | Activité et réussite | Personnalisation principale |
|---|---|---|
| 1 | Ouvrir tous les fragments puis répondre | `items`, `options` |
| 2 | Écouter et reproduire les quatre notes | `text` liste do/mi/sol, `rules.expected` |
| 3 | Remettre les neuf fragments photo en ordre | `mediaPath` image privée facultative |
| 4 | Découvrir les cartes puis les ordonner | `items`, suite attendue |
| 5 | Retrouver Loyal à trois endroits réels de la place | Cartes des cachettes, `style:loyal` |
| 6 | Ouvrir six raisons puis choisir une attention | Textes et choix |
| 7 | Emballer correctement trois commandes | Réutilise le mini-jeu Phase B |
| 8 | Résoudre le code du coffre | Indices, réponse privée |
| 9 | Faire fleurir six compliments | Cartes, `style:garden` |
| 10 | Regarder le film ou sa transcription, répondre | Vidéo, transcription, mot final privé |
| 11 | Composer trois préférences romantiques | Options libres, aucune mauvaise réponse |
| 12 | Créer un bon daté avec destinataire et expérience | Options et récompense ; souvenir téléchargeable |
| 13 | Recueillir trois bonheurs dans le RPG | Cartes, `style:collect` |
| 14 | Accrocher six ornements | Cartes, `style:tree` |
| 15 | Parcourir une histoire jusqu'à `end` | Graphe `story`, départ `start`, choix vers `next` |
| 16 | Résoudre une énigme | Introduction et réponse privée |
| 17 | Écrire pour votre futur, au moins 40 caractères | `minLength`, objectif |
| 18 | Réunir quatre paires | Réutilise la mémoire Phase B |
| 19 | Répondre au quiz de couple | Options et identifiants des réponses privées |
| 20 | Relier six rêves puis écrire un souhait | Étoiles, ordre, minimum de caractères |
| 21 | Collecter les ingrédients puis ordonner la recette | Cartes et étapes ordonnées |
| 22 | Découvrir chacun des 24 compliments | Les 24 cartes distinctes |
| 23 | Lire les fragments puis écrire une promesse | Lettre et minimum de caractères |
| 24 | Avancer les quatre répliques de la scène RPG | `scene.text` : message final personnalisé |

Chaque journée gagne une étoile unique, quel que soit le nombre de rejeux. Le nom de récompense est du texte personnalisable ; il ne déclenche pas un achat, un envoi ni un média public. Les anciennes étoiles de démonstration Phase B sont présentées séparément et ne déverrouillent pas l'Avent.

## Reprise et mises à jour

La progression validée est sauvegardée après chaque étape : côté serveur en mode privé, IndexedDB en démonstration. Les textes en cours, cartes et plateaux des mini-jeux sont repris sur le même navigateur. Un rejeu crée une nouvelle manche et conserve l'étoile et le dernier souvenir terminé. Une édition change la version : une manche inachevée peut recommencer, les récompenses et souvenirs gagnés restent conservés. Les identifiants A/B et leurs sauvegardes ne sont pas supprimés.

Le 24 : retour effectif à la Place des Lanternes, illumination cérémonielle de 24 lumières, répliques de Debby et Loyal humains, animation du sapin et révélation du message. Le journal propose de revoir la scène. La cérémonie n'attribue pas les récompenses des journées précédentes non terminées : après la scène, le sapin reflète les étoiles réellement gagnées.
