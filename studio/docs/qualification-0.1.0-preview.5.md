# Navigation simplifiée — 0.1.0-preview.5 et preview.6

Correction du 29 octobre 2026 : le choix du type de thème et les onglets de sections/sous-pages constituent la navigation de l’éditeur. Le menu déroulant Écran, le fil d’Ariane et le chemin répété au-dessus de l’aperçu ont été supprimés. Le Plan conserve la vue d’ensemble de la hiérarchie.

Validation ciblée : TypeScript et 9 tests passent. Le parcours de qualification vérifie l’accès au Code OTP par les onglets, les sous-pages de sécurité, le plan, la conservation des contenus et l’historique d’annulation. Les réserves de publication de la [qualification initiale](qualification-0.1.0-preview.3.md) restent applicables.

Les parcours passent sur Chromium, Firefox et WebKit à partir de l’archive statique extraite. Axe-core ne relève aucune violation automatique sur les quatre espaces contrôlés. Le test du client Dashboard passe et son paquet installé correspond à l’archive produite. Aucune publication distante.

La préversion 6 normalise les fins de ligne des notices tierces et retire des lignes vides terminales avant les premiers commits. Elle conserve le même périmètre fonctionnel.
