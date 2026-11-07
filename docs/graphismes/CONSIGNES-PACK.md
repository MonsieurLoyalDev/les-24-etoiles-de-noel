# CODEX — LES 24 ÉTOILES DE NOËL — PHASE D (D1 à D9)

## Mission
Reprendre impérativement le projet existant de PHASE C. Le ZIP ci-joint est un pack d'ASSETS graphiques et une référence de code Phase C, pas une invitation à reconstruire le jeu. La Phase D est exclusivement graphique : rendre Étoilebois beau, cohérent, chaleureux, vivant et explorable. Pas de nouvelles quêtes, missions, mini-jeux, économie, combat, XP ou barres de vie. Conserver sauvegardes, fonctionnalités et logique du calendrier déjà existantes.

## Préalable obligatoire
1. Inspecter le projet Phase C fourni séparément par l'utilisateur (et la copie de référence dans 09_BASE_CODE_REFERENCE, si utile). Ne pas écraser son travail récent.
2. Lire MANIFESTE_ASSETS.json et inventorier les images disponibles. Les répertoires 01 à 08 contiennent les ressources sélectionnées lors de nos validations.
3. Intégrer les images de production, pas les prévisualisations. Les prévisualisations et GIF de démonstration ont été volontairement retirés pour réduire la taille du pack. Les sprites et atlas sont conservés lorsqu'ils existent.
4. Respecter les dimensions, transparences, directions et animations existantes; ne pas inventer d'assets manquants ni remplacer les personnages par de nouveaux designs.
5. En cas de doublons ou d'incertitude sur une version, expliquer l'arbitrage et demander validation.

## D1 — Village définitif
Intégrer sols, neige, terre, pavés, raccords, autotiles, végétation et bâtiments retenus. Construire une place centrale agréable autour du grand sapin. Disposer mairie, boulangerie, poste, bibliothèque, atelier et accès à la forêt selon les bâtiments réellement disponibles. Harmoniser échelles, chemins, raccords, collisions et profondeur.

## D2 — Décorations
Utiliser les ressources de lanternes, végétation, mobilier et ornements existants. Rendre le village riche mais lisible, sans répétition mécanique des textures ni chemins bloqués.

## D3 — Ambiance visuelle
Neige légère animée, fumée de cheminée, éclairages doux et variations jour/soir/nuit si compatibles. Effets sobres et performants; aucun halo excessif, particulièrement autour de Flocon.

## D4 — Personnages et animations
Loyal (homme brun à lunettes rondes), Debby (femme brune à lunettes rondes), Augustin, Madeleine, Émile, Célestine, Basile, Flocon (petit renard orange et blanc, étoile blanche au front, écharpe verte). Réutiliser sprites de marche/idle et animations de couple/Debby. Vérifier ordre des couches, alignement des pieds, transparence, collisions et animations. Ne pas changer leurs identités visuelles.

## D5 — HUD et dialogues
Intégrer le HUD validé: titre Étoilebois, date et compteur d'étoiles, boutons calendrier/souvenirs/paramètres. Fenêtre de dialogue avec portrait correspondant à l'interlocuteur et à son émotion, nom, texte, 0 à 4 choix, ou bouton Continuer. Masquer le panneau pendant la promenade. Police Marcellus pour titres/noms et Nunito pour textes/boutons; charger depuis une source autorisée ou le projet existant. Texte dynamique, jamais gravé dans les textures. Utiliser les 8 portraits Loyal/Debby et 24 portraits PNJ; contrôler visuellement les fonds transparents et signaler tout défaut au lieu de masquer les défauts par des fonds artificiels.

## D6 — Sapin et calendrier
Intégrer sapin V11.4 et calendrier V12.0, exactement 24 étoiles. Conserver les règles de déverrouillage de Phase C. Soigner animations et transitions, sans ajouter de gameplay.

## D7 — Transitions
Transitions courtes et propres pour bâtiments, zones, dialogues, menus, ouverture du calendrier. Pas de changements de gameplay.

## D8 — Audio d'ambiance (sans nouveaux assets non autorisés)
Si des sons autorisés existent déjà, intégrer pas, vent, cheminée, clics, étoiles. Sinon préparer des points d'insertion et indiquer les sons manquants. Contrôle volume/muet si compatible. Ne pas générer de musique ni intégrer de ressources à licence incertaine.

## D9 — Finitions et vérifications
Tests desktop/mobile, caméra, mise à l'échelle pixel art sans flou, transparences, performances, collisions, couches, dialogue, menus, calendrier, sauvegarde. Corriger régressions.

## Méthode et livrables
Procéder D1→D9 en étapes traçables. Livrer projet modifié, inventaire précis des assets intégrés et non utilisés, captures d'écran, résultats de build/tests, bugs connus et bilan par sous-phase. Demander validation pour tout changement artistique majeur. Ne jamais repartir de zéro. La Phase E (activités, histoires, missions) viendra après.
