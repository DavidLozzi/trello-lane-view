import { TRELLO_API_BASE } from '@/config';
import type { TrelloBoard, TrelloList, TrelloCard } from '@/types/trello';

export class TrelloApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'TrelloApiError';
    this.status = status;
    this.body = body;
  }
}

export interface TrelloClientOptions {
  apiKey: string;
  token: string;
  maxRetries?: number;
}

export function createTrelloClient(options: TrelloClientOptions) {
  const { apiKey, token, maxRetries = 2 } = options;

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const url = new URL(`${TRELLO_API_BASE}/${path.replace(/^\//, '')}`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('token', token);

    let attempt = 0;
    let lastError: unknown;
    while (attempt <= maxRetries) {
      try {
        const res = await fetch(url.toString(), {
          method: 'GET',
          ...init,
          headers: {
            'Accept': 'application/json',
            ...(init?.headers || {}),
          },
        });
        if (!res.ok) {
          const bodyText = await res.text().catch(() => undefined);
          throw new TrelloApiError(`Trello request failed: ${res.status}`, res.status, bodyText);
        }
        return (await res.json()) as T;
      } catch (err) {
        lastError = err;
        // retry on network errors and 5xx
        const status = (err as any)?.status as number | undefined;
        if (status && status < 500) break;
        attempt += 1;
        if (attempt > maxRetries) break;
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Unknown Trello error');
  };

  return {
    getBoards: () => request<TrelloBoard[]>(`members/me/boards?filter=open&fields=id,name,desc,url,prefs`),
    getBoard: (boardId: string) => request<TrelloBoard>(`boards/${boardId}`),
    getLists: (boardId: string) => request<TrelloList[]>(`boards/${boardId}/lists?filter=open&fields=id,name,pos,closed`),
    getCards: (boardId: string) => request<any[]>(`boards/${boardId}/cards?fields=id,name,desc,pos,due,dateLastActivity,labels,idList,url,cover,closed&list=true`),
    getCardActions: (cardId: string) => request<any[]>(`cards/${cardId}/actions?filter=updateCard:idList&limit=10`),
  };
}

