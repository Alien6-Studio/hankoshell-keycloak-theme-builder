import type { Family, NativeCopy, NativePart, Page } from './model';
import { builtin, promoteLocale, type Locale } from './i18n';

export type ScreenLink = { part: NativePart; target?: string; label: string; result?: string };
export type Screen = { family: Family; index: number; label: string; parent?: string; kind: string; heading: string; copy: Partial<NativeCopy>; links: ScreenLink[] };
export const journeyScreens: Record<string, Screen> = {
  'account:0': { family: 'account', index: 0, label: 'Profil', kind: 'profile', heading: 'Votre espace personnel', copy: {}, links: [{ part: 'action', label: 'Enregistrer les modifications', result: 'Les informations du profil sont mises à jour dans cet aperçu.' }] },
  'account:1': { family: 'account', index: 1, label: 'Sécurité', kind: 'security', heading: 'Protégez votre compte', copy: {}, links: [
    { part: 'row0Action', target: 'account:2', label: 'Modifier le mot de passe' },
    { part: 'row1Action', target: 'account:3', label: 'Configurer le MFA' },
    { part: 'row2Action', target: 'account:4', label: 'Gérer les sessions' },
  ] },
  'account:2': { family: 'account', index: 2, label: 'Mot de passe', parent: 'account:1', kind: 'password', heading: 'Un accès qui reste le vôtre', copy: {
    title: 'Modifier votre mot de passe', description: 'Choisissez un nouveau mot de passe et confirmez-le.', usernameLabel: 'Mot de passe actuel', usernameExample: '', passwordLabel: 'Nouveau mot de passe', passwordExample: '', emailLabel: 'Confirmer le mot de passe', emailExample: '', action: 'Enregistrer le mot de passe',
  }, links: [{ part: 'action', label: 'Enregistrer le mot de passe', result: 'Le changement de mot de passe est confirmé dans cet aperçu.' }] },
  'account:3': { family: 'account', index: 3, label: 'Authentification à deux facteurs', parent: 'account:1', kind: 'mfa', heading: 'Une protection supplémentaire', copy: {
    title: 'Configurer une application d’authentification', description: 'Ajoutez votre compte dans votre application, puis saisissez un code pour terminer.', row0: 'Ouvrez votre application d’authentification.', row1: 'Scannez le QR code ou saisissez la clé de configuration.', row2: 'Saisissez le code à six chiffres affiché par l’application.', otpLabel: 'Code à six chiffres', otpExample: '123456', action: 'Activer la double authentification',
  }, links: [{ part: 'action', label: 'Activer la double authentification', result: 'La double authentification est marquée comme active dans cet aperçu.' }] },
  'account:4': { family: 'account', index: 4, label: 'Sessions', parent: 'account:1', kind: 'sessions', heading: 'Gardez le contrôle de vos connexions', copy: {
    title: 'Vos sessions connectées', description: 'Consultez vos appareils et terminez une session à distance.', row0: 'Chrome · macOS', row1: 'Safari · iPhone', row2: 'Firefox · Linux', row0Action: 'Session actuelle', row1Action: 'Terminer cette session', row2Action: 'Terminer cette session',
  }, links: [{ part: 'row1Action', label: 'Terminer cette session', result: 'Une confirmation permet de terminer la session dans cet aperçu.' }, { part: 'row2Action', label: 'Terminer cette session', result: 'Une confirmation permet de terminer la session dans cet aperçu.' }] },
  'admin:0': { family: 'admin', index: 0, label: 'Console', kind: 'overview', heading: 'Votre espace d’administration', copy: { title: 'Console d’administration', description: 'Gérez les identités, les applications et leurs accès.', row0: 'Utilisateurs', row1: 'Clients et applications', row2: 'Rôles et permissions' }, links: [
    { part: 'row0', target: 'admin:1', label: 'Utilisateurs' }, { part: 'row1', target: 'admin:3', label: 'Clients et applications' }, { part: 'row2', target: 'admin:5', label: 'Rôles et permissions' },
  ] },
  'admin:1': { family: 'admin', index: 1, label: 'Utilisateurs', parent: 'admin:0', kind: 'users', heading: 'Les personnes de votre organisation', copy: { title: 'Gestion des utilisateurs', description: 'Recherchez une personne et ouvrez sa fiche.', usernameLabel: 'Rechercher un utilisateur', usernameExample: 'Nom ou adresse e-mail', row0: 'Nom', row1: 'Adresse e-mail', row2: 'État', action: 'Ouvrir la fiche' }, links: [{ part: 'action', target: 'admin:2', label: 'Ouvrir la fiche' }] },
  'admin:2': { family: 'admin', index: 2, label: 'Fiche utilisateur', parent: 'admin:1', kind: 'user', heading: 'Une identité, ses informations', copy: { title: 'Fiche utilisateur', description: 'Consultez les informations du compte et ses accès.', nameLabel: 'Nom complet', nameExample: 'Camille Martin', emailLabel: 'Adresse e-mail', emailExample: 'camille@aurora.fr', action: 'Enregistrer l’utilisateur', row0: 'Accès attribués', row0Action: 'Voir les rôles et permissions' }, links: [{ part: 'action', label: 'Enregistrer l’utilisateur', result: 'La fiche utilisateur est mise à jour dans cet aperçu.' }, { part: 'row0Action', target: 'admin:5', label: 'Voir les rôles et permissions' }] },
  'admin:3': { family: 'admin', index: 3, label: 'Clients et applications', parent: 'admin:0', kind: 'clients', heading: 'Vos applications connectées', copy: { title: 'Clients et applications', description: 'Ouvrez une application pour consulter sa configuration.', usernameLabel: 'Rechercher une application', usernameExample: 'Nom ou identifiant du client', row0: 'Application', row1: 'Identifiant du client', row2: 'Protocole', action: 'Configurer l’application' }, links: [{ part: 'action', target: 'admin:4', label: 'Configurer l’application' }] },
  'admin:4': { family: 'admin', index: 4, label: 'Configuration du client', parent: 'admin:3', kind: 'client', heading: 'Reliez vos applications à votre identité', copy: { title: 'Configuration de l’application', description: 'Consultez son identifiant et ses adresses de retour.', usernameLabel: 'Identifiant du client', usernameExample: 'aurora-dashboard', nameLabel: 'Nom de l’application', nameExample: 'Aurora Dashboard', emailLabel: 'URI de redirection', emailExample: 'https://app.aurora.example/callback', action: 'Enregistrer l’application' }, links: [{ part: 'action', label: 'Enregistrer l’application', result: 'La configuration de l’application est mise à jour dans cet aperçu.' }] },
  'admin:5': { family: 'admin', index: 5, label: 'Rôles et permissions', parent: 'admin:0', kind: 'permissions', heading: 'Des accès lisibles et maîtrisés', copy: { title: 'Rôles et permissions', description: 'Explorez un rôle pour voir les permissions qu’il accorde.', row0: 'Administrateur', row1: 'Membre', row2: 'Lecture seule', row0Action: 'Voir les permissions', row1Action: 'Voir les permissions', row2Action: 'Voir les permissions' }, links: [{ part: 'row0Action', label: 'Voir les permissions', result: 'Les permissions du rôle sont affichées sur cet écran.' }, { part: 'row1Action', label: 'Voir les permissions', result: 'Les permissions du rôle sont affichées sur cet écran.' }, { part: 'row2Action', label: 'Voir les permissions', result: 'Les permissions du rôle sont affichées sur cet écran.' }] },
};

export function screenAt(family: Family, index: string | number): Screen | undefined { return journeyScreens[`${family}:${index}`]; }
export function screenLabel(key:string){const screen=journeyScreens[key];if(!screen)return key;const labels:string[]=[];const seen=new Set<string>();let current:Screen|undefined=screen;while(current){const id=current.family+':'+current.index;if(seen.has(id))break;seen.add(id);labels.unshift(current.label);current=current.parent?journeyScreens[current.parent]:undefined;}return[screen.family==='account'?'Compte':'Administration',...labels].join(' / ');}
export function journeyText(value: string, locale: Locale) { return builtin(value, 'fr', locale) ?? value; }
export function screenParts(family: Family, index: string): NativePart[] {
  const kind = screenAt(family, index)?.kind;
  const fields: Record<string, NativePart[]> = {
    profile: ['nameLabel','nameExample','emailLabel','emailExample','action'],
    password: ['usernameLabel','usernameExample','passwordLabel','passwordExample','emailLabel','emailExample','action'],
    mfa: ['row0','row1','row2','otpLabel','otpExample','action'],
    security: ['row0','row0Action','row1','row1Action','row2','row2Action'],
    sessions: ['row0','row0Action','row1','row1Action','row2','row2Action'],
    overview: ['row0','row1','row2'],
    users: ['usernameLabel','usernameExample','row0','row1','row2','action'],
    clients: ['usernameLabel','usernameExample','row0','row1','row2','action'],
    user: ['nameLabel','nameExample','emailLabel','emailExample','action','row0','row0Action'],
    client: ['usernameLabel','usernameExample','nameLabel','nameExample','emailLabel','emailExample','action'],
    permissions: ['row0','row0Action','row1','row1Action','row2','row2Action'],
  };
  return ['title','description', ...(kind ? fields[kind] : family === 'login' ? [...(index === '2' ? ['otpLabel','otpExample'] as NativePart[] : [...(index==='1'?['nameLabel','nameExample'] as NativePart[]:[]),'usernameLabel','usernameExample','passwordLabel','passwordExample'] as NativePart[]), 'action' as const] : family === 'email' ? ['action' as const] : ['row0','row1','row2'] as NativePart[])];
}

/** New destinations use the current theme's appearance while retaining their own content. */
export function inheritAppearance(page: Page, source: Page): Page {
  const settings = source.i18n!;
  let next = settings.defaultLocale === 'fr' ? page : promoteLocale(page, settings.defaultLocale);
  const messages = structuredClone(next.i18n!.messages);
  for (const language of settings.supportedLocales) {
    for (const field of ['brand.name','brand.alt']) {
      const translated = settings.messages[language]?.[field];
      if (translated !== undefined) messages[language] = { ...messages[language], [field]: translated };
      else if (messages[language]) delete messages[language]![field];
    }
  }
  return { ...next, preset: source.preset, layout: source.layout, radius: source.radius, accent: source.accent, brand: { ...source.brand }, appearance: { ...source.appearance }, native: { ...source.native, copy: next.native.copy, styles: structuredClone(source.native.styles) }, i18n: { ...next.i18n!, supportedLocales: [...settings.supportedLocales], messages } };
}
