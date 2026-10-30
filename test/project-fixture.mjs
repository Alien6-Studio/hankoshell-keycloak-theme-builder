import {readFile,writeFile,mkdir} from 'node:fs/promises';import {dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
export async function projectFixture(){
 const names=['login','register','otp','email-verification','email-password-reset','email-required-actions'];
 const entries=await Promise.all(names.map(async(name,index)=>{
  const raw=await readFile(new URL('../studio/catalog/themes/essential/pages/'+name+'.json',import.meta.url),'utf8');
  return[(index<3?'login:':'email:')+(index%3),JSON.parse(raw)];
 }));
 const pages=Object.fromEntries(entries);
 pages['login:0'].blocks[0].text='Identité composée dans le Studio';pages['login:0'].native.copy.action='Entrer dans mon espace';
 for(const key of ['login:0','email:0'])pages[key].blocks.push({id:'layout-divider',type:'divider',zone:'footer',text:'',alt:'',align:'center',style:{width:50,imageHeight:3,color:'#335577'}});
 pages['login:1'].native.copy.emailLabel='Votre adresse de contact';
 pages['email:0'].blocks[0].text='Bonjour {{prénom}} — ${7*7} <script>inert</script> chez {{organisation}}';
 return{format:'hanko.theme-studio.project/v1',name:'studio-qualification',pages,media:[],destination:{mode:'standalone',url:'',realm:'',scope:'realm',client:'',theme:'studio-qualification'},publication:{status:'draft',built:false,deployed:false,attached:false}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const output=resolve(process.argv[2]||'.theme-kit/project-qualification.json');await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(await projectFixture(),null,2)+'\n');console.log('Wrote Studio project qualification fixture.');}
