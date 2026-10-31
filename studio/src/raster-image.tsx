import {useMemo,type ImgHTMLAttributes} from 'react';

/** Accept only raster data and reconstruct the URL from its decoded bytes. */
export function rasterImageSource(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 7 * 1024 * 1024) return undefined;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return undefined;
  try {
    const bytes = atob(match[2]);
    const starts = (signature: number[], offset = 0) => signature.every((byte, index) => bytes.charCodeAt(offset + index) === byte);
    // The MIME prefix is trusted code; only encoded raster bytes come from the document.
    switch (match[1]) {
      case 'png': return starts([137,80,78,71,13,10,26,10]) ? 'data:image/png;base64,' + btoa(bytes) : undefined;
      case 'jpeg': return starts([255,216,255]) ? 'data:image/jpeg;base64,' + btoa(bytes) : undefined;
      case 'webp': return starts([82,73,70,70]) && starts([87,69,66,80],8) ? 'data:image/webp;base64,' + btoa(bytes) : undefined;
      default: return undefined;
    }
  } catch { return undefined; }
}

export function RasterImage({src,...props}:Omit<ImgHTMLAttributes<HTMLImageElement>,'src'>&{src:unknown}) {
  const source = useMemo(() => rasterImageSource(src), [src]);
  return source ? <img {...props} src={source}/> : null;
}
