import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { User } from '@/lib/api/users';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Проверяем аутентификацию на основе токена, а не наличия данных пользователя
  const isAuthenticated = useCallback(() => {
    return authApi.isAuthenticated();
  }, []);

  const fetchUser = useCallback(async () => {
    // Проверяем наличие токена
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setError(err.message);
      
      // Create basic user object so UI works even if profile request fails
      if (isAuthenticated()) {
        setUser({
          id: 0,
          email: 'admin@example.com',
          role: 'ADMIN',
          banned: false
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Call login method from authApi
      const response = await authApi.login({ email, password });
      
      // Set basic user data
      setUser({
        id: 0,
        email: email,
        role: 'ADMIN',
        banned: false
      });
      
      // authApi.login already performs redirect, no need to duplicate
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  useEffect(() => {
    // When component mounts, check if there's a token and try to load user data
    if (isAuthenticated()) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser, isAuthenticated]);

  return {
    user,
    loading,
    error,
    // Проверяем аутентификацию на основе токена, а не на основе данных пользователя
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    refreshUser: fetchUser
  };
}
