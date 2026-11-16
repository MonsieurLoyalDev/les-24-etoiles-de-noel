# Ressources complémentaires du lot A

Les ressources validées du village, des quatre intérieurs, des huit personnages initiaux et de la neige ne sont pas remplacées. Les deux régions supplémentaires réutilisent les textures et meubles existants ; leur composition est une adaptation minimale du cahier, pas une nouvelle refonte du village.

`public/assets/production/` contient un atlas de personnage générique (20 cellules 256×256, quatre poses de repos actuellement utilisées) et six petits PNG : arbre, four, enveloppes neutre/bleue, livre sans texte et pierre sans inscription. Total initial : 2 068 518 octets. Les textes et symboles de quête sont des données privées reçues à l'exécution, pas des inscriptions cachées dans les PNG.

Création avec l'outil intégré ImageGen, puis découpe/assemblage technique nearest-neighbour par `scripts/prepare-production-assets.py`. Aucun dessin existant du jeu retouché. Les originaux restent hors dépôt. L'alpha généré dans les cellules est conservé ; les pixels presque transparents ne sont pas recolorés. Les limites de cadrage sont mesurées sur l'alpha visible, puis une marge transparente est ajoutée aux objets.

Prompts de production utilisés :

- Atlas : lapine adulte anthro, tenue de pâtissière hivernale, bonnet crème, tablier lin, écharpe bordeaux ; vue de face, profils et dos, marche et repos sur une grille 4×5 ; même échelle et direction artistique que les personnages existants, fond transparent, aucune inscription.
- Objets : six objets isolés sur grille 3×2 ; vieux chêne hivernal à petite porte fermée, four artisanal bois/cuivre, enveloppes bleue et crème scellées, livre ancien sans titre, pierre enneigée sans inscription ; contours nets, transparence et aucune révélation narrative dessinée.
- Contrôle de fond : préserver objets/poses, enlever seulement l'arrière-plan et les résidus de fond, sortie RGBA transparente. Les deux sorties retenues ont été inspectées et leurs canaux alpha contrôlés avant assemblage.

Ces nouveaux éléments restent soumis à validation artistique. Les gestes spécialisés non dessinés ne sont pas présentés comme des animations complètes ; le personnage supplémentaire utilise ici des poses de repos, pas un nouveau système de routines.
