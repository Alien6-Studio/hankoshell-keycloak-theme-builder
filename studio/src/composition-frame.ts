/** Shared layout recipes for the editor, native themes and application exports. */
import {frameCss as catalogFrameCss} from '@alien6/hankoshell-theme-catalog/frames';
export {frameVariables} from './frame-variables';
export const frameCss = `
[data-hanko-frame] [data-hanko-slot]:empty{display:none}
.hkc-root,.hanko-identity-composition{container-type:inline-size;container-name:hanko-screen}
[data-hanko-frame]{--hf-line:color-mix(in srgb,var(--hf-fg) 15%,transparent);position:relative;box-sizing:border-box;width:100%}
[data-hanko-frame] [data-hanko-slot]{min-width:0}
[data-hanko-frame] [data-hanko-slot=body]{grid-template-areas:'aside form'}
[data-hanko-frame][data-layout=right] [data-hanko-slot=body],[data-hanko-frame] [data-hanko-slot=body][data-layout=right]{grid-template-areas:'form aside'}
[data-hanko-frame] [data-hanko-slot=brand]{grid-area:brand}
[data-hanko-frame] [data-hanko-slot=header]{grid-area:header}
[data-hanko-frame] [data-hanko-slot=aside]{grid-area:aside}
[data-hanko-frame] [data-hanko-slot=form]{grid-area:form}
[data-hanko-frame] [data-hanko-slot=footer]{grid-area:footer}
[data-hanko-frame] [data-hanko-slot=nav]{grid-area:nav}
[data-hanko-frame] [data-hanko-slot=subnav]{grid-area:subnav}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=form] input{min-height:44px;font-size:14px}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=form] label{font-size:13px}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=form] h1,
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=form] h2{font-size:25px;letter-spacing:-.035em;line-height:1.2}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=footer]{font-size:12px;color:var(--hf-muted);padding-top:18px}
[data-hanko-frame=card][data-hanko-family=login]{padding:var(--hf-padding);background:var(--hf-surface);border:1px solid var(--hf-line);border-radius:var(--hf-radius);box-shadow:0 15px 45px #18253b16}
[data-hanko-frame=card][data-hanko-family=login] [data-hanko-slot=body]{display:block;margin:0}
[data-hanko-frame=card][data-hanko-family=login] [data-hanko-slot=brand]{margin-bottom:32px}
[data-hanko-frame=card][data-hanko-family=login] [data-hanko-slot=form]{max-width:none;width:100%;border:0}
[data-hanko-slot=form][data-hanko-field=underline] input{border-radius:0;border-width:0 0 1px;box-shadow:none}
[data-hanko-slot=form][data-hanko-field=filled] input{border-width:0 0 1px;box-shadow:none}
[data-hanko-slot=form][data-hanko-action=compact] .native-action,[data-hanko-slot=form][data-hanko-action=compact] [type=submit]{width:fit-content;min-width:140px;max-width:100%;display:flex;margin-inline-start:auto}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=form] .native-label{font-size:13px}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=form] .native-action,[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=form] .hk-btn{font-size:14px;min-height:42px}
[data-hanko-frame=card][data-hanko-family=login] [data-hanko-slot=form] form{margin-top:24px}
[data-hanko-frame=workspace][data-hanko-family=login]{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,1fr);grid-template-areas:'brand brand' 'header form' 'aside form' 'footer footer';column-gap:64px;row-gap:12px;padding:var(--hf-padding);background:var(--hf-surface);border:0;border-radius:var(--hf-radius);box-shadow:none}
[data-hanko-frame=workspace][data-hanko-family=login] [data-hanko-slot=body]{display:contents}
[data-hanko-frame=workspace][data-hanko-family=login] [data-hanko-slot=brand]{margin-bottom:22px}
[data-hanko-frame=workspace][data-hanko-family=login] [data-hanko-slot=header]{align-self:end}
[data-hanko-frame=workspace][data-hanko-family=login] [data-hanko-slot=aside]{align-self:start;font-size:15px;line-height:1.7}
[data-hanko-frame=workspace][data-hanko-family=login] [data-hanko-slot=form]{align-self:center;width:100%;max-width:none;border:0}
[data-hanko-frame=workspace][data-hanko-family=login] [data-hanko-slot=form] input{min-height:52px}
[data-hanko-frame=developer][data-hanko-family=login]{background:transparent;padding:0;border:0;box-shadow:none}
[data-hanko-frame=developer][data-hanko-family=login] [data-hanko-slot=brand]{justify-content:center!important;flex-direction:column;gap:12px;margin-bottom:28px}
[data-hanko-frame=developer][data-hanko-family=login] [data-hanko-slot=body]{display:block;margin:0}
[data-hanko-frame=developer][data-hanko-family=login] [data-hanko-slot=form]{width:100%;border:1px solid var(--hf-line);box-shadow:0 1px 2px #00000006}
[data-hanko-frame=developer][data-hanko-family=login] [data-hanko-slot=footer]{text-align:center;border:1px solid var(--hf-line);padding:16px;margin-top:18px;border-radius:6px}
[data-hanko-frame=split][data-hanko-family=login],
[data-hanko-frame=spotlight][data-hanko-family=login]{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.85fr);grid-template-areas:'brand form' 'header form' 'aside form' 'footer footer';gap:24px 64px;min-height:580px;padding:var(--hf-padding);border:0;box-shadow:none}
[data-hanko-frame=split][data-hanko-family=login] [data-hanko-slot=body],
[data-hanko-frame=spotlight][data-hanko-family=login] [data-hanko-slot=body]{display:contents}
[data-hanko-frame=split][data-hanko-family=login] [data-hanko-slot=form],
[data-hanko-frame=spotlight][data-hanko-family=login] [data-hanko-slot=form]{width:100%;align-self:center;max-width:none;box-shadow:0 18px 50px #00000014}
[data-hanko-frame=split][data-hanko-family=login] [data-hanko-slot=header],
[data-hanko-frame=spotlight][data-hanko-family=login] [data-hanko-slot=header]{align-self:end}
[data-hanko-frame=split][data-hanko-family=login] [data-hanko-slot=aside],
[data-hanko-frame=spotlight][data-hanko-family=login] [data-hanko-slot=aside]{align-self:start}
[data-hanko-frame=spotlight][data-hanko-family=login]{overflow:hidden;background:radial-gradient(ellipse at 5% 90%,color-mix(in srgb,var(--hf-accent) 23%,transparent),transparent 60%),var(--hf-bg);border-radius:var(--hf-radius)}
[data-hanko-frame=minimal][data-hanko-family=login]{background:var(--hf-bg);border:0;box-shadow:none;padding:18px 0}
[data-hanko-frame=minimal][data-hanko-family=login] [data-hanko-slot=body]{display:block;margin:0}
[data-hanko-frame=minimal][data-hanko-family=login] [data-hanko-slot=brand]{justify-content:center!important;margin-bottom:36px}
[data-hanko-frame=minimal][data-hanko-family=login] [data-hanko-slot=form]{border:0}
[data-hanko-frame=minimal][data-hanko-family=login] [data-hanko-slot=footer]{text-align:center}
[data-hanko-frame=minimal][data-hanko-family=login] [data-hanko-slot=form] h1,
[data-hanko-frame=minimal][data-hanko-family=login] [data-hanko-slot=form] h2{text-align:center;font-weight:500;font-size:26px}
[data-hanko-frame=editorial][data-hanko-family=login]{padding:var(--hf-padding);border:1px solid var(--hf-line);border-radius:var(--hf-radius);box-shadow:none}
[data-hanko-frame=editorial][data-hanko-family=login] [data-hanko-slot=brand]{padding-bottom:24px;border-bottom:1px solid var(--hf-line)}
[data-hanko-frame=editorial][data-hanko-family=login] [data-hanko-slot=form]{border-inline-start:1px solid var(--hf-line)}
[data-hanko-frame=console][data-hanko-family=login]{padding:0;border:1px solid var(--hf-line);border-radius:var(--hf-radius);overflow:hidden;box-shadow:0 10px 30px #0f172a0b}
[data-hanko-frame=console][data-hanko-family=login] [data-hanko-slot=brand]{padding:22px 32px;background:var(--hf-fg);color:var(--hf-surface)!important;margin:0}
[data-hanko-frame=console][data-hanko-family=login] [data-hanko-slot=header]{padding:24px 32px 0}
[data-hanko-frame=console][data-hanko-family=login] [data-hanko-slot=body]{margin:0;padding:12px 32px 32px;gap:40px}
[data-hanko-frame=console][data-hanko-family=login] [data-hanko-slot=form]{border:1px solid var(--hf-line);width:100%}
[data-hanko-frame=console][data-hanko-family=login] [data-hanko-slot=footer]{border-top:1px solid var(--hf-line);padding:12px 32px;background:var(--hf-surface)}
[data-hanko-frame][data-hanko-family=admin],
[data-hanko-frame][data-hanko-family=account]{display:grid;grid-template-columns:190px minmax(0,1fr);grid-template-areas:'brand brand' 'nav header' 'nav subnav' 'nav body' 'footer footer';gap:20px 32px;background:var(--hf-surface);padding:28px;border:1px solid var(--hf-line);box-shadow:none}
[data-hanko-frame][data-hanko-family=admin] [data-hanko-slot=body],
[data-hanko-frame][data-hanko-family=account] [data-hanko-slot=body]{grid-area:body;display:flex;flex-direction:column;align-items:stretch;margin:0}
[data-hanko-frame][data-hanko-family=admin] [data-hanko-slot=form],
[data-hanko-frame][data-hanko-family=account] [data-hanko-slot=form]{width:100%;max-width:none!important;border:1px solid var(--hf-line)}
[data-hanko-frame] [data-hanko-slot=nav]{display:flex;flex-direction:column;align-items:stretch;gap:5px;padding:12px;border:1px solid var(--hf-line);border-radius:8px;align-self:start;margin:0}
[data-hanko-frame] [data-hanko-slot=nav] button{text-align:start;font-size:13px;padding:11px;border-radius:5px}
[data-hanko-frame] [data-hanko-slot=nav] [aria-current]{background:color-mix(in srgb,var(--hf-accent) 10%,transparent);color:var(--hf-accent);text-decoration:none}
[data-hanko-frame=console] [data-hanko-slot=nav]{background:var(--hf-fg);color:var(--hf-surface);border:0}
[data-hanko-frame=console] [data-hanko-slot=nav] [aria-current]{color:var(--hf-surface);background:color-mix(in srgb,var(--hf-surface) 15%,transparent)}
.hkc-root:has([data-hanko-frame=card]){display:grid;place-items:center}
[data-hanko-frame][data-device=mobile]{display:block;grid-template-columns:1fr;padding:24px}
[data-hanko-frame][data-device=mobile] [data-hanko-slot=nav]{flex-direction:row;flex-wrap:wrap;margin-bottom:20px}
[data-hanko-frame][data-device=mobile] [data-hanko-slot=body]{display:flex!important;flex-direction:column;gap:20px}
[data-hanko-frame=workspace][data-hanko-family=login][data-layout=right]{grid-template-areas:'brand brand' 'form header' 'form aside' 'footer footer'}
[data-hanko-frame=split][data-hanko-family=login][data-layout=right],[data-hanko-frame=spotlight][data-hanko-family=login][data-layout=right]{grid-template-areas:'form brand' 'form header' 'form aside' 'footer footer'}
[data-hanko-frame=workspace][data-hanko-family=login][data-layout=center],[data-hanko-frame=split][data-hanko-family=login][data-layout=center],[data-hanko-frame=spotlight][data-hanko-family=login][data-layout=center]{grid-template-columns:minmax(0,1fr);grid-template-areas:'brand' 'header' 'aside' 'form' 'footer'}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=header]{text-wrap:balance;letter-spacing:-.045em}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=header] p,[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=header] .content-text{letter-spacing:0;max-width:36ch}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=aside] img{display:block;width:100%;max-width:100%}
[data-hanko-frame][data-hanko-family=login] [data-hanko-slot=brand]{letter-spacing:-.025em}
[data-hanko-frame=split][data-hanko-family=login],[data-hanko-frame=spotlight][data-hanko-family=login]{column-gap:48px;row-gap:18px;min-height:620px;grid-template-columns:minmax(0,1fr) minmax(320px,.92fr)}
[data-hanko-frame=split][data-hanko-family=login] [data-hanko-slot=brand],[data-hanko-frame=spotlight][data-hanko-family=login] [data-hanko-slot=brand]{margin:0;align-self:start}
[data-hanko-frame=split][data-hanko-family=login] [data-hanko-slot=form],[data-hanko-frame=spotlight][data-hanko-family=login] [data-hanko-slot=form]{box-shadow:0 4px 7px #00000003,0 22px 60px #0000000a;border:1px solid var(--hf-line)}
[data-hanko-frame=workspace][data-hanko-family=login]{column-gap:56px;row-gap:12px;box-shadow:0 8px 40px #10203b08}
[data-hanko-frame=editorial][data-hanko-family=login]{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);grid-template-areas:'brand brand' 'header form' 'aside form' 'footer footer';gap:20px 48px;border:0}
[data-hanko-frame=editorial][data-hanko-family=login] [data-hanko-slot=body]{display:contents}
[data-hanko-frame=editorial][data-hanko-family=login] [data-hanko-slot=brand]{margin:0;padding-bottom:24px}
[data-hanko-frame=editorial][data-hanko-family=login] [data-hanko-slot=form]{width:100%;max-width:none;align-self:center;border:0;border-radius:0;box-shadow:none}
[data-hanko-frame=editorial][data-hanko-family=login] [data-hanko-slot=header]{padding-top:16px}
[data-hanko-frame=editorial][data-hanko-family=login] [data-hanko-slot=aside]{align-self:start}
[data-hanko-frame=card][data-hanko-family=login]{box-shadow:0 3px 8px #18253b06,0 24px 70px #18253b12}
[data-hanko-frame=developer][data-hanko-family=login] [data-hanko-slot=form]{box-shadow:0 10px 40px #00000008}
[data-hanko-frame][data-hanko-family=account] [data-hanko-slot=nav],[data-hanko-frame][data-hanko-family=admin] [data-hanko-slot=nav]{border:0;background:color-mix(in srgb,var(--hf-accent) 4%,var(--hf-surface));padding:16px 12px}
[data-hanko-frame=console] [data-hanko-slot=nav]{background:var(--hf-fg)}
@container hanko-screen (max-width:700px){
 [data-hanko-frame][data-hanko-family=login], [data-hanko-frame][data-hanko-family=admin], [data-hanko-frame][data-hanko-family=account]{display:block;min-height:0;padding:24px;max-width:100%!important;grid-template-columns:1fr}
 [data-hanko-frame] [data-hanko-slot=body]{display:flex!important;flex-direction:column;gap:20px}
 [data-hanko-frame] [data-hanko-slot=nav]{flex-direction:row;flex-wrap:wrap;margin-bottom:20px;padding:8px}
 [data-hanko-frame] [data-hanko-slot=header]{margin-block:18px}
 [data-hanko-frame] [data-hanko-slot=form]{width:100%;max-width:none!important;min-width:0}
}
`+catalogFrameCss;
