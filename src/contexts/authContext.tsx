import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = 'http://192.168.0.166:5000/api'; // ← update to your backend URL

// ── Role constants ────────────────────────────────────────────────────────────
export const UserRole = {
  NESA_ADMIN:   'nesa_admin',
  ATPR_OFFICER: 'atpr_officer',
  SCHOOL_ADMIN: 'school_admin',
  AGENCY_ADMIN: 'agency_admin',
  DRIVER:       'driver',
  PARENT:       'parent',
  DOCTOR:       'doctor',
  SYSTEM_ADMIN: 'system_admin',
  PICKUP_AGENT: 'pickup_agent',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean; // true once AsyncStorage has been read on mount
}

export interface LoginResult {
  ok: boolean;
  otpRequired?: boolean;
  email?: string;
  error?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>;
  verifyOtp: (email: string, otp: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  isAuthenticated: boolean;
  /**
   * Central fetch helper — proactively refreshes tokens, retries once on 401.
   * Returns null if refresh fails (caller should navigate to login).
   */
  authFetch: (path: string, options?: RequestInit) => Promise<any>;
}

// ── Storage keys ──────────────────────────────────────────────────────────────
const TOKEN_KEY   = '@vuduka_access_token';
const REFRESH_KEY = '@vuduka_refresh_token';
const USER_KEY    = '@vuduka_user';

// ── JWT helpers ───────────────────────────────────────────────────────────────
function decodeExp(token: string): number | null {
  try {
    return JSON.parse(atob(token.split('.')[1])).exp ?? null;
  } catch {
    return null;
  }
}

function isExpiredOrSoon(token: string | null): boolean {
  if (!token) return true;
  const exp = decodeExp(token);
  if (!exp) return true;
  return exp * 1000 < Date.now() + 30_000; // 30-second buffer
}

// ── Role Configuration ────────────────────────────────────────────────────────
export interface RoleConfig {
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  /** Tabs shown in the bottom navigator for this role */
  tabs: Array<'Homescreen' | 'Discover' | 'Ticketverify' | 'Incident'>;
  /** Human-friendly role description */
  description: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  system_admin: {
    label:       'System Admin',
    subtitle:    'Full platform access',
    color:       '#7C3AED',
    bgColor:     '#EDE9FE',
    tabs:        ['Homescreen', 'Discover', 'Incident'],
    description: 'You have full control over the platform.',
  },
  nesa_admin: {
    label:       'NESA Admin',
    subtitle:    'National oversight',
    color:       '#0891B2',
    bgColor:     '#CFFAFE',
    tabs:        ['Homescreen', 'Discover'],
    description: 'Monitor national education transport.',
  },
  atpr_officer: {
    label:       'ATPR Officer',
    subtitle:    'Transport regulation',
    color:       '#D97706',
    bgColor:     '#FEF3C7',
    tabs:        ['Homescreen', 'Discover', 'Incident'],
    description: 'Oversee routes and agency compliance.',
  },
  school_admin: {
    label:       'School Admin',
    subtitle:    'School management',
    color:       '#008A75',
    bgColor:     '#DCFCE7',
    tabs:        ['Homescreen', 'Discover'],
    description: 'Manage your school\'s transport registrations.',
  },
  agency_admin: {
    label:       'Agency Admin',
    subtitle:    'Fleet management',
    color:       '#0075A8',
    bgColor:     '#DBEAFE',
    tabs:        ['Homescreen', 'Ticketverify', 'Incident'],
    description: 'Manage your fleet and drivers.',
  },
  driver: {
    label:       'Driver',
    subtitle:    'Route management',
    color:       '#374151',
    bgColor:     '#F3F4F6',
    tabs:        ['Homescreen', 'Ticketverify', 'Incident'],
    description: 'View routes and manage passenger check-ins.',
  },
  parent: {
    label:       'Parent',
    subtitle:    'Student transport',
    color:       '#BE185D',
    bgColor:     '#FCE7F3',
    tabs:        ['Homescreen', 'Discover'],
    description: 'Track your child\'s transport and manage bookings.',
  },
  doctor: {
    label:       'Medical Officer',
    subtitle:    'Medical clearance',
    color:       '#0F766E',
    bgColor:     '#CCFBF1',
    tabs:        ['Homescreen'],
    description: 'Manage medical clearances for students.',
  },
  pickup_agent: {
    label:       'Pickup Agent',
    subtitle:    'Student pickup',
    color:       '#B45309',
    bgColor:     '#FEF9C3',
    tabs:        ['Homescreen', 'Ticketverify', 'Incident'],
    description: 'Handle daily student pickup operations.',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:          null,
    accessToken:   null,
    refreshToken:  null,
    isLoading:     false,
    isInitialized: false,
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // ── Restore session from AsyncStorage on mount ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedRefresh, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(REFRESH_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        const user = storedUser ? JSON.parse(storedUser) : null;
        setState(s => ({
          ...s,
          user,
          accessToken:   storedToken,
          refreshToken:  storedRefresh,
          isInitialized: true,
        }));
      } catch {
        setState(s => ({ ...s, isInitialized: true }));
      }
    })();
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────
  async function persist(user: AuthUser, accessToken: string, refreshToken: string) {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY,   accessToken),
      AsyncStorage.setItem(REFRESH_KEY, refreshToken),
      AsyncStorage.setItem(USER_KEY,    JSON.stringify(user)),
    ]);
    setState({ user, accessToken, refreshToken, isLoading: false, isInitialized: true });
  }

  async function clearSession() {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setState({ user: null, accessToken: null, refreshToken: null, isLoading: false, isInitialized: true });
  }

  // ── Token refresh ─────────────────────────────────────────────────────────
  const doRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      const rt = stateRef.current.refreshToken
        ?? await AsyncStorage.getItem(REFRESH_KEY);

      if (!rt) {
        await clearSession();
        return null;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/refresh-token`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken: rt }),
        });

        if (!res.ok) { await clearSession(); return null; }

        const { data } = await res.json();
        const newAccess: string  = data.accessToken;
        const newRefresh: string = data.refreshToken ?? rt;

        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY,   newAccess),
          AsyncStorage.setItem(REFRESH_KEY, newRefresh),
        ]);
        setState(s => ({ ...s, accessToken: newAccess, refreshToken: newRefresh }));
        return newAccess;
      } catch {
        await clearSession();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // ── Silent refresh on mount ───────────────────────────────────────────────
  useEffect(() => {
    const { accessToken, refreshToken } = stateRef.current;
    if (refreshToken && isExpiredOrSoon(accessToken)) {
      void doRefresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isInitialized]);

  // ── Central fetch helper ──────────────────────────────────────────────────
  const authFetch = useCallback(async (
    path: string,
    options: RequestInit = {},
  ): Promise<any> => {
    let token = stateRef.current.accessToken
      ?? await AsyncStorage.getItem(TOKEN_KEY);

    if (isExpiredOrSoon(token)) {
      token = await doRefresh();
    }
    if (!token) return null;

    const buildHeaders = (t: string) => ({
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${t}`,
      ...(options.headers ?? {}),
    });

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers: buildHeaders(token) });

    if (res.status === 401) {
      const newToken = await doRefresh();
      if (!newToken) return null;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers: buildHeaders(newToken) });
    }

    if (!res.ok) return null;
    return res.json().catch(() => null);
  }, [doRefresh]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  async function login(
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<LoginResult> {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, rememberMe }),
      });
      const json = await res.json();

      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false }));
        return { ok: false, error: json?.message ?? 'Invalid credentials.' };
      }

      const { data } = json;

      if (data.otpRequired) {
        setState(s => ({ ...s, isLoading: false }));
        return { ok: true, otpRequired: true, email: data.email };
      }

      await persist(data.user, data.accessToken, data.refreshToken);
      return { ok: true };
    } catch {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'Unable to reach the server. Check your connection.' };
    }
  }

  async function verifyOtp(email: string, otp: string): Promise<LoginResult> {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp }),
      });
      const json = await res.json();

      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false }));
        return { ok: false, error: json?.message ?? 'Invalid OTP.' };
      }

      const { data } = json;
      await persist(data.user, data.accessToken, data.refreshToken);
      return { ok: true };
    } catch {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'Unable to reach the server.' };
    }
  }

  async function logout() {
    const token = stateRef.current.accessToken;
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {/* fire-and-forget */});
    }
    await clearSession();
  }

  function hasRole(...roles: UserRole[]): boolean {
    return !!state.user && roles.includes(state.user.role);
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      verifyOtp,
      logout,
      hasRole,
      isAuthenticated: !!state.user && !!state.accessToken,
      authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}