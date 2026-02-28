import { useCallback, useEffect, useState } from 'react';

export type AppRoute = '/generator' | '/history' | '/settings' | '/login';

const ROUTES: AppRoute[] = ['/generator', '/history', '/settings', '/login'];

export function getCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') {
    return '/generator';
  }

  const rawHash = window.location.hash || '';
  const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const path = (hash.split('?')[0] || '').trim();
  const normalized = path
    ? (path.startsWith('/') ? path : `/${path}`)
    : '';

  if (ROUTES.includes(normalized as AppRoute)) {
    return normalized as AppRoute;
  }

  return '/generator';
}

export function navigate(route: AppRoute, opts?: { replace?: boolean }): void {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getCurrentRoute();
  if (current === route && window.location.hash) {
    return;
  }

  if (opts?.replace) {
    window.history.replaceState(null, '', `#${route}`);
    window.dispatchEvent(new Event('hashchange'));
    return;
  }

  window.location.hash = route;
}

export function useRoute(): [AppRoute, (r: AppRoute, opts?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState<AppRoute>(() => getCurrentRoute());

  const go = useCallback((next: AppRoute, opts?: { replace?: boolean }) => {
    navigate(next, opts);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getCurrentRoute());
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    if (!window.location.hash) {
      navigate('/generator', { replace: true });
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return [route, go];
}
