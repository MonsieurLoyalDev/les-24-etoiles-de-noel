# Validation Phase C — version 0.3.0

## Résultats locaux

Windows, Node.js 24.14.0, Chrome headless. Les écrans mobiles utilisent une émulation 390 × 844, les écrans PC 1280 × 800.

| Vérification | Résultat |
|---|---|
| ESLint | Réussi, aucune erreur |
| TypeScript strict | Réussi via les deux builds |
| Tests unitaires et PostgreSQL | 99 tests réussis, 6 fichiers |
| `npm run build` | Build de démonstration réussi |
| `npm run build:private` | Build Supabase réussi ; absence des modules et médias fictifs vérifiée automatiquement |
| Playwright | 10 tests réussis, PC et mobile ; suite complète locale ~4 min 12 s |
| Audit npm production | 0 vulnérabilité signalée |
| HTTP Wi-Fi sans contexte sécurisé | Journée 1 démarrée, terminée et sauvegardée via l'adresse réseau |
| SwiftShader local (rendu logiciel) | Les 24 journées terminées sur PC, 2 tests ciblés réussis |
| Erreurs JavaScript dans les parcours complets | Aucune |

## Ce que les parcours vérifient

- Les anciens parcours A/B : quête initiale, quatre maisons, collisions, habitants, dialogues, quêtes secondaires, joystick, trois mini-jeux, sauvegarde et journal.
- Les **24 journées terminées**, avec validation et étoile, dans les deux formats de navigateur. Les mini-jeux sont réellement résolus ; le film fictif est lu jusqu'à sa fin. Les deux chasses utilisent des déplacements et interactions réels dans Phaser. La scène finale avance ses quatre répliques dans le village et produit sa récompense.
- Rejouer une journée ne retire pas l'étoile. Le journal atteint 24/24 en aperçu. Un texte non validé est repris après fermeture et rechargement de la page ; les étapes et mini-jeux ont également leur stockage de reprise.
- Éditeur fictif : enregistrement et rechargement du titre. Calendrier daté fermé en novembre et aperçu explicitement séparé.

Les tests d'activités chargent une **fixture de sauvegarde A/B déjà arrivée dans la pièce** pour éviter de répéter 24 traversées du village. Ils ne modifient pas les résultats, manches ni étoiles de l'Avent. Les recherches et le final s'exécutent dans le monde ; le parcours de non-régression B traverse physiquement le village et ses quatre portes. Ce choix distingue la couverture des activités de celle des déplacements.

## Sécurité vérifiée

La migration SQL livrée est exécutée sur PostgreSQL embarqué PGlite. Les schémas Auth et Storage sont simulés pour tester les privilèges : anonymes et comptes non invités refusés ; minuit Paris exact ; lecture directe de contenu futur bloquée ; médias futurs invisibles ; réponses privées illisibles ; usurpation de rôle, écriture directe de progression et aperçu joueur refusés ; progression isolée par compte et mode ; ordre des objectifs, preuves invalides/NULL et versions contrôlés ; récompenses conservées lors d'une modification. Chacune des 24 journées est aussi terminée via les RPC PostgreSQL avec ses preuves valides.

Un test couvre aussi les identifiants de manche sur HTTP local, et les parcours des 24 jours simulent cette disponibilité des API crypto. Les tests du client refusent configuration absente, clé secrète, JWT service_role et endpoint distant sans HTTPS. Aucun vrai secret n'est utilisé. Le build privé exclut les modules de définition de démonstration et le film local.

## Limites

L'instance Supabase réelle n'est pas configurée dans cet environnement. Connexion/invitation réelle, e-mails, politiques Storage sur le service distant et URL signées HTTP restent à vérifier après provisionnement avec le guide. Les tests SQL ne constituent pas une certification du service distant. Aucun contenu réel n'est revendiqué sécurisé par le mode de démonstration.

Safari iOS, téléphone physique et performances sur appareil peu puissant ne sont pas validés ici. Phaser reste un chunk d'environ 1,21 Mo brut / 332 Ko gzip et Vite émet un avertissement de taille, sans erreur de build. Les graphismes et le film restent fictifs. Aucun déploiement Vercel ni fusion de branche n'est effectué.

La CI GitHub réexécute lint, les 99 tests, les deux builds et les 10 tests navigateur sous Linux/Chromium avec rendu logiciel. Son état distant est consultable dans la Pull Request ; il est distinct des résultats locaux ci-dessus. Les captures sont dans `docs/screenshots/phase-c-*.png`, également publiées comme artefact CI.
