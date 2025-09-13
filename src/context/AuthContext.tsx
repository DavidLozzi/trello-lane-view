import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { buildTrelloAuthorizeUrl, getTokenExpiryTimestamp, TRELLO_API_KEY, TRELLO_API_BASE } from '@/config';

interface AuthState {
  apiKey: string;
  token: string | null;
  tokenExpiresAt: number | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  startOAuth: () => void;
  setToken: (token: string) => Promise<void>;
  logout: () => void;
}

const OAuthStateStorageKey = 'trello_oauth_state';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  const logout = useCallback(() => {
    setTokenState(null);
    setTokenExpiresAt(null);
  }, []);

  const generateState = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const startOAuth = useCallback(() => {
    const state = generateState();
    try {
      sessionStorage.setItem(OAuthStateStorageKey, state);
    } catch {}
    const url = buildTrelloAuthorizeUrl(state);
    window.location.assign(url);
  }, []);

  const setToken = useCallback(async (newToken: string) => {
    // Validate token with Trello API
    const res = await fetch(`${TRELLO_API_BASE}/members/me?key=${TRELLO_API_KEY}&token=${newToken}`);
    if (!res.ok) {
      throw new Error('Invalid Trello token');
    }
    setTokenState(newToken);
    setTokenExpiresAt(getTokenExpiryTimestamp());
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      apiKey: TRELLO_API_KEY,
      token,
      tokenExpiresAt,
      isAuthenticated: Boolean(token) && Boolean(TRELLO_API_KEY) && (!tokenExpiresAt || tokenExpiresAt > Date.now()),
      startOAuth,
      setToken,
      logout,
    }),
    [token, tokenExpiresAt, startOAuth, setToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function consumeAndValidateOAuthState(stateFromCallback: string | null): boolean {
  if (!stateFromCallback) return false;
  try {
    const stored = sessionStorage.getItem(OAuthStateStorageKey);
    sessionStorage.removeItem(OAuthStateStorageKey);
    return stored === stateFromCallback;
  } catch {
    return false;
  }
}

