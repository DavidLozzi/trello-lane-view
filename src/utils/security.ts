const ALLOWED_IMG_HOSTS = new Set([
  'images.unsplash.com',
  'trello-backgrounds.s3.amazonaws.com',
  'trello-members.s3.amazonaws.com',
  'trello-avatars.s3.amazonaws.com',
  'i.imgur.com',
]);

export function sanitizeText(input: string): string {
  if (!input) return '';
  return String(input).replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'));
}

export function safeImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url, window.location.origin);
    if ((u.protocol === 'https:' || u.protocol === 'http:') && (ALLOWED_IMG_HOSTS.has(u.hostname) || u.origin === window.location.origin)) {
      return u.toString();
    }
  } catch {}
  return undefined;
}

export function openInNewTabSafe(url: string): void {
  try {
    const u = new URL(url);
    window.open(u.toString(), '_blank', 'noopener,noreferrer');
  } catch {
    // ignore invalid urls
  }
}


