import { apiFetch, API_URL, ApiError } from '../api';
import { User } from './users';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  jwt?: string;
}

// Специальная функция для входа в систему - не использует apiFetch, чтобы избежать автоматического выхода
async function loginFetch(credentials: LoginCredentials): Promise<AuthResponse> {
  console.log(`Выполняем запрос на вход с учетными данными: ${credentials.email}`);
  
  try {
    const response = await fetch(`http://localhost:8080/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Login failed: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMessage = errorData.error;
        else if (errorData.message) errorMessage = errorData.message;
        else errorMessage = JSON.stringify(errorData);
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Успешный ответ от сервера входа:', data);
    return data;
  } catch (error) {
    console.error('Ошибка при выполнении запроса входа:', error);
    throw error;
  }
}

export const authApi = {
  /**
   * Authenticate a user with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('Начинаем процесс входа с учетными данными:', { email: credentials.email });
    
    // Полностью очищаем все старые токены и метки перед новым входом
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token_source');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      console.log('Полностью очищены все старые токены перед входом');
    }
    
    const data = await loginFetch(credentials) as AuthResponse;
    const accessToken = data.token || data.jwt; // поддерживаем оба поля

    // Проверяем, что бэкенд вернул корректный JWT
    if (!accessToken || accessToken.split('.').length !== 3) {
      throw new ApiError('Сервер вернул некорректный токен', 500);
    }

    console.log('Получен валидный токен от бэкенда, первые символы:', accessToken.substring(0, 20) + '...');

    // Сохраняем токен только тот, что пришёл с бэкенда
    localStorage.setItem('admin_token', accessToken);
    // Помечаем источник токена как «backend», чтобы отсеять любые старые/моковые
    localStorage.setItem('admin_token_source', 'backend');
    document.cookie = `admin_token=${accessToken}; path=/; max-age=2592000`;

    // Редирект после успешного входа
    if (typeof window !== 'undefined') {
      setTimeout(() => { window.location.href = '/'; }, 10);
    }

    return data;
  },

  /**
   * Sign out the current user
   */
  logout: (): void => {
    console.log('Выполняем выход из системы...');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_token_source');
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setTimeout(() => { window.location.href = '/signin'; }, 100);
  },

  /**
   * Force clear all tokens (useful when JWT secret changes)
   */
  clearTokens: (): void => {
    console.log('Очищаем все токены...');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token_source');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      // Also clear any other potential auth-related items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Все токены очищены. Перейдите на страницу входа.');
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    const localToken = localStorage.getItem('admin_token');
    if (localToken) return true;
    // опционально проверим cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'admin_token' && value) return true;
    }
    return false;
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    console.log('Запрашиваем профиль пользователя у бэкенда...');
    // Используем /api/auth/me, который возвращает UserResponse с role
    return await apiFetch<User>('/api/auth/me');
  },
};
