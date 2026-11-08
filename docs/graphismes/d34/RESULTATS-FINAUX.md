# D.3.4 — résultats finaux

Vérifications locales terminées le 8 novembre 2026. Aucune fusion ni aucun déploiement. La validation artistique reste à effectuer par l’utilisateur.

- TypeScript et lint : réussis.
- Tests unitaires : 157 réussis, 2 contrôles POSIX ignorés sous Windows.
- Builds privé, production et E2E : réussis. Le contrôle du build privé confirme l’absence de contenus fictifs de démonstration.
- Navigateur : 104 cas uniques recensés ; 92 réussis, 12 ignorés pour les captures documentaires uniques ou les formats spécifiques, aucun échec et aucun cas manquant. Voir TESTS-FINAUX.json.
- Trois lots disjoints : 20 scénarios PC réussis dans le projet, 42 réussis et 10 ignorés sur mobile émulé, puis 30 réussis et 2 ignorés sur PC depuis une extraction vierge du ZIP SOURCE-LIGHT.
- L’extraction vierge a également passé npm ci, TypeScript, lint, les tests unitaires et les trois builds. Ses 385 fichiers ont été vérifiés par SHA-256 ; ses fichiers src/public sont identiques au projet testé.
- Navigation : les 16 portes d’habitations, cinq ouvertures de clôtures et quatre bâtiments visitables sont parcourus avec les collisions réelles et les commandes clavier. Les interactions tactiles, sauvegardes, 24 journées et trois mini-jeux sont couverts.
- Les 221 fichiers publics sont conservés octet pour octet. Les 741 fichiers d’ARTWORK ont été restaurés et vérifiés individuellement.

Mesures Chrome local : RAF p95 de 5,50 ms sur PC et 4,40 ms en mobile émulé, sur 170 échantillons utiles. Ce ne sont pas des mesures sur téléphone physique. Le build conserve un avertissement de chunk Phaser supérieur à 500 ko ; le chargement sur réseau mobile réel reste à mesurer.

Les archives figées sont accompagnées du rapport LIVRAISON-D34.md et de SHA256SUMS-D34.txt dans le dossier de livraison. Ce compte rendu est rédigé après leur vérification ; les archives n’ont pas été modifiées pendant les tests. Les essais historiques interrompus ne sont pas comptés comme réussites. Les résultats GitHub Actions ne sont pas présentés comme validés ici.
