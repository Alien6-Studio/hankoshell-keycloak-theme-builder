const menu=document.querySelector('.menu-toggle'),navigation=document.querySelector('.site-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.dataset.open=String(open);});
navigation?.addEventListener('click',event=>{if(event.target.closest('a')){navigation.dataset.open='false';menu?.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation?.dataset.open==='true'){navigation.dataset.open='false';menu?.setAttribute('aria-expanded','false');menu?.focus();}});

const filters=[...document.querySelectorAll('[data-filter]')],cards=[...document.querySelectorAll('.theme-card[data-family]')],count=document.querySelector('#theme-count');
for(const button of filters)button.addEventListener('click',()=>{
 const filter=button.dataset.filter;for(const option of filters)option.setAttribute('aria-pressed',String(option===button));
 let visible=0;for(const card of cards){const matches=filter==='all'||card.dataset.family===filter;card.hidden=!matches;if(matches)visible++;}
 if(count)count.textContent=visible+' '+(visible===1?'theme':'themes');
});

const preview=document.querySelector('#hero-preview'),title=document.querySelector('#hero-theme-name'),openTheme=document.querySelector('#hero-open'),themeButtons=[...document.querySelectorAll('[data-hero-theme]')],screenButtons=[...document.querySelectorAll('[data-screen]')];
let selectedTheme=themeButtons.find(button=>button.getAttribute('aria-pressed')==='true'),selectedScreen='login';
function updatePreview(){
 if(!preview||!selectedTheme)return;
 const id=selectedTheme.dataset.heroTheme,name=selectedTheme.dataset.name,screen={login:'login:0',account:'account:0',security:'account:1'}[selectedScreen];
 preview.src='./assets/themes/'+id+'-'+selectedScreen+'.webp';preview.alt=name+' Keycloak '+selectedScreen+' theme preview';title.textContent=name;
 openTheme.href='./app/?direction='+encodeURIComponent(id)+'&screen='+encodeURIComponent(screen)+'&locale=en';
 document.querySelector('.stage-count').textContent=selectedTheme.dataset.number+' / 16';
 for(const button of themeButtons)button.setAttribute('aria-pressed',String(button===selectedTheme));
 for(const button of screenButtons)button.setAttribute('aria-pressed',String(button.dataset.screen===selectedScreen));
}
for(const button of themeButtons)button.addEventListener('click',()=>{selectedTheme=button;updatePreview();});
for(const button of screenButtons)button.addEventListener('click',()=>{selectedScreen=button.dataset.screen;updatePreview();});

updatePreview();

document.querySelector('#copy-command')?.addEventListener('click',async event=>{
 const button=event.currentTarget;try{await navigator.clipboard.writeText(document.querySelector('#install-command').textContent);button.textContent='Copied ✓';}catch{button.textContent='Select the commands below';}
});
