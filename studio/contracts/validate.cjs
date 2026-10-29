const Ajv2020=require('ajv/dist/2020.js').default;
const {createValidator}=require('./core.cjs');
const schemas={theme:require('./theme.schema.json'),page:require('./page.schema.json'),project:require('./project.schema.json'),plugin:require('./plugin.schema.json'),catalog:require('./catalog.schema.json'),translations:require('./translations.schema.json')};
const ajv=new Ajv2020({strict:true,allErrors:true,ownProperties:true});
for(const schema of Object.values(schemas))ajv.addSchema(schema);
module.exports=createValidator(ajv,schemas);
