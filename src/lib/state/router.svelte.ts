// Einfacher Hash-Router: #/heute, #/training/aktiv, #/training/uebung/rudern …

export const router = $state({ path: '/heute' });

function read(): void {
  const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  const next = hash.startsWith('/') ? hash : '/heute';
  if (next !== router.path) window.scrollTo(0, 0);
  router.path = next;
}

export function initRouter(): void {
  read();
  window.addEventListener('hashchange', read);
}

export function go(path: string, replace = false): void {
  const target = `#${path}`;
  if (location.hash === target) return;
  if (replace) {
    history.replaceState(null, '', target);
    read();
  } else {
    location.hash = path;
  }
}

export function goBack(fallback: string): void {
  if (history.length > 1) history.back();
  else go(fallback);
}
