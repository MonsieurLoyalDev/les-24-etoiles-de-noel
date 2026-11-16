# E.2.1 — Finitions du Jour 1

## Audit avant modification

Base `feature/phase-e2-jour-01`, commit `55e133337d48d79286be8e7867790695b16aa72a`, arbre propre. Branche dédiée `feature/phase-e2-1-polish`. Rapports E.1/E.2, acteurs, effets, dialogues, audio et tests de préservation examinés avant les changements.

Le parcours privé des sept scènes est exécuté avant modification : **2/2 réussis**, Chromium PC et mobile émulé, 3,5 minutes. Captures personnelles conservées dans `work/narrative-private/e21-before`, hors dépôt. Elles utilisent le vrai build privé et le cahier du PDF chargé hors Git ; backend de recette strict, pas Supabase réel.

Constats : village, neige, façades, quatre intérieurs, portraits et contrôles restent utilisables et sont conservés. Les moments tendres E.2 sont de simples orientations des sprites. L'atlas Loyal V9 existant contient une queue décorative : il n'est pas redessiné dans cette livraison, mais les nouveaux gestes de couple doivent représenter deux humains sans attribut animal. Les anciens atlas `mains`/`calin` restent exclus du Jour 1. Flocon dispose déjà de marche dans quatre directions et d'attentes expressives ; les poses assise et sommeil manquent. Le retour de l'étoile est rectiligne ; la caméra revient brusquement à son zoom d'exploration. L'interface mobile est lisible, mais le suivi des objectifs doit aussi se masquer pendant les moments animés.

## Périmètre

Améliorations de présentation uniquement : frames humaines de couple, expressions et repos de Flocon, trajectoires et transitions des effets, présentation des dialogues, points audio silencieux avec fondus préparés. Aucun texte narratif personnel, objectif, format de sauvegarde, droit calendrier, preuve serveur, collision, carte, mobilier ou texture de neige générale n'est modifié. Pas d'E.3, fusion ou déploiement.

## Résultats et limites

Une génération d'image n'est pas une validation artistique. La première proposition assise/lunettes contenait un fond semi-transparent : elle a été refusée et corrigée avant intégration.

## Modifications réalisées

- Trois planches RGBA réutilisables, 24 frames distinctes, **1 927 086 octets** au total. Documentation des références, prompts et préparation dans `E2-1-ASSETS.md`. Les atlas validés ne sont pas remplacés. Les nouvelles poses du couple sont humaines, avec lunettes rondes, sans queue ni oreilles animales.
- Mains jointes et vraie étreinte : quatre frames dessinées par geste, lecture aller-retour 3,2 secondes. Retour aux sprites habituels après le geste ; mouvement, dialogue, menu, scène prioritaire et changement de pièce nettoient l'affichage. Les corps physiques ne bougent pas artificiellement et aucune récompense n'est émise.
- Pose assise dessinée sur un vrai banc existant, choisi près de la maison de Loyal ; quatre frames. Pas de meuble créé, déplacé ou ajouté. Les étiquettes des acteurs momentanément masqués sont elles aussi cachées, pour éviter qu'elles flottent au-dessus d'une ancienne position. Aucun nom ou style d'étiquette n'est changé.
- Ajustement des lunettes : quatre frames dessinées. En réduction des mouvements, les gestes deviennent une pose fixe de 0,5 seconde, sans va-et-vient.
- Flocon : quatre frames de sommeil en boule et quatre poses assises/attentives/joyeuses ; étoile frontale conservée. Repos après immobilité au coussin du chalet, attentes discrètes hors enquête et dialogues, réaction orchestrée pendant la magie. Les marches directionnelles et les vitesses/collisions validées restent en place.
- Retour et dispersion des étoiles en courbes cubiques plutôt qu'en lignes droites. Budget inchangé : au plus 24 étoiles en vol et les scintillements temporaires existants. Pas de halo permanent, texture ou particule générée par frame. Retour caméra lancé une seule fois et zoom adouci ; réduction des mouvements conserve la présentation sobre.
- Fenêtre de dialogue : entrée courte, texte mieux réparti, boutons tactiles de 44 pixels minimum, focus clavier visible et défilement maîtrisé. Le suivi des objectifs est masqué pendant les gestes et les dialogues. Styles limités à la session narrative ; les textes originaux et portraits restent inchangés.
- Suivi narratif compact : les moments facultatifs sont dans « Moments à partager », les actions de poursuite restent visibles. Après complétion, une courte indication remplace le panneau détaillé ; Livre, épisodes et course restent accessibles. La note technique de validation artistique est retirée de l'interface du jeu et conservée dans ce rapport. Cela corrige un masque trop important des personnages au chalet sur téléphone.
- Service audio existant étendu avec fondus, respect volume/muet, refus des URL externes et attente d'un geste utilisateur. Les sept points de scène restent **silencieux**, aucun fichier licencié n'étant fourni. Aucun téléchargement ou piste inventée.

## Préservation et limites artistiques

Les empreintes D35, E.1 et E.2 restent inchangées. `PRESERVATION-E2-1.json` ajoute uniquement trois adaptations autorisées de sources protégées : transport audio, masquage des étiquettes pendant les gestes et refus des anciennes superpositions de couple durant une session narrative. Ce dernier garde couvre aussi les déclencheurs ambiants historiques, notamment l'entrée de l'auberge, sans toucher à la progression. Carte, neige générale, bâtiments, intérieurs, sprites existants, dialogues personnels, modèle de sauvegarde, migrations SQL et règles du calendrier restent inchangés.

L'assise dispose d'une vraie pose, mais pas de frames intermédiaires dédiées pour s'asseoir/se relever. Le rapprochement est dessiné dans les poses de couple ; il ne s'agit pas d'une nouvelle animation locomotrice de prise de position. Les nouvelles images ont des détails propres : leur fidélité artistique doit être approuvée dans la galerie. Les réactions corporelles de surprise de Debby/Loyal réutilisent leurs orientations existantes ; aucune nouvelle planche de sursaut ou d'hésitation n'est annoncée. Pas de nouvelle marche/course de Flocon, ni de respiration dessinée supplémentaire au-delà de ses poses et attentes. Pas de nouvelle musique ou doublage.

La première recette de présentation a montré un banc traversé par le cadrage d'un passant et des étiquettes de corps masqués. Le banc de repos sélectionné et le masquage des étiquettes ont été corrigés avant la recette finale. Ces contrôles visuels ne sont pas remplacés par les seuls tests automatisés.

## Vérifications techniques

`npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, `npm run build:private` exécutés. **242 tests unitaires réussis, 0 échoué, 2 cas POSIX ignorés sous Windows**, 31 fichiers, dernier lot 5,33 secondes. Les tests ajoutés couvrent frames/transparence, ressources obligatoires du build privé, trajectoires, durée et interruption des gestes, assise sans banc refusée, son absent/externe et absence de geste utilisateur, volume, fondu, muet et absence de duplication.

Build privé final : **228 ressources contrôlées**, octets identiques ; démonstrations, atelier d'auteur et fixtures exclus du bundle. Module applicatif 805,25 ko (233,02 ko gzip), CSS 29,18 ko (7,33 ko gzip), Phaser inchangé 1 208,06 ko (332,17 ko gzip). Les trois nouvelles textures RGBA représentent environ **6 Mio décodés**, 1,93 Mo sur disque. Aucun nouvel objet graphique récurrent par frame ; une superposition au maximum pendant un geste, aucun objet supplémentaire pour les poses de Flocon.

Avertissements préexistants conservés : attributs d'import JSON, chunks dépassant 500 ko et chemins CSS copiés après la compilation privée. Le contrôle final des fichiers et des réponses HTTP/MIME est conservé. Le plugin de copie privée suppose toujours le répertoire `dist` : un essai avec un autre `outDir` a nécessité la copie explicite des seules ressources autorisées avant son contrôle. Le chemin normal `npm run build:private` fonctionne ; aucune configuration de production n'est modifiée pour cet essai isolé.

Recettes déjà terminées : **18/18** tests privés E.1/E.2 PC/mobile (7,3 minutes), dont MIME/octets de toutes les ressources, véritables poses D.4.2, fauteuil, interruption/reprise, courrier d'Émile, lanternes d'Augustin, rôles, calendrier et refus d'accès futurs. **8/8** parcours historiques B/C/compatibilité sont vérifiés : le lot initial donne 7 réussis et un échec du test des 24 journées après un rechargement de développement pendant une correction ; ce cas est rejoué sur des sources figées et passe en 2,8 minutes. Cela couvre les 24 activités de démonstration, les trois mini-jeux, le final et les anciennes positions sauvegardées.

Un essai de recette isolée sur le port 5193 est initialement refusé par la fixture qui autorise seulement 5191. La fixture autorise désormais **exactement** l'origine locale choisie parmi ces deux ports ; elle n'accepte ni origine externe ni joker. Cet essai refusé n'est pas compté comme un succès. La recette standard finale reste sur 5191.

Les résultats du parcours final avec le panneau compact et les liens de livraison sont consignés ci-dessous. Les validations serveur utilisent PGlite et des fixtures Auth/CAPTCHA/Storage : **Supabase réel, VPS, HTTPS de production, Safari iOS et téléphone physique non testés**. Aucun déploiement, donnée réelle ou branche principale n'est touché.

## Fichiers modifiés et ajoutés

- `docs/phase-e/E2-1-ASSETS.md`
- `docs/phase-e/PRESERVATION-E2-1.json`
- `docs/phase-e/RAPPORT-E2-1.md`
- `ops/lib/private-assets.mjs`
- `ops/public-assets.json`
- `public/assets/narrative-polish/fox.png`
- `public/assets/narrative-polish/human.png`
- `public/assets/narrative-polish/seats.png`
- `scripts/prepare-polish-assets.py`
- `src/art/audio.ts`
- `src/art/reactions.ts`
- `src/art/tags.ts`
- `src/game/Game.ts`
- `src/narrative/Director.ts`
- `src/narrative/Hub.tsx`
- `src/narrative/polish-assets.json`
- `src/narrative/polish.css`
- `src/narrative/polish.ts`
- `src/narrative/sound.ts`
- `src/narrative/star-flight.ts`
- `tests/environment-d35.test.ts`
- `tests/narrative-audio.test.ts`
- `tests/narrative-e2e/author.spec.ts`
- `tests/narrative-polish.test.ts`
- `tests/private-e2e/fixtures.ts`
- `tests/private-release.test.mjs`

## Recette finale et livraison

Le dernier parcours complet du build privé avec le cahier original passe **2/2 en 3,9 minutes**, PC et mobile émulé. Les poses assise, mains jointes, câlin et lunettes sont exercées, le déplacement interrompt un geste, le mobile utilise aussi une pose réduite. Les sept scènes, les trois rencontres dans des ordres différents, les choix, aides 30/60/90 et pauses, rechargements, disparition sans répétition, première étoile unique, Livre, reprise et relecture isolée restent vérifiés. Un déplacement réel jusqu'au foyer permet d'observer Flocon sur son coussin ; aucune position n'est forcée pour la capture.

Bilan des cas navigateur distincts : **28 réussis, 0 échec restant** (18 privés, 8 historiques après reprise du cas interrompu, 2 parcours complets). Le smoke privé de reprise est aussi rejoué 2/2 après le panneau compact, sans être additionné une seconde fois. Les essais intermédiaires refusés/interrompus sont décrits plus haut ; ils ne sont pas présentés comme réussis. La CI distante est configurée par les tests existants mais son résultat n'est pas encore annoncé.

Mesure finale au chalet, après déplacement au foyer, 120 échantillons requestAnimationFrame : PC moyenne **16,63 ms**, p95 **16,8 ms** ; mobile émulé moyenne **16,64 ms**, p95 **16,8 ms**. Chromium avec rendu Canvas logiciel, ressources déjà chargées, pièce intérieure : ce n'est ni un test de téléphone physique, ni un profil mémoire complet, ni une mesure générale de tout le village. Les différentes scènes ne doivent pas être comparées comme des benchmarks matériels équivalents.

Galerie privée : `work/narrative-private/validation-e21/index.html` dans le workspace parent, hors dépôt. **23 sections, 38 images affichées, dont 8 séquences animées WebP issues du jeu**. Les WebP statiques sont sans perte, dimensions et pixels RGBA vérifiés identiques aux PNG. Contrôle navigateur hors ligne exécuté : 38 images chargées, 0 image manquante, aucune requête externe. Les cadrages sont proches, mais les routines et l'heure visuelle peuvent varier ; les effets environnementaux existants ne sont pas présentés comme une refonte.

Archive `E21-VALIDATION.zip` : **16 291 305 octets**, SHA-256 `6ffcf5da742e18652ce5e1a90f827eb456d5c7ee3a57571e090b403a39ed9e68`. Les textes et captures personnelles restent hors GitHub. Contrôle de confidentialité : 32 longues chaînes privées recherchées dans les changements publics et le JavaScript privé généré, aucune occurrence.

Limites supplémentaires : l'assise est intégrée sur un banc extérieur, pas sur tous les fauteuils/canapés. Les compagnons restent non bloquants et peuvent se croiser ; un cadrage dégagé du coussin est nécessaire pour voir le sommeil sans masquer Flocon avec Loyal. Les nouvelles poses doivent encore recevoir votre validation artistique. Pas d'affirmation de musique achevée, de nouveau jeu de marche/course, de pleine animation debout/assis ou de tests sur infrastructure réelle.

Aucune fusion, publication de contenu personnel, modification de production ou intervention VPS. E.3 n'est pas commencée. La branche de livraison est `feature/phase-e2-1-polish`.

Commit fonctionnel final : b2c1b48bc6e4aff10f5cf81905e45de4bbb6a24b. Le présent rapport est ajouté ensuite sur la même branche. Référence distante : https://github.com/MonsieurLoyalDev/les-24-etoiles-de-noel/tree/feature/phase-e2-1-polish .
