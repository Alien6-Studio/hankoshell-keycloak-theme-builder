# Qualification ciblée — 0.1.0-preview.4

Revue du 29 octobre 2026. Cette préversion clarifie les rôles de Styles et Modèles. Le périmètre et les réserves de la [qualification précédente](qualification-0.1.0-preview.3.md) restent applicables.

- **Styles** : palettes de couleurs, typographie, disposition, espacements, largeur et arrondis de l’écran courant. Les cartes de thèmes ont été retirées de ce panneau.
- **Modèles** : accès direct à la galerie dans la barre principale. L’onglet latéral redondant et son écran intermédiaire ont été supprimés.
- **Style**, dans l’inspecteur : réglages de l’élément sélectionné. Le raccourci des propriétés de page porte désormais le nom « Styles de l’écran ».
- Le plan interactif, `sitemap.xml` et sa vue HTML décrivent les quatre panneaux de l’éditeur : Blocs, Styles, Médias et Calques.

## Vérifications locales

- TypeScript et les 9 tests du Studio passent.
- Archives statiques et npm construites ; le paquet installé dans Hanko correspond à l’archive produite.
- Parcours sur Chromium 148.0.7778.0, Firefox 150.0.2 et WebKit 26.4, à partir de l’archive statique extraite, sous un sous-répertoire et avec une CSP stricte.
- Vérification de la conservation des blocs, textes du formulaire, traductions, médias et autres écrans lors de l’application d’une palette ; annulation, changement de police et aller-retour par la galerie.
- Les parcours existants d’import/export, sauvegarde, modèles personnels, navigation, RTL et affichage mobile passent également.
- Axe-core : aucune violation automatique sur Galerie, Éditeur, Styles et Traductions dans le scénario contrôlé.
- Client Dashboard : changement d’organisation et de révision, puis blocage des écritures lors d’un échec de chargement. Compilation Next.js du Dashboard réussie.

Les contrôles de JAR, d’API et de base de données de la préversion précédente n’ont pas été relancés pour cette modification d’interface. Aucune publication distante n’a été effectuée.
