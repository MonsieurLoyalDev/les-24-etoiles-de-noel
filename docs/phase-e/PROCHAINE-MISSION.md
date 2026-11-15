# Proposition E.1 — Fiabiliser la livraison privée

**Cahier des charges proposé uniquement. Ne pas exécuter sans validation explicite.** Audit source : `feature/phase-d4-2-activites`, `700146622131934c3416dfabd13b1bef2df3d85f`.

## Problème concret

Le build privé désactive la copie de `public` et utilise `ops/public-assets.json`. Les trois feuilles `/assets/activities-d42/{celestine,emile,augustin}.png` sont chargées par le jeu mais absentes de cette liste. Compilation, tests demo et recherche d'une phrase demo peuvent donc réussir avec un jeu privé incomplet. Le build privé peut également compiler sans configuration Supabase ; seule la chaîne de paquet distingue ensuite une release configurée.

## Objectif borné

Prérequis hors mutation E.0 : confirmer/corriger la visibilité GitHub actuellement retournée `public`. Ne pas copier de souvenirs ou de secrets dans cette branche même après passage en privé. Toute remédiation d'exposition historique exige un périmètre distinct si elle s'avère nécessaire.

Obtenir un artefact privé complet et vérifié, sans données personnelles et sans dépendre d'un service réel pour détecter une image manquante. Préserver les mécaniques, le village, les personnages, les intérieurs, les sauvegardes et les horaires. Aucun ajout de PNJ, quête, décoration ou nouveau moteur.

## Travail proposé

1. Vérifier l'état Git réel et partir du travail D.4.2 approuvé sur une branche dédiée, par exemple `feature/phase-e1-private-release`. Conserver les rapports E.0 et les éventuelles modifications utilisateur. Aucun merge automatique.
2. Compléter la liste de ressources privées pour les dépendances D.4.2 et rechercher les autres références runtime manquantes, y compris fontes, atlas, calendrier et chemins CSS/dynamiques. Ne pas copier tout `public` pour contourner la liste privée.
3. Renforcer le contrôle d'artefact : vérifier l'existence des dépendances autorisées, refuser une surprise demo ou un média privé dans le site statique, faire échouer une référence obligatoire manquante. Ajouter des tests négatifs utiles (retirer virtuellement une ressource du manifeste doit être détecté).
4. Ajouter un parcours navigateur **du build privé** avec Auth/RPC de fixture contrôlées, sans importer demo dans le bundle privé. Capturer les erreurs réseau et s'assurer qu'aucune image requise ne reçoit du HTML SPA à la place d'un PNG. Vérifier D.4.2 au minimum dans bibliothèque et village, dialogue/interruption et réduction des mouvements, PC et mobile émulé.
5. Distinguer explicitement compilation privée non configurée et artefact prêt à livrer. Conserver le refus de fallback demo et les protections de clés ; vérifier l'échec du packaging sans URL/clé/CAPTCHA. Ne pas publier de vraies clés ou de contenu personnel dans les fixtures.
6. Exécuter une installation propre depuis le lockfile puis TypeScript, lint, unitaires, build demo, build privé et parcours pertinents. Contrôler la sensibilité CRLF/LF des anciennes preuves SHA-256 (export Git Windows en échec E.0, copie LF fidèle réussie), sans supprimer les garanties de préservation. Sous Linux, exécuter les deux cas POSIX ignorés Windows et, si disponible, le test Nginx dans un environnement jetable. Aucune opération sur le VPS pour cette mission.
7. Produire un rapport de résultats, inventaire des ressources privées et courte validation visuelle du build réellement exécuté. Documenter les essais non réalisables plutôt que les déclarer réussis. PR de revue possible si demandée, sans fusion ni mise en ligne.

## Critères d'acceptation

- Les trois feuilles D.4.2 et toutes les ressources requises sont présentes et servies avec le bon type et les bons octets dans l'artefact privé.
- Les activités D.4.2 visibles dans le build privé utilisent leurs vraies poses ; aucun chargement silencieusement manquant.
- Aucun paquet de surprises demo ou contenu personnel dans les fichiers publics ; aucun accès preview accordé au joueur par une fixture trop permissive.
- L'absence d'une ressource obligatoire fait échouer un contrôle automatique pertinent.
- L'artefact non configuré ne peut pas être présenté comme prêt à livrer ; les clés privilégiées restent refusées.
- Les sauvegardes A/B/C et les 24 preuves/activités restent compatibles ; aucune modification des fichiers ou configurations de production.
- Rapport avec commandes exactes, nombres réussis/échoués/ignorés et limites. Aucun succès Supabase réel ou Safari iOS revendiqué par des doubles locaux.

## Hors périmètre

Provisionnement Supabase réel, comptes de Debby, vrais souvenirs, configuration Nginx/Certbot/VPS, synchronisation complète du village, enrichissement de la cérémonie et nouveaux habitants. Ces lots suivent après validation et disponibilité des accès.

Charge initiale : **1–2 jours-personne**, à réévaluer si l'audit de dépendances révèle d'autres écarts importants. Premier jalon de contrôle : reproduction du défaut et test privé qui échoue avant correction, puis passe avec le manifeste corrigé.

**E.1 n'a pas commencé pendant E.0.** Les défauts décrits sont laissés intacts dans le code audité.
