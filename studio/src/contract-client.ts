export interface ValidationResult{valid:boolean;errors:string[]}
export async function validateDocument(base:string|undefined,kind:string,document:unknown):Promise<ValidationResult>{
 if(!base){
  try{const json=JSON.stringify(document);if(!json)return{valid:false,errors:['Données JSON attendues.']};if(new TextEncoder().encode(json).byteLength>40*1024*1024)return{valid:false,errors:['Document limité à 40 Mo.']};return(await import('./generated/browser-contracts.js')).validate(kind,JSON.parse(json));}
  catch(error){return{valid:false,errors:[error instanceof Error?error.message:'Document invalide.']};}
 }
 const response=await fetch(base+'/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,document}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Le service de validation est indisponible. Le projet reste intact.');
 return await response.json()as ValidationResult;
}
export async function requireValidDocument(base:string|undefined,kind:string,document:unknown){
 const result=await validateDocument(base,kind,document);
 if(!result.valid)throw Error(result.errors.join('\n'));
}
export async function documentSchema(base:string|undefined,kind:string){
 if(!base)return (await import('./generated/browser-contracts.js')).bundle(kind);
 const response=await fetch(base+'/'+kind,{signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Le schéma ne peut pas être chargé.');
 return await response.json()as unknown;
}
