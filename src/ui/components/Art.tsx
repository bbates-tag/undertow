// Optional raster-art layer (§7 "later upgrade" path). Drop full-res masters
// into public/art/{cards,enemies,characters}/<contentId>.png, run
// scripts/optimize-art.sh, and the resulting <contentId>.webp renders
// automatically; anything missing falls back to the icon treatment.
// The icon renders until the image has actually loaded, so there is never
// a blank art box — not on 404s, not on slow connections.

import { useEffect, useState } from 'react';
import { GameIcon } from '../icons';

export type ArtKind = 'cards' | 'enemies' | 'characters' | 'backgrounds';

/** session-wide load results so each id is only probed once */
const missing = new Set<string>();
const loaded = new Set<string>();

export function artUrl(kind: ArtKind, id: string): string {
  return `${import.meta.env.BASE_URL}art/${kind}/${id}.webp`;
}

/**
 * Probe an art asset and return its URL once it has actually loaded, else
 * null. For full-bleed layers (battle backdrops) where the fallback is
 * "render nothing" rather than an icon.
 */
export function useArt(kind: ArtKind, id: string): string | null {
  const key = `${kind}/${id}`;
  const url = artUrl(kind, id);
  const [, bump] = useState(0);

  useEffect(() => {
    if (missing.has(key) || loaded.has(key)) return;
    const probe = new Image();
    probe.onload = () => {
      loaded.add(key);
      bump((n) => n + 1);
    };
    probe.onerror = () => {
      missing.add(key);
      bump((n) => n + 1);
    };
    probe.src = url;
  }, [key, url]);

  return loaded.has(key) ? url : null;
}

interface ArtImageProps {
  kind: ArtKind;
  id: string;
  /** fallback icon id from the registry */
  icon: string;
  className?: string;
  /** inline style for the <img> (e.g. a per-art objectPosition crop) */
  style?: React.CSSProperties;
  iconSize?: number | string;
  iconClassName?: string;
  alt?: string;
}

export function ArtImage({ kind, id, icon, className, style, iconSize, iconClassName, alt }: ArtImageProps) {
  const key = `${kind}/${id}`;
  const url = artUrl(kind, id);
  const [, bump] = useState(0);

  useEffect(() => {
    if (missing.has(key) || loaded.has(key)) return;
    const probe = new Image();
    probe.onload = () => {
      loaded.add(key);
      bump((n) => n + 1);
    };
    probe.onerror = () => {
      missing.add(key);
      bump((n) => n + 1);
    };
    probe.src = url;
  }, [key, url]);

  if (loaded.has(key)) {
    return <img src={url} alt={alt ?? ''} className={className} style={style} draggable={false} />;
  }
  return <GameIcon id={icon} size={iconSize} className={iconClassName} />;
}
