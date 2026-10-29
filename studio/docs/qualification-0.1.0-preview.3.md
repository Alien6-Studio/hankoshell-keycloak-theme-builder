# Qualification — Hanko Theme Studio 0.1.0-preview.3

Revue du 29 octobre 2026. **Préversion destinée à la composition et à la revue des thèmes.** La sortie stable doit attendre la compilation fidèle des compositions et le raccordement de leur publication. Les contrôles décrits sont locaux ; les modifications n’ont pas encore été poussées et les nouvelles CI distantes ne sont donc pas déclarées vertes.

## Résultat et périmètre

| Élément | Résultat constaté |
| --- | --- |
| Studio autonome | Application statique utilisable sous un sous-répertoire, sans serveur de développement ni API de validation |
| Galerie | 3 thèmes complets, 54 variantes d’écran et 4 sections ; 2 anciens styles conservent leurs pages de départ |
| Édition | Texte en direct, images, glisser-déposer, styles, médiathèque et annulation |
| Sauvegarde | IndexedDB en autonome ; stockage et révisions par organisation/cluster dans Hanko |
| Modèles personnels | Conservation et réapplication des pages, traductions et médias |
| Navigation | Hiérarchie commune aux menus, au plan interactif, à `sitemap.xml` et à sa vue HTML |
| Données | Import/export JSON validé ; rejet des déclarations et renderers non pris en charge |
| Langues | 8 langues de contenu ; arabe et hébreu en RTL ; interface du Studio en français |
| Intégration Dashboard | Remise à zéro du projet et de la révision lors du changement d’organisation ; écriture désactivée si le chargement échoue |
| JAR natif existant | Construit et testé séparément dans Keycloak 26.7.3 ; Keycloakify 11.16.4 |
| Composition Studio → JAR | Raccordement absent ; la sauvegarde reste un brouillon |
| React/Next | Base d’intégration SDK compilable localement ; ne reproduit pas encore tous les blocs et textes personnalisés |

## Vérifications exécutées

- Chromium 148.0.7778.0, Firefox 150.0.2 et WebKit 26.4, sous Ubuntu 24.04 dans l’image officielle Playwright 1.60.0. Firefox ne démarrait pas correctement dans l’environnement macOS d’automatisation ; l’exécution Linux a permis de qualifier son parcours sans désactiver les protections de la machine.
- Distribution statique servie sous `/theme-studio/`, avec une CSP interdisant la compilation dynamique de JavaScript. Les validateurs sont précompilés à la construction. Les parcours testés ne demandent aucune API du Studio ni aucune ressource externe.
- Galerie, édition de titre, ajout d’image, retrait/annulation de média, glisser-déposer/annulation, export/import, modèle personnel avec médias, rechargement, RTL, traductions, rejet de lien JavaScript, disposition à 390 px et navigation hiérarchique.
- Contrôles axe-core WCAG A/AA et 2.1 AA : aucun défaut automatique détecté sur Galerie, Éditeur et Traductions dans ce scénario. Cela ne constitue pas une certification d’accessibilité ; une revue avec lecteur d’écran et de tous les dialogues reste nécessaire.
- Client Dashboard réel monté dans un hôte de test : sauvegarde de l’organisation Alpha à sa révision, passage à Beta avec sa propre révision, puis échec de chargement sans possibilité d’écrire. Les services du framework et le transport HTTP sont simulés dans ce test ; l’API a ses propres tests d’autorisation et de stockage.
- Suite Dashboard : 730 tests ; compilation Next.js et lint. API : contrats, handlers, périmètres et conflits ; test PostgreSQL réel sur une base temporaire pour l’isolation et deux sauvegardes concurrentes.
- Builder natif : 14 tests et empaquetage ; 22 pages × 2 langues × 2 apparences, plus 8 aperçus localisés de connexion. JAR frais testé dans Keycloak : connexion OIDC, enrôlement MFA, refus du mauvais code, acceptation du bon code, déconnexion, codes de récupération et profil persistant.
- L’export d’intégration React/Next passe TypeScript contre le SDK local. Le paquet `@alien6/hankoshell-typescript-adk` n’était pas accessible publiquement sur npm lors de la vérification : sa distribution est une condition de diffusion de cet export.

Les scripts reproductibles se trouvent dans `test/`, les résultats de navigateur dans `artifacts/qualification/` et les archives préparées dans `artifacts/release/`. Les empreintes des archives sont inscrites dans `SHA256SUMS`. Le manifeste indique le commit de base et la présence éventuelle de modifications locales ; il ne transforme pas un arbre de travail en release publiée.

## Corrections apportées pendant la revue

1. Validation du projet disponible dans l’application statique, avec les mêmes contrats et règles sémantiques que le serveur.
2. Validation avant sauvegarde, modèle et export ; protection des données locales illisibles ou non prises en charge.
3. Réinitialisation du client Dashboard par contexte pour préserver le bon projet et la bonne révision.
4. Restauration des médias des modèles personnels et possibilité de retirer une image de la médiathèque.
5. État des modifications non enregistrées et protection contre la fermeture/recharge du document. La navigation interne du Dashboard ne dispose pas encore d’un garde d’abandon ou d’une sauvegarde automatique.
6. Contraste corrigé dans la langue sélectionnée de l’écran des traductions.
7. Séparation des sections et sous-pages ; maintien de l’affectation et de l’historique d’annulation pendant la navigation.

## Réserves de sortie stable

- Compiler les blocs, médias et traductions de la composition en JAR, puis vérifier le résultat dans un vrai Keycloak. Le JAR natif déjà testé ne prouve pas cette fidélité.
- Produire les courriels HTML et texte avec les variables Keycloak, les traductions et des essais d’envoi.
- Rendre l’export applicatif fidèle à la composition et distribuer son SDK. L’adaptateur Angular reste à développer.
- Raccorder construction, installation, vérification, affectation et retour arrière, avec des droits et états persistants distincts.
- Ajouter des adresses et un historique de navigation pour les états de l’éditeur. Le plan XML documente actuellement des états en mémoire.
- Réduire le chargement initial : le catalogue et ses images portent le JavaScript principal à environ 0,9 Mo gzip ; les validateurs sont chargés à la demande. Dédupliquer et charger les modèles par famille avant une diffusion large.

Le MFA Authenticator relève de Keycloak natif. Le QR code du Studio utilise un secret de démonstration temporaire, exclu des projets et des modèles exportés.
