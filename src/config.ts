export const TRELLO_API_BASE = 'https://api.trello.com/1';
export const TRELLO_AUTH_BASE = 'https://trello.com/1/authorize';

export const TRELLO_OAUTH_EXPIRATION_DAYS = 30; // 30-day bounded lifetime
export const OAUTH_CALLBACK_PATH = '/oauth/callback';

const envApiKey = (import.meta as any)?.env?.VITE_TRELLO_API_KEY as string | undefined;

export const TRELLO_API_KEY: string = envApiKey || '';

export function assertApiKey(): void {
  if (!TRELLO_API_KEY) {
    // Dev-time warning only; in production this should be supplied at build time
    if (typeof window !== 'undefined' && (import.meta as any)?.env?.MODE !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('VITE_TRELLO_API_KEY is not set. Trello API calls will fail.');
    }
  }
}

export function buildTrelloAuthorizeUrl(state: string): string {
  assertApiKey();
  const returnUrl = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
  const params = new URLSearchParams({
    expiration: `${TRELLO_OAUTH_EXPIRATION_DAYS}days`,
    scope: 'read',
    response_type: 'token',
    name: 'Trello Swimlane Viewer',
    key: TRELLO_API_KEY,
    return_url: returnUrl,
    state,
  });
  return `${TRELLO_AUTH_BASE}?${params.toString()}`;
}

export function getTokenExpiryTimestamp(): number {
  const now = Date.now();
  return now + TRELLO_OAUTH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
}

