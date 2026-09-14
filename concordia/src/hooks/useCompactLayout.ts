/**
 * Short-viewport layout.
 *
 * The board is the thing worth looking at, so on a 768px-tall laptop the
 * furniture around it gives up height rather than the map: the forum shows
 * smaller cards, the storehouse uses tighter slots and the hand loses its
 * padding. Above ~900px everything runs at full size.
 */

import { useEffect, useState } from 'react';

const QUERY = '(max-height: 900px)';

export function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY).matches : false,
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setCompact(mq.matches);
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}
