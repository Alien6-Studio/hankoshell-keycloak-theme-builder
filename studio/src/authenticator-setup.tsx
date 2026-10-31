import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from './ui/button';
import { demoAuthenticator } from './authenticator';
import { journeyText } from './journeys';
import type { Locale } from './i18n';

export function AuthenticatorSetup({secret,brand,account,locale}: {secret:string;brand:string;account:string;locale:Locale}) {
  const t=(value:string)=>journeyText(value,locale);
  const enrollment=useMemo(()=>demoAuthenticator(secret,brand,account),[secret,brand,account]);
  const uri=enrollment.toString();
  const qr=useMemo(()=>{
    const {modules}=QRCode.create(uri,{errorCorrectionLevel:'M'});
    let path='';
    for(let y=0;y<modules.size;y++) for(let x=0;x<modules.size;) {
      if(!modules.data[y*modules.size+x]) {x++;continue;}
      const start=x;while(x<modules.size && modules.data[y*modules.size+x]) x++;
      path+=`M${start+4} ${y+4}h${x-start}v1h${start-x}z`;
    }
    return {path,size:modules.size+8};
  },[uri]);
  const [copied,setCopied]=useState(false);
  const [copyError,setCopyError]=useState(false);
  useEffect(()=>{if(!copied) return;const timer=setTimeout(()=>setCopied(false),2500);return()=>clearTimeout(timer);},[copied]);
  async function copyKey() {
    try {await navigator.clipboard.writeText(secret);setCopied(true);setCopyError(false);}
    catch {setCopyError(true);}
  }
  return <div className="authenticator-setup">
    <figure className="authenticator-qr"><svg role="img" aria-label={t('QR code à scanner dans votre application d’authentification')} viewBox={`0 0 ${qr.size} ${qr.size}`} width="256" height="256" shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#ffffff"/><path d={qr.path} fill="#111111"/></svg><figcaption><strong>{enrollment.issuer}</strong><span dir="ltr">{enrollment.label}</span><small>{t('Compte de démonstration · validation locale')}</small></figcaption></figure>
    <div className="authenticator-manual"><div className="authenticator-key-heading"><span><KeyRound size={14}/>{t('Clé de configuration manuelle')}</span><Button type="button" variant="ghost" size="sm" aria-label={t('Copier la clé')} onClick={event=>{event.stopPropagation();void copyKey();}}>{copied?<Check size={13}/>:<Copy size={13}/>}<span aria-live="polite">{t(copied?'Clé copiée':'Copier')}</span></Button></div><code className="authenticator-secret" dir="ltr">{secret.match(/.{1,4}/g)?.join(' ')}</code>{copyError&&<p className="authenticator-copy-error" role="status">{t('Sélectionnez la clé pour la copier manuellement.')}</p>}</div>
    <a className="authenticator-open" href={uri} onClick={event=>event.stopPropagation()}><Smartphone size={14}/>{t('Ouvrir mon authenticator')}</a>
  </div>;
}
