# E.0 — Feuille de route jusqu'au 30 novembre 2026

Point de départ : 15 novembre, commit `7001466`. Objectif : décision d'ouverture le 30 novembre, premier jour autorisé à **00:00 Europe/Paris le 1er décembre**, soit le 30 novembre à 23:00 UTC. Les 24 contenus doivent être prêts et recettés avant cette date ; pas de développement quotidien improvisé en décembre.

## Hypothèses et charge

Prérequis immédiat de confidentialité : le dépôt est annoncé `public` par le connecteur GitHub. Faire confirmer/corriger cette visibilité et déterminer si une exposition historique nécessite un travail supplémentaire. Aucune modification de ce réglage dans l'audit ; le coût d'une éventuelle remédiation d'exposition n'est pas inclus dans les fourchettes ci-dessous.

Un développeur disponible presque à temps plein, propriétaire disponible pour fournir les textes/médias et valider les comptes, accès staging disponibles rapidement. Du 16 au 30 novembre : 15 jours calendaires, **11 jours de semaine**. Ce calendrier suppose un accès rapide aux services et des validations en 24–48 h ; il n'est pas une garantie de délai.

| Lot | Priorité | Charge indicative en jours-personne | Dépendances / incertitudes |
|---|---|---|---|
| E.1 artefact privé complet et garde-fous | P0 | 1–2 | Ressources manquantes déjà identifiées ; autres références dynamiques à vérifier |
| Supabase staging, Auth/RLS/Storage, 24 jours serveur | P0 | 1,5–3 | Accès, mails d'invitation, CAPTCHA, configuration distante |
| Personnalisation/import et validation des 24 journées | P0/P1 | 2–4 techniques + 1–3 éditoriaux propriétaire | Médias/textes non fournis ; temps éditorial peut dépasser cette plage |
| Reprise, versions, sauvegarde/restauration | P0 | 1–2 | Contrat local/serveur accepté ; synchronisation complète village non incluse |
| VPS/Nginx/HTTPS et recette de release | P0 | 1–2 | Accord d'installation, audit frais, disponibilité DNS/Certbot |
| Régression complète et téléphones réels | P0/P1 | 1,5–3 | Appareils disponibles et corrections Safari éventuelles |
| Narration/conclusion et confort | P1 | 1–3 | Réutilisation moteur ; pas de grande cinématique entièrement nouvelle |
| Réserve de correction / stabilisation | P0 | 1–2 | Résultats des essais réels |

**Socle P0 technique : environ 9–18 jours-personne**, en comptant la préparation technique des contenus et une marge ; éditorial propriétaire en plus, partiellement parallélisable. P1 ajoute environ 1–3 jours. Les fourchettes se recoupent et ne sont pas des estimations à la demi-journée garanties. Avec 11 jours ouvrés disponibles, la sortie est possible seulement dans la partie basse de la fourchette et avec périmètre strict. Un backend non prêt ou des médias tardifs mettent immédiatement le planning en risque.

Ne pas ajouter la synchronisation serveur de tout le village sans nouvelle estimation : elle élargirait sensiblement le lot de sauvegarde. Une reprise locale clairement annoncée reste une option de périmètre, à accepter explicitement.

## Planning proposé, soumis à validation

| Période | Résultat attendu et critère de sortie |
|---|---|
| 16–17 novembre | E.1 approuvée puis correctif d'artefact privé ; aucune ressource requise manquante ; test navigateur du build privé. Démarrer collecte éditoriale hors Git |
| 18–20 novembre | Staging Supabase configuré et recetté, invitations et rôles ; refus directs futurs/non-membres ; 24 preuves serveur ; contrat sauvegardes et compteur décidé |
| 21–22 novembre | Fenêtre facultative de rédaction/validation propriétaire, non supposée comme deux journées de développement disponibles ; aucune dépendance critique ne doit attendre ces jours |
| 23–25 novembre | Import privé des contenus définitifs, essais admin puis joueur, jour 10 et conclusion ; sauvegarde/restauration staging ; parcours complet local et mobile |
| 26–27 novembre | Infrastructure après accord explicite, artefact approuvé, HTTPS/CSP, reprise et retour arrière ; contrôle de non-impact des bots |
| 28–29 novembre | Réserve de recette/validation artistique et fonctionnelle si disponibilité ; aucun nouveau système P2 |
| 30 novembre | Vérification finale, état des 24 journées, comptes et sauvegardes, décision go/no-go ; gel de version ; ouverture datée serveur sans intervention sur l'horloge |

## Triage

**P0 — Indispensable :** artefact privé complet, confidentialité des jours/médias futurs, Auth et membres, validation des 24 activités, contenus disponibles dans Supabase, progression/reprise documentée et fiable, déploiement HTTPS isolé, sauvegarde/restauration, non-régression et procédure d'incident.

**P1 — Important :** personnalisation plus fine, continuité narrative, distinction des deux journaux/compteurs et de l'aperçu, meilleure conclusion, confort tactile et lecture mobile. Tout défaut empêchant de jouer sur l'appareil de Debby devient P0.

**P2 — Facultatif :** nouveaux habitants, grands systèmes sociaux, nouveaux métiers/visiteurs, nouvelles décorations, animations secondaires, nouvelle architecture de scènes générales. À reporter après Noël si cela menace P0.

## Points de décision

- Au 20 novembre, si Auth/Storage staging ne fonctionnent pas : traiter uniquement ce blocage et geler P1/P2. Ne pas publier les vraies surprises en mode demo pour gagner du temps.
- Au 25 novembre, si les vrais contenus manquent : signaler précisément les jours concernés ; obtenir des contenus de remplacement approuvés en privé. Ne pas inventer des souvenirs et ne pas appeler une démo une surprise personnalisée terminée.
- Au 27 novembre, si sauvegarde/restauration et HTTPS ne sont pas éprouvés : priorité absolue à la recette d'exploitation, aucune nouvelle animation.
- Au 30 novembre, **no-go** si fuite future, jour impossible, accès joueur indisponible, perte de progression non maîtrisée ou HTTPS non vérifié. Une date cible n'autorise pas à masquer ces risques.

E.0 n'autorise aucune des opérations ci-dessus : la prochaine mission E.1 est décrite séparément et attend l'accord explicite du propriétaire.
