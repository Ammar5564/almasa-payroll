export type AuthRole = 'ROLE_ADMIN' | 'ROLE_USER';

export type AuthState = {
  token: string;
  username: string;
  role: AuthRole;
};

const KEY = 'almasa_auth';

export function getAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (!parsed.token || !parsed.username || !parsed.role) return null;
    return parsed as AuthState;
  } catch {
    return null;
  }
}

export function setAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function isAdmin(state: AuthState | null) {
  return state?.role === 'ROLE_ADMIN';
}

