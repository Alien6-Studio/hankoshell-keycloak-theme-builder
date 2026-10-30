# Composition et publication — Studio 0.2.0-preview.3

Qualification locale du 30 octobre 2026, avec le compilateur natif
`0.2.0-preview.3`. Cette préversion ajoute la compilation du projet et le contrat
de publication du Dashboard. Aucune publication distante ni mise à jour de cluster
n’a été effectuée pendant cette qualification.

## Comportement livré

Le projet JSON produit maintenant un JAR contenant les blocs guidés, images,
styles et traductions de connexion, inscription et OTP. Les autres étapes
conservent leurs formulaires natifs dans la mise en page commune de connexion.
Les champs, actions POST, validations, flux MFA et jetons restent ceux de
Keycloak. Les exemples de saisie ne préremplissent pas les identifiants.
Les libellés du profil d’inscription prennent aussi en charge les clés de
traduction avancées de Keycloak ; les attributs supplémentaires restent natifs.

La vérification d’adresse, la réinitialisation de mot de passe et les actions
requises produisent des courriels FreeMarker HTML et texte. Les contenus rédigés
restent des données échappées. Le corps accepte les variables prénom et
organisation ; l’objet est un texte traduit littéral. Les autres types de
courriels héritent du thème parent Keycloak.

Le Dashboard enregistre le brouillon avant de construire une révision figée.
L’historique conserve son empreinte et son nom de thème. L’opérateur compile,
installe puis observe le redémarrage de Keycloak. L’affectation s’applique à un
realm (connexion/courriels) ou à un client (connexion), et reste en attente tant
que la configuration native n’est pas confirmée. Le retour arrière restaure les
valeurs précédentes et refuse les changements extérieurs concurrents.

Le Studio autonome fournit l’export du projet et la commande `hanko-theme
build-project`, puis les instructions d’installation et d’affectation. Il ne
possède pas de droits d’administration Keycloak dans le navigateur.

## Vérifications

| Contrôle | Résultat et portée |
| --- | --- |
| Compilateur | TypeScript et 17 tests passent : contrats, rendu, localisation et échappement des courriels. |
| Aperçu composé | 22 écrans en français, anglais et hébreu ; RTL, inscription personnalisée, liens natifs et largeur mobile passent. |
| Compatibilité du renderer existant | 22 écrans × deux langues × deux apparences ; huit langues de connexion, sans erreur navigateur ni requête extérieure. |
| Keycloak 26.7.3 réel | Inscription traduite, connexion OIDC, QR d’enrôlement OTP, code invalide refusé/code valide accepté, récupération, déconnexion et profil personnel persistant. |
| SMTP local | Trois courriels en HTML/texte, liens d’action natifs, substitution du prénom, hébreu RTL ; syntaxe FreeMarker et HTML rédigés restent inertes. |
| Worker Docker amd64 | Construction du projet sans réseau, sans capacités ni élévation de privilèges ; une mauvaise empreinte laisse le JAR précédent intact. |
| Studio | TypeScript et neuf tests passent. Parcours statique sous un sous-répertoire et CSP stricte : Chromium, Firefox, WebKit. |
| Accessibilité automatique | Zéro violation Axe détectée sur galerie, éditeur, styles, traductions et publication ; une revue humaine reste utile. |
| Client Dashboard réel | Isolation entre organisations, révisions successives, sauvegarde avant construction, boutons désactivés avant installation et confirmations différées d’affectation/retour arrière. |
| Dashboard | Lint, 733 tests, build Next et image Docker passent ; les archives locales sont présentes dans le contexte Docker. |
| API Go et PostgreSQL | Routes, autorisations, source figée, empreinte, observation native, refus des dérives ; isolation de scope et concurrence CAS dans une base temporaire. |
| Opérateur | Tests des contrôleurs/client natif, génération reproductible, contrats Go, schémas, Helm et inventaire de sécurité ; aucun changement des six profils RBAC/admission. |
| Dépendances npm | Aucun signalement au moment du contrôle pour les verrous du Studio et du compilateur. |

Les scripts et parcours reproductibles sont dans `test/`, `studio/test/` et les
scripts de qualification du worker Hanko. Les résultats détaillés et archives
restent dans les répertoires locaux `artifacts/` et `.theme-kit/` ignorés par Git.
Le test du client Dashboard demande aussi le checkout voisin `hanko-platform` ;
la CI du builder autonome ne dépend pas de ce checkout.

## Réserves avant une version stable

Qualifier la chaîne complète sur un cluster installé, avec l’image exacte
publiée, signée et approuvée : reprise des Jobs, collecte des sources, installation,
redémarrage Keycloak, affectations realm/client, concurrence et retour arrière.
Étendre les essais à la matrice de versions Keycloak supportées. Les essais locaux
ci-dessus ne remplacent pas ces étapes et ne démontrent pas un déploiement en
production.

Les écrans Compte/Administration restent conservés en JSON ; l’export React/Next
est un point de départ SDK et ne reproduit pas encore toute la composition.
Le SDK applicatif reste à distribuer publiquement. Angular, le rendu de plugins,
les liens profonds et l’historique navigateur restent à développer. L’interface de
l’éditeur reste en français. Le catalogue embarqué et les validateurs représentent
encore un budget de chargement à réduire.

La compilation en cluster accepte au plus 40 Mio décompressés et 900 000
caractères base64 compressés : optimiser les images ou utiliser le CLI pour les
projets plus lourds. Les URL d’images HTTPS restent externes ; privilégier les
images intégrées pour une authentification autonome.

La diffusion proposée reste GitHub Releases pour les archives, GitHub Pages pour
la démonstration et npm sur le canal `preview`, après CI distante et configuration
des droits de publication. Voir le [plan de diffusion](publication-and-roadmap.md).
