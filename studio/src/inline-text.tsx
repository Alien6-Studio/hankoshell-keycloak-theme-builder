import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

export const PreviewContext = createContext(false);

export function InlineText({ value, label, onChange, onSelect, className = '', style, multiline = true }: { value: string; label: string; onChange: (value: string) => void; onSelect: () => void; className?: string; style?: CSSProperties; multiline?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const original = useRef(value);
  const preview = useContext(PreviewContext);
  useLayoutEffect(() => { if (ref.current && document.activeElement !== ref.current && ref.current.textContent !== value) ref.current.textContent = value; }, [value]);
  if (preview) return <span className={className} style={style}>{value}</span>;
  return <span ref={ref} className={`inline-edit ${className}`} style={style} role="textbox" aria-label={label} aria-multiline={multiline} contentEditable suppressContentEditableWarning spellCheck draggable={false}
    onFocus={e => { original.current = e.currentTarget.textContent || ''; onSelect(); }}
    onClick={e => { e.stopPropagation(); onSelect(); }}
    onInput={e => { const text = e.currentTarget.innerText.replace(/\r/g, '').slice(0, 800); onChange(multiline ? text : text.replace(/\n/g, ' ')); }}
    onBlur={e => { if (e.currentTarget.textContent !== value) e.currentTarget.textContent = value; }}
    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.textContent = original.current; onChange(original.current); e.currentTarget.blur(); } else if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.currentTarget.blur(); } }}
    onPaste={e => { e.preventDefault(); const selection = getSelection(); if (!selection?.rangeCount || !e.currentTarget.contains(selection.anchorNode)) return; const text = e.clipboardData.getData('text/plain').slice(0, 800); const range = selection.getRangeAt(0); range.deleteContents(); const node = document.createTextNode(multiline ? text : text.replace(/\r?\n/g, ' ')); range.insertNode(node); range.setStartAfter(node); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); e.currentTarget.dispatchEvent(new Event('input', { bubbles: true })); }}
  />;
}
