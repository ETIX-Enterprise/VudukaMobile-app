import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { UserRole } from '../../contexts/roles';
import { auditLogger } from '../logging/auditLogger';

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  stationId?: string;   // For agents
  badgeNumber?: string; // For RNP/RURA
  token: string;
  expiresAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: { nationalId: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const decoded: any = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        await SecureStore.deleteItemAsync('auth_token');
        return;
      }

      setUser({
        id: decoded.sub,
        name: decoded.name,
        role: decoded.role as UserRole,
        stationId: decoded.stationId,
        badgeNumber: decoded.badgeNumber,
        token,
        expiresAt: decoded.exp * 1000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function login(credentials: { nationalId: string; password: string }) {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) throw new Error('Authentication failed');

    const { token } = await res.json();
    const decoded: any = jwtDecode(token);

    await SecureStore.setItemAsync('auth_token', token);

    const authUser: AuthUser = {
      id: decoded.sub,
      name: decoded.name,
      role: decoded.role as UserRole,
      stationId: decoded.stationId,
      badgeNumber: decoded.badgeNumber,
      token,
      expiresAt: decoded.exp * 1000,
    };

    setUser(authUser);
    await auditLogger.log('AUTH_LOGIN', { userId: authUser.id, role: authUser.role });
  }

  async function logout() {
    if (user) {
      await auditLogger.log('AUTH_LOGOUT', { userId: user.id });
    }
    await SecureStore.deleteItemAsync('auth_token');
    setUser(null);
  }

  async function refreshToken() {
    const currentToken = await SecureStore.getItemAsync('auth_token');
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!res.ok) { await logout(); return; }
    const { token } = await res.json();
    await SecureStore.setItemAsync('auth_token', token);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};