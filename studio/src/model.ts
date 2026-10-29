import catalogue from '../catalog/themes.json';
import { initializeI18n, type PageI18n } from './i18n';
import { journeyScreens, screenAt } from './journeys';
export type Family = 'login' | 'email' | 'account' | 'admin' | 'welcome';
export type Zone = 'header' | 'aside' | 'footer';
export type BlockType = 'heading' | 'text' | 'image' | 'divider' | 'button';
export type Layout = 'left' | 'center' | 'right';
export type ElementStyle = { color?: string; background?: string; fontSize?: number; fontWeight?: number; padding?: number; margin?: number; radius?: number; width?: number; imageHeight?: number; fit?: 'contain' | 'cover'; align?: 'left' | 'center' | 'right'; lineHeight?: number };
export type Block = { id: string; type: BlockType; zone: Zone; text: string; alt: string; src?: string; href?: string; align: 'left' | 'center' | 'right'; style?: ElementStyle };
export type Preset = { id: string; name: string; description: string; accent: string; background: string; surface: string; foreground: string; muted: string; radius: number; layout: Layout; font: string; density: 'comfortable' | 'compact' };
export type NativeCopy = { title: string; description: string; action: string; usernameLabel: string; usernameExample: string; passwordLabel: string; passwordExample: string; otpLabel: string; otpExample: string; nameLabel: string; nameExample: string; emailLabel: string; emailExample: string; row0: string; row1: string; row2: string; row0Action: string; row1Action: string; row2Action: string };
export type NativePart = keyof NativeCopy;
export type Page = {
  i18n?: PageI18n;
  blocks: Block[]; preset: string; layout: Layout; subject: string; radius: number; accent: string;
  brand: { name: string; mark: string; logo?: string; alt: string; size: number; fontSize: number; align: 'left' | 'center' | 'right'; color: string };
  appearance: { background: string; surface: string; foreground: string; muted: string; font: string; density: 'comfortable' | 'compact'; padding: number; gap: number; contentWidth: number; backgroundImage?: string; backgroundFit: 'cover' | 'contain' };
  native: { copy: NativeCopy; styles: Partial<Record<NativePart, ElementStyle>>; background: string; foreground: string; inputBackground: string; inputBorder: string; padding: number; radius: number; gap: number; buttonBackground: string; buttonColor: string };
};
export type Asset = { id: string; name: string; src: string; size: number };
export const families: Record<Family, { label: string; pages: string[]; attachment: string }> = {
  login: { label: 'Connexion', pages: ['Connexion', 'Inscription', 'Code OTP'], attachment: 'Realm ou client' },
  email: { label: 'Courriels', pages: ['Vérification de l’adresse', 'Mot de passe oublié', 'Actions requises'], attachment: 'Realm' },
  account: { label: 'Compte', pages: Object.values(journeyScreens).filter(s => s.family === 'account').map(s => s.label), attachment: 'Realm' },
  admin: { label: 'Administration', pages: Object.values(journeyScreens).filter(s => s.family === 'admin').map(s => s.label), attachment: 'Realm' },
  welcome: { label: 'Accueil', pages: ['Page d’accueil'], attachment: 'Configuration du serveur' },
};
export const presets: Preset[] = catalogue.themes.map(entry => entry.style as Preset);
export const zones: Record<Zone, string> = { header: 'En-tête', aside: 'Zone latérale', footer: 'Pied de page' };
export const blockNames: Record<BlockType, string> = { heading: 'Titre', text: 'Texte', image: 'Image', divider: 'Séparateur', button: 'Bouton' };
export const makeBlock = (type: BlockType, zone: Zone, text = ''): Block => ({ id: crypto.randomUUID(), type, zone, text, alt: '', align: 'left' });
export function initialPage(family: Family, pageIndex = 0): Page {
  const email = family === 'email';
  const screen = screenAt(family, pageIndex);
  const blocks = [makeBlock('heading', 'header', email ? pageIndex===1?'Réinitialiser mon mot de passe':pageIndex===2?'Actions requises':'Bienvenue chez Aurora' : family === 'account' ? pageIndex === 1 ? 'Protégez votre compte' : 'Votre espace personnel' : family === 'admin' ? 'Administration' : 'Votre identité,\nvotre univers.')];
  if (family === 'login' || family === 'welcome') blocks.push(makeBlock('image', 'aside'));
  else blocks.push(makeBlock('text', 'aside', email ? pageIndex===1?'Bonjour {{prénom}},\nRéinitialiser mon mot de passe':pageIndex===2?'Bonjour {{prénom}},\nActions requises':'Bonjour {{prénom}},\nConfirmez votre adresse pour accéder à votre espace Aurora.' : family === 'admin' ? 'Identités, applications et accès de votre organisation.' : 'Retrouvez vos informations et vos réglages de sécurité.'));
  blocks.push(makeBlock('text', 'footer', 'Une identité, tous vos services.'));
  const title = family === 'login' ? pageIndex === 1 ? 'Créer votre compte' : pageIndex === 2 ? 'Vérifiez votre identité' : 'Heureux de vous retrouver' : email ? pageIndex===1?'Réinitialiser mon mot de passe':pageIndex===2?'Actions requises':'Confirmez votre adresse' : family === 'account' ? pageIndex === 1 ? 'Votre sécurité' : 'Vos informations personnelles' : family === 'admin' ? pageIndex === 1 ? 'Gestion des utilisateurs' : 'Console d’administration' : 'Bienvenue';
  const rows = family === 'account' ? ['Mot de passe', 'Authentification à deux facteurs', 'Sessions connectées'] : family === 'admin' ? ['Utilisateurs', 'Clients et applications', 'Politiques d’accès'] : ['Mon compte', 'Mes applications', ''];
  if (screen) blocks[0].text = screen.heading;
  return initializeI18n({
    blocks, preset: 'essential', layout: email ? 'center' : 'left', subject: email&&pageIndex===1?'Réinitialiser mon mot de passe':email&&pageIndex===2?'Actions requises':'Confirmez votre adresse Aurora', radius: 12, accent: '#b33058',
    brand: { name: 'Aurora', mark: 'a', alt: 'Logo Aurora', size: 24, fontSize: 13, align: 'left', color: '#29232c' },
    appearance: { background: '#f5f2f4', surface: '#ffffff', foreground: '#29232c', muted: '#756b78', font: 'system-ui, sans-serif', density: 'comfortable', padding: 24, gap: 20, contentWidth: 1100, backgroundFit: 'cover' },
    native: { background: '#ffffff', foreground: '#29232c', inputBackground: '#ffffff', inputBorder: '#ddd8df', padding: 20, radius: 12, gap: 12, buttonBackground: '#b33058', buttonColor: '#ffffff', styles: {}, copy: {
      title, description: email ? 'Le lien d’action et sa durée de validité seront fournis par Keycloak.' : family === 'login' ? 'Accédez à votre espace en toute sécurité.' : family === 'account' ? pageIndex === 1 ? 'Protégez votre compte et contrôlez vos connexions.' : 'Gérez vos informations et votre adresse de contact.' : '',
      action: family === 'login' ? pageIndex === 1 ? 'Créer mon compte' : pageIndex === 2 ? 'Vérifier' : 'Se connecter' : family === 'account' ? 'Enregistrer les modifications' : pageIndex === 1 ? 'Réinitialiser mon mot de passe' : family==='email'&&pageIndex===2?'Vérifier':'Confirmer mon adresse',
      usernameLabel: 'Adresse e-mail', usernameExample: 'camille@aurora.fr', passwordLabel: 'Mot de passe', passwordExample: '••••••••', otpLabel: 'Code de vérification', otpExample: '000 000', nameLabel: 'Nom complet', nameExample: 'Camille Martin', emailLabel: 'Adresse e-mail', emailExample: 'camille@aurora.fr', row0: rows[0], row1: rows[1], row2: rows[2], row0Action: 'Modifier le mot de passe', row1Action: 'Configurer le MFA', row2Action: 'Gérer les sessions', ...screen?.copy,
    } },
  });
}
export function stylePage(page: Page, preset: Preset): Page {
  return { ...page, preset: preset.id, layout: preset.layout, radius: preset.radius, accent: preset.accent,
    brand: { ...page.brand, color: preset.foreground },
    appearance: { ...page.appearance, background: preset.background, surface: preset.surface, foreground: preset.foreground, muted: preset.muted, font: preset.font, density: preset.density, padding: preset.density === 'compact' ? 18 : 24, gap: preset.density === 'compact' ? 12 : 20 },
    native: { ...page.native, background: preset.surface, foreground: preset.foreground, inputBackground: preset.surface, inputBorder: preset.muted, buttonBackground: preset.accent, buttonColor: preset.surface, radius: preset.radius, padding: preset.density === 'compact' ? 14 : 20 },
  };
}
export function normalizePage(page: Page, family: Family, index = 0): Page {
  const blocks=page.blocks.map(block=>({...makeBlock(block.type,block.zone),...block}));
  if (page.brand && page.appearance && page.native && typeof page.brand.fontSize === 'number' && page.native.copy?.nameLabel) return initializeI18n({...page,blocks});
  const defaults = stylePage(initialPage(family, index), presets.find(p => p.id === page.preset) || presets[0]);
  const copy = { ...defaults.native.copy, ...page.native?.copy };
  if (family === 'account' && page.native?.copy.title === 'Mon compte') Object.assign(copy, defaults.native.copy);
  return initializeI18n({ ...defaults, ...page, blocks, i18n: page.i18n, brand: { ...defaults.brand, ...page.brand }, appearance: { ...defaults.appearance, ...page.appearance }, native: { ...defaults.native, ...page.native, copy, styles: page.native?.styles || {} } });
}
export const nativePartNames: Record<NativePart, string> = { title: 'Titre du formulaire', description: 'Texte d’introduction', action: 'Libellé du bouton', usernameLabel: 'Libellé de l’adresse e-mail', usernameExample: 'Exemple de l’adresse e-mail', passwordLabel: 'Libellé du mot de passe', passwordExample: 'Exemple du mot de passe', otpLabel: 'Libellé du code OTP', otpExample: 'Exemple du code OTP', nameLabel: 'Libellé du nom', nameExample: 'Exemple du nom', emailLabel: 'Libellé de l’adresse de contact', emailExample: 'Exemple de l’adresse de contact', row0: 'Première rubrique', row1: 'Deuxième rubrique', row2: 'Troisième rubrique', row0Action: 'Action du mot de passe', row1Action: 'Action du MFA', row2Action: 'Action des sessions' };
export const sample = (text: string) => text.replaceAll('{{prénom}}', 'Camille').replaceAll('{{organisation}}', 'Aurora');
export function checks(page: Page) {
  return [
    { label: 'Un titre permet d’identifier l’écran', ok: page.blocks.some(b => b.type === 'heading' && b.text.trim()) },
    { label: 'Tous les visuels ont une image et un texte alternatif', ok: page.blocks.filter(b => b.type === 'image').every(b => b.src && b.alt.trim()) },
    { label: 'Les textes ajoutés sont renseignés', ok: page.blocks.filter(b => b.type === 'text').every(b => b.text.trim()) },
    { label: 'Les fonctions Keycloak sont conservées', ok: true },
  ];
}
