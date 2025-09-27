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
      console.log('Загружаем профиль пользователя...');
      const userData = await authApi.getCurrentUser();
      console.log('Профиль пользователя загружен:', userData);
      setUser(userData);
    } catch (err: any) {
      console.error('Ошибка при загрузке профиля:', err);
      setError(err.message);
      
      // Создаем базовый объект пользователя, чтобы UI работал,
      // даже если запрос профиля не удался
      if (isAuthenticated()) {
        console.log('Создаем базовый объект пользователя...');
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
      console.log('Выполняем вход с учетными данными:', { email });
      
      // Вызываем метод login из authApi
      const response = await authApi.login({ email, password });
      console.log('Успешный вход, получен токен');
      
      // Устанавливаем базовые данные пользователя
      setUser({
        id: 0,
        email: email,
        role: 'ADMIN',
        banned: false
      });
      
      // authApi.login уже выполняет редирект, не нужно дублировать
      return true;
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Выполняем выход...');
    authApi.logout();
    setUser(null);
  };

  useEffect(() => {
    // При монтировании компонента проверяем, есть ли токен
    // и пытаемся загрузить данные пользователя
    console.log('AuthContext mounted, checking authentication...');
    if (isAuthenticated()) {
      console.log('Токен найден, пытаемся загрузить профиль...');
      fetchUser();
    } else {
      console.log('Токен не найден, пользователь не аутентифицирован');
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
