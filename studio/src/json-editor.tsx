import {useUi} from './interface-context';
import {validateDocument,documentSchema} from './contract-client';
import {useContractBase,useStudioPortal} from './host';
import { useEffect, useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Braces, CheckCircle2, Download, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import pluginExample from '../contracts/plugin-example.json';
import pageExample from '../contracts/page-example.json';
import {catalogue} from './catalog-data';
import type { Page } from './model';

type Kind = 'page' | 'project' | 'plugin' | 'catalog';
export function JsonEditor({ open, onOpenChange, page, project, onPage, onProject }: { open: boolean; onOpenChange: (value: boolean) => void; page: Page; project: object; onPage: (value: unknown) => void; onProject: (value: unknown) => void }) {
  const ui=useUi();
  const contractBase=useContractBase();const portal=useStudioPortal();
  const [kind, setKind] = useState<Kind>('page');
  const [source, setSource] = useState('');
  const [message, setMessage] = useState('');
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const document = (value: Kind) => value === 'page' ? page : value === 'project' ? project : value === 'plugin' ? pluginExample : catalogue;
  useEffect(() => { if (open) { setSource(JSON.stringify(page, null, 2)); setKind('page'); setMessage(''); setValid(false); } }, [open]);
  function choose(value: string) { const next = value as Kind; setKind(next); setSource(JSON.stringify(document(next), null, 2)); setMessage(''); setValid(false); }
  async function validate() {
    const snapshot = source;
    setBusy(true); setValid(false);
    try {
      const value: unknown = JSON.parse(snapshot);
      const result = await validateDocument(contractBase,kind,value);
      if (!result.valid) throw new Error(result.errors?.join('\n') || 'Validation indisponible.');
      setValid(true); setMessage('Document conforme au schéma JSON.');
      return value;
    } catch (error) { setMessage(error instanceof Error ? error.message : 'JSON invalide.'); return undefined; }
    finally { setBusy(false); }
  }
  async function apply() {
    const value = await validate(); if (value === undefined) return;
    try { if (kind === 'page') onPage(value); else if (kind === 'project') onProject(value); onOpenChange(false); }
    catch (error) { setValid(false); setMessage(error instanceof Error ? error.message : 'Document non pris en charge.'); }
  }
  async function downloadSchema() {
    try{const schema=await documentSchema(contractBase,kind);
    const url = URL.createObjectURL(new Blob([JSON.stringify(schema, null, 2)], { type: 'application/schema+json' }));
    const link = globalThis.document.createElement('a'); link.href = url; link.download = `${kind}.schema.json`; link.click(); URL.revokeObjectURL(url);
    }catch(error){setMessage(error instanceof Error?error.message:'Schéma indisponible.');}
  }
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal container={portal}><DialogPrimitive.Overlay className="json-overlay" /><DialogPrimitive.Content className="json-dialog">
    <div className="json-dialog-heading"><div><DialogPrimitive.Title><Braces size={19} />{ui("Contrats JSON")}</DialogPrimitive.Title><DialogPrimitive.Description>{ui("Créez et validez les pages du même projet, avec un format indépendant du framework.")}</DialogPrimitive.Description></div><DialogPrimitive.Close asChild><Button variant="ghost" size="icon" aria-label={ui("Fermer les contrats JSON")}><X size={17} /></Button></DialogPrimitive.Close></div>
    <Tabs value={kind} onValueChange={choose}><TabsList className="json-tabs" aria-label={ui("Documents JSON")}><TabsTrigger value="page">{ui("Page")}</TabsTrigger><TabsTrigger value="project">{ui("Projet")}</TabsTrigger><TabsTrigger value="plugin">{ui("Plugin")}</TabsTrigger><TabsTrigger value="catalog">{ui("Catalogue")}</TabsTrigger></TabsList></Tabs>
    <div className="json-document-tools"><span>{kind === 'plugin' ? ui('Manifeste déclaratif · installation des renderers à développer') : kind === 'catalog' ? ui('Local catalogue · {count} themes · Apache-2.0',{count:catalogue.themes.length}) : ui('JSON Schema 2020-12 · contrat en cours de conception')}</span>{kind === 'page' && <Button variant="ghost" size="sm" onClick={() => { setSource(JSON.stringify(pageExample, null, 2)); setValid(false); setMessage(''); }}>{ui("Exemple minimal")}</Button>}<Button variant="outline" size="sm" onClick={() => void downloadSchema()}><Download size={14} />{ui("Schéma")}</Button></div>
    <Textarea aria-label={ui("Document JSON")} spellCheck={false} wrap="off" value={source} disabled={busy} onChange={e => { setSource(e.target.value); setValid(false); setMessage(''); }} className="json-source" />
    <div className="json-validation" role="status" data-valid={valid}>{valid && <CheckCircle2 size={16} />}<span>{message ? ui(message) : ui('Modifiez le document puis validez-le.')}</span></div>
    <div className="json-dialog-actions"><Button variant="outline" onClick={() => void validate()} disabled={busy}>{ui("Valider le JSON")}</Button>{(kind === 'page' || kind === 'project') && <Button onClick={() => void apply()} disabled={busy}>{kind === 'page' ? ui('Appliquer à cet écran') : ui('Importer le projet')}</Button>}</div>
  </DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>;
}
