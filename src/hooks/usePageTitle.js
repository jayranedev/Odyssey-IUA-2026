import { useEffect } from 'react';

// Per-route document titles (no SSR — just correct tab titles + history entries).
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · JugaadGPT` : 'JugaadGPT — AI jugaad solutions for real Indian constraints';
  }, [title]);
}
