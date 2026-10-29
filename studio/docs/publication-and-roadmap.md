# Diffusion et évolution de Hanko Theme Studio

## Positionnement

Présenter Hanko Theme Studio comme un éditeur guidé d’expériences d’identité : connexion, espace personnel, sécurité, organisations et accès, avec une bibliothèque de modèles et une intégration Hanko. La préversion actuelle permet de composer, tester et échanger un projet. Le futur socle stable doit produire les sorties exécutables à partir de cette même composition.

Il existe déjà un [Keycloak Theme Editor](https://github.com/kathari00/keycloak-theme-editor) avec export JAR et un [éditeur visuel présenté par Keycloakify](https://www.keycloakify.dev/). Notre axe de différenciation proposé est la continuité entre Keycloak, les écrans applicatifs et la gestion des organisations/permissions, avec un catalogue ouvert et une intégration embarquable. La bibliothèque, la documentation et la fidélité des exports doivent concrétiser cette proposition.

## Où publier

| Destination | Contenu | État et prochaine action |
| --- | --- | --- |
| Dépôt public existant `Alien6-Studio/hankoshell-keycloak-theme-builder` | Sources, documentation, exemples et suivi | Disponible ; les changements de cette revue restent locaux |
| GitHub Releases | Archive du site, module npm `.tgz`, manifeste et empreintes ; JAR natif identifié séparément | Aucune release constatée sur le dépôt pendant la revue ; archives de préversion préparées localement |
| GitHub Pages | Démonstration autonome avec projets dans le navigateur | Recommandation de démarrage : `https://alien6-studio.github.io/hankoshell-keycloak-theme-builder/` ; Pages n’était pas activé lors de la vérification |
| Domaine `studio.hanko.sh` | Adresse produit lisible | Proposition, à configurer et vérifier ; aucune activation DNS effectuée |
| npm | `@alien6/hankoshell-theme-studio`, canal `preview`, puis stable ; CLI natif séparé | Métadonnées de paquet préparées ; configurer les droits du scope et le trusted publisher avant publication |
| Dépôt `hankoshell-theme-catalog` | Données des thèmes, sources des illustrations, licences et contributions | Dépôt local préparé ; publication publique à effectuer |
| Annuaire Keycloak | Découverte de l’outil | Soumettre après disponibilité d’une version installable et d’un export JAR fidèle à la composition |

[GitHub Pages héberge les fichiers statiques d’un dépôt](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Le build utilise des chemins relatifs et a été testé sous un sous-répertoire ; aucune API de développement n’est requise par le Studio autonome. Cloudflare Pages reste une alternative si un besoin d’en-têtes, de préversions ou d’intégration DNS justifie ce choix.

Pour npm, privilégier [Trusted Publishing avec OIDC](https://docs.npmjs.com/trusted-publishers/) et les [attestations de provenance](https://docs.npmjs.com/generating-provenance-statements/). Conserver le canal `preview` jusqu’à la levée des réserves. Publier aussi le SDK des écrans applicatifs, ou fournir un chemin d’installation explicitement documenté et versionné.

L’[annuaire officiel des extensions Keycloak](https://www.keycloak.org/extensions) accepte les demandes via une issue sur `keycloak/keycloak-web` et référence déjà des outils de thèmes. Une inscription décrit une extension communautaire ; elle ne constitue pas une validation de Keycloak.

## Séquence de publication proposée

1. Pousser le code et la bibliothèque de données avec des versions immuables ; exécuter les CI sur ces commits.
2. Vérifier les archives de préversion, leurs empreintes, leurs licences et une installation propre du module.
3. Publier une release marquée comme préversion, puis déployer l’archive statique sur Pages et le module sur le canal npm `preview`.
4. Ajouter un guide de dix minutes et trois cas reproductibles : connexion d’une application, portail d’organisation, sécurité du compte et authenticator.
5. Ouvrir la contribution au catalogue avec un schéma, des captures et une validation des sorties supportées.
6. Annoncer la version stable et demander le référencement Keycloak après qualification de la chaîne complète d’export et de publication.

## Priorités d’évolution

### Première version stable

- Un compilateur de composition commun et des renderers distincts pour Keycloak et les applications, avec tests de fidélité entre aperçu et sortie.
- JAR de connexion et courriels réellement issus du projet ; compilation isolée, artefact immuable, vérification puis affectation et retour arrière.
- Export React/Next fidèle, SDK public et exemple d’intégration exécutable.
- Navigation à état unique, liens profonds et historique ; sauvegarde automatique versionnée ou garde d’abandon des changements dans le Dashboard.
- Matrice de versions Keycloak vérifiées, essais des flux natifs et tests de non-régression sur les archives distribuées.

[Keycloakify documente les thèmes administrateur](https://docs.keycloakify.dev/theme-types/admin-theme) et les [thèmes de courrier, via plugin ou FreeMarker](https://docs.keycloakify.dev/theme-types/email-theme). Le raccordement des compositions du Studio à ces mécanismes relève de notre implémentation.

### Adoption et autonomie

- Interface de l’éditeur en français et anglais, aide contextuelle, parcours clavier et revue avec lecteur d’écran.
- Catalogue dédupliqué et chargé à la demande ; traitement et optimisation des images ; budgets de taille et de performances mesurés.
- Modèles de projet complets, sections réutilisables, documentation visuelle et contributions validées automatiquement.
- Version de publication du catalogue partagée entre cluster et organisations, avec copie locale, origine et mise à jour explicites.
- Déploiement autonome documenté à partir des fichiers statiques ; image de conteneur et chart seulement si la demande d’auto-hébergement les justifie.
- Mesurer l’adoption par les téléchargements, retours d’intégration et contributions ; éviter de confondre nombre de modèles et utilisabilité des sorties.

### Extensions

- API de blocs et renderers avec versions, capacités et permissions explicites ; migrations des schémas de projet.
- Adaptateur Angular après stabilisation du contrat de rendu partagé.
- MCP limité d’abord aux propositions de pages ou traductions validées contre les schémas ; aucune exécution de code de plugin arbitraire ni permission de déploiement implicite.
