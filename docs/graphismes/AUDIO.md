# Sons manquants et points d'insertion

Aucun fichier audio autorisé n'est présent dans le pack ou dans la base du jeu. D8 ne produit donc aucun son, aucune musique générée et aucun appel à une bibliothèque sonore externe.

`src/art/audio-slots.json` réserve cinq emplacements : `step` (pas), `wind` (vent), `fire` (cheminée), `click` (interface), `star` (étoile). Tous valent null. Le module `audio.ts` ignore ces emplacements silencieux. Les crochets sont reliés au déplacement réel, aux pièces, aux clics et à la progression du sapin. Les ambiances précédentes s'arrêtent à un changement de pièce. L'échec d'autoplay ne bloque jamais le jeu.

Le panneau Paramètres mémorise volume et muet dans une clé distincte de la sauvegarde RPG. Le son est muet par défaut. Aucun réglage ne modifie les quêtes ou les souvenirs.

Pour activer ultérieurement : fournir les cinq fichiers et leur autorisation/licence, les placer sous `public/assets/audio`, renseigner les URL locales dans le JSON, ajouter explicitement ces fichiers au manifeste public et au validateur de paquet VPS (extensions audio non autorisées actuellement), puis vérifier chargement, autoplay après geste utilisateur et volume sur téléphone. Ne pas activer un emplacement avec une URL tierce ni supposer que la préparation prouve la présence de sons.
