// Shared origin preference for the public site and the standalone demo.
(()=>{
  const key='hankoshell-studio-appearance',valid=value=>['light','dark','system'].includes(value);
  const media=matchMedia('(prefers-color-scheme: dark)');
  const requested=new URLSearchParams(location.search).get('scheme');
  let saved;try{saved=localStorage.getItem(key);}catch{/* Optional preference. */}
  let choice=valid(requested)?requested:valid(saved)?saved:'light';
  function apply(){document.documentElement.dataset.theme=choice==='system'?(media.matches?'dark':'light'):choice;document.documentElement.dataset.appearance=choice;try{localStorage.setItem(key,choice);}catch{/* Storage is optional. */}}
  apply();media.addEventListener('change',()=>{if(choice==='system')apply();});
  document.addEventListener('change',event=>{if(event.target.matches('[data-appearance-select]')&&valid(event.target.value)){choice=event.target.value;apply();const url=new URL(location.href);url.searchParams.set('scheme',choice);history.replaceState(null,'',url);}});
  document.addEventListener('DOMContentLoaded',()=>{for(const select of document.querySelectorAll('[data-appearance-select]'))select.value=choice;});
  document.addEventListener('click',event=>{const anchor=event.target.closest('a[href]');if(!anchor)return;const url=new URL(anchor.href,location.href);if(url.origin===location.origin&&url.pathname.includes('/app/')){url.searchParams.set('scheme',choice);anchor.href=url.href;}});
})();
