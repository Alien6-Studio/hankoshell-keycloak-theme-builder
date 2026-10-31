// Shared origin preference for the public site and the standalone demo.
(()=>{
  const key='hankoshell-studio-appearance';
  const parse=value=>{switch(value){case 'light':return 'light';case 'dark':return 'dark';case 'system':return 'system';default:return undefined;}};
  const media=matchMedia('(prefers-color-scheme: dark)');
  const requested=parse(new URLSearchParams(location.search).get('scheme'));
  let saved;try{saved=parse(localStorage.getItem(key));}catch{/* Optional preference. */}
  let choice=requested||saved||'light';
  function reflect(){for(const button of document.querySelectorAll('.appearance-switch [data-appearance]'))button.setAttribute('aria-pressed',String(button.dataset.appearance===choice));}
  function apply(){document.documentElement.dataset.theme=choice==='system'?(media.matches?'dark':'light'):choice;document.documentElement.dataset.appearance=choice;try{localStorage.setItem(key,choice);}catch{/* Storage is optional. */}reflect();}
  apply();media.addEventListener('change',()=>{if(choice==='system')apply();});
  document.addEventListener('DOMContentLoaded',reflect);
  document.addEventListener('click',event=>{
    const button=event.target.closest('.appearance-switch [data-appearance]'),next=parse(button?.dataset.appearance);
    if(next){choice=next;apply();const url=new URL(location.href);url.searchParams.set('scheme',choice);history.replaceState(null,'',url);}
    const anchor=event.target.closest('a[href]');if(!anchor)return;const url=new URL(anchor.href,location.href);if(url.origin===location.origin&&url.pathname.includes('/app/')){url.searchParams.set('scheme',choice);anchor.href=url.href;}
  });
})();
