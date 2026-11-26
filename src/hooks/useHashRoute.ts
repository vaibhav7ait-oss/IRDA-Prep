import { useCallback, useEffect, useState } from 'react';
import type { RouteName } from '../types';

function parseHash(): RouteName {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'prep' || hash === 'test' || hash === 'results') return hash;
  return 'home';
}

export function useHashRoute() {
  const [route, setRoute] = useState<RouteName>(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: RouteName) => {
    const targetHash = next === 'home' ? '#/' : `#/${next}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute(next);
    }
    window.scrollTo(0, 0);
  }, []);

  return { route, navigate };
}
