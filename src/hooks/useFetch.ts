/**
 * useAuthFetch — convenience hook for screens that need to call the API.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useAuthFetch<MyType>('/students');
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/authContext'; // adjust path as needed

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAuthFetch<T = any>(
  path: string,
  options?: RequestInit,
  deps: any[] = [],
): UseFetchResult<T> {
  const { authFetch } = useAuth();

  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    authFetch(path, options).then((result) => {
      if (cancelled) return;
      if (result === null) {
        setError('Failed to load data. Please try again.');
      } else {
        setData(result?.data ?? result);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, trigger, ...deps]);

  return { data, loading, error, refetch };
}


/**
 * useRoleGuard — redirects to login if the user does not have the required role.
 *
 * Usage:
 *   useRoleGuard(['driver', 'agency_admin']);
 */
import { useEffect as useEffectGuard } from 'react';
import { useNavigation } from '@react-navigation/native';
import { UserRole } from '../contexts/authContext';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<any>();

  useEffectGuard(() => {
    if (!isAuthenticated) {
      navigation.replace('Login');
      return;
    }
    if (user && !allowedRoles.includes(user.role)) {
      // User is authenticated but doesn't have the right role —
      // send them back to Home (the tab navigator handles their allowed screens).
      navigation.replace('Home');
    }
  }, [isAuthenticated, user?.role]);
}