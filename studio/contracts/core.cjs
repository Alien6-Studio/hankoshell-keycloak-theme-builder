function createValidator(ajv, schemas) {
const kinds=Object.keys(schemas);
function inspect(value, depth = 0, ancestors = new Set()) {
  if (depth > 32) throw new Error('Document trop profondément imbriqué.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return;
  if (typeof value !== 'object' || ancestors.has(value)) throw new Error('Données JSON attendues.');
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('Objet JSON simple attendu.');
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error(`Propriété réservée : ${key}.`);
    inspect(child, depth + 1, ancestors);
  }
  ancestors.delete(value);
}
function validate(kind, document) {
  if (!kinds.includes(kind)) return { valid: false, errors: ['Schéma inconnu.'] };
  try {
    inspect(document);
    if (new TextEncoder().encode(JSON.stringify(document)).byteLength > 40 * 1024 * 1024) throw new Error('Document limité à 40 Mo.');
    const check = ajv.getSchema(schemas[kind].$id);
    if (!check(document)) return { valid: false, errors: check.errors.slice(0, 12).map(e => `${e.instancePath || '/'} ${e.message}${e.params.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`) };
    if (kind === 'plugin') for (const block of document.blocks || []) {
      const scan = value => {
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) {
          if (['$ref', '$dynamicRef', '$recursiveRef', '$async'].includes(key)) throw new Error('Les schémas de plugins doivent être autonomes, sans référence externe ni validation asynchrone.');
          scan(child);
        }
      };
      scan(block.propsSchema);
      if (!ajv.validateSchema(block.propsSchema)) throw new Error('Schéma de propriétés du bloc invalide.');
    }
    if (kind === 'catalog') {
      const ids = document.themes.map(entry => entry.id);
      if (new Set(ids).size !== ids.length || document.themes.some(entry => entry.id !== entry.style.id)) throw new Error('Identifiants de thèmes incohérents ou dupliqués.');
    }
    const pages = kind === 'page' ? [document] : kind === 'project' ? Object.values(document.pages) : [];
    for (const page of pages) {
      const ids=page.blocks.map(block=>block.id).filter(Boolean);
      if(new Set(ids).size!==ids.length)throw new Error('Identifiants de blocs dupliqués.');
      if (!page.i18n) continue;
      if (!page.i18n.supportedLocales.includes(page.i18n.defaultLocale)) throw new Error('La langue de repli doit être activée.');
      for (const messages of Object.values(page.i18n.messages)) for (const key of Object.keys(messages)) if (key.startsWith('blocks.')) {
        const id = key.slice(7, key.endsWith('.text') ? -5 : -4);
        if (!page.blocks.some(block => block.id === id)) throw new Error('Une traduction référence un bloc absent : ' + id);
      }
    }
    return { valid: true, errors: [] };
  } catch (error) { return { valid: false, errors: [error.message] }; }
}
function bundle(kind) {
  if (!schemas[kind]) return undefined;
  const schema = structuredClone(schemas[kind]);
  schema.$defs = { ...schema.$defs, ...Object.fromEntries(kinds.filter(other => other !== kind).map(other => [`studio_${other}`, schemas[other]])) };
  return schema;
}

return {schemas,validate,bundle};
}
module.exports={createValidator};
