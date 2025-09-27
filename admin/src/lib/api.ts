export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token: string | null | undefined;

  if (typeof window !== 'undefined') {
    // 1) Берём токен из localStorage (или из cookie, если нужен такой вариант)
    token = localStorage.getItem('admin_token');

    if (!token) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'admin_token') {
          token = value;
          break;
        }
      }
    }
  }

  // Не отправляем заведомо невалидный JWT (не 3 части). Если он найден — очистим локально.
  if (typeof window !== 'undefined' && token && token.split('.').length !== 3) {
    try {
      console.warn('Невалидный формат токена найден — очищаем и не отправляем Authorization');
      localStorage.removeItem('admin_token');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch {}
    token = undefined;
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = new Headers(options.headers || {});
  if (!isFormData) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  console.log(`API запрос к ${path}:`, { 
    hasToken: !!token,
    method: options.method || 'GET',
    url: `${API_URL}${path}`
  });
  if (token) {
    try { console.log('Authorization preview:', (token as string).slice(0, 16) + '...'); } catch {}
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // оставь, если используешь cookie для чего-то ещё
    });

    console.log(`Ответ от ${path}:`, {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });

    // Авторизация: при 401 очищаем токен и кидаем ошибку
    // При 403 не выходим из аккаунта (может быть недостаточно прав на эндпоинт)
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('admin_token');
          document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          console.warn('Получен 401 — токен очищен. Требуется повторный вход.');
        } catch {}
      }
      throw new ApiError('Не авторизован', res.status);
    }
    if (res.status === 403) {
      // Не очищаем токен; возвращаем явную ошибку Forbidden
      throw new ApiError('Доступ запрещён', 403);
    }

    if (!res.ok) {
      let errorMessage = `Ошибка запроса: ${res.status}`;
      let errorData: any;
      let rawText = '';

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await res.json();
          if (errorData?.message) errorMessage = errorData.message;
          else if (errorData?.error) errorMessage = errorData.error;
        } catch {
          const text = await res.text();
          rawText = text;
          if (text) errorMessage = text;
        }
      } else {
        const text = await res.text();
        rawText = text;
        if (text) errorMessage = text;
      }

      // Если на бэке упала проверка подписи JWT (SignatureException, jjwt), очищаем токен и просим перелогиниться
      const signatureError = (res.status === 500) && (
        errorMessage.includes('JWT') || rawText.includes('JWT') ||
        errorMessage.includes('SignatureException') || rawText.includes('SignatureException') ||
        errorMessage.includes('io.jsonwebtoken') || rawText.includes('io.jsonwebtoken')
      );
      if (signatureError && typeof window !== 'undefined') {
        try {
          console.warn('Ошибка подписи JWT на сервере — очищаем токен и требуем повторный вход');
          localStorage.removeItem('admin_token');
          document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        } catch {}
        throw new ApiError('Не авторизован', 401);
      }

      throw new ApiError(errorMessage, res.status, errorData);
    }

    if (res.status === 204) {
      return {} as T;
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    // если сервер вернул что-то иное, пусть будет текст
    return (await res.text()) as unknown as T;

  } catch (error) {
    console.error('Ошибка при выполнении запроса к API:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';

    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('CORS') ||
      msg.includes('blocked by CORS policy')
    ) {
      throw new ApiError('Сетевая или CORS-ошибка', 0);
    }

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(msg, 0);
  }
}
