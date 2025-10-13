const DEFAULT_API_URL = "https://euroline.1edu.kz";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
const API_DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_API === "true";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

type ApiFetchOptions = RequestInit & {
  parseAs?: 'json' | 'text' | 'blob';
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { parseAs = 'json', ...requestInit } = options;
  let token: string | null | undefined;

  const redirectToLogin = () => {
    if (typeof window === 'undefined') return;
    try {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/signin')) {
        window.location.href = '/signin';
      }
    } catch {
      // ignore navigation errors
    }
  };

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

  const isFormData = typeof FormData !== 'undefined' && requestInit.body instanceof FormData;
  const isUrlEncoded =
    typeof URLSearchParams !== 'undefined' && requestInit.body instanceof URLSearchParams;
  const headers = new Headers(requestInit.headers || {});
  if (!isFormData && !isUrlEncoded && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const extractMessage = (data: unknown): string | undefined => {
    if (typeof data !== 'object' || data === null) {
      return undefined;
    }
    const record = data as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string') {
      return message;
    }
    const errorText = record.error;
    if (typeof errorText === 'string') {
      return errorText;
    }
    return undefined;
  };

  if (API_DEBUG_ENABLED) {
    console.log(`API запрос к ${path}:`, {
      hasToken: !!token,
      method: options.method || 'GET',
      url: `${API_URL}${path}`,
    });
    if (token) {
      try {
        console.log("Authorization preview:", (token as string).slice(0, 16) + "...");
      } catch {}
    }
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...requestInit,
      headers,
      credentials: 'include', // оставь, если используешь cookie для чего-то ещё
    });

    if (API_DEBUG_ENABLED) {
      console.log(`Ответ от ${path}:`, {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });
    }

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
      redirectToLogin();
      throw new ApiError('Не авторизован', res.status);
    }
    if (res.status === 403) {
      // Check if this is a JWT signature mismatch (token signed with old key)
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = (await res.clone().json()) as unknown;
          const errorMsg = extractMessage(errorData) ?? '';
          if (errorMsg.includes('JWT signature does not match') || errorMsg.includes('signature')) {
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('admin_token');
                document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                console.warn('JWT signature mismatch — токен очищен. Требуется повторный вход.');
              } catch {}
            }
            redirectToLogin();
            throw new ApiError('Не авторизован', 401);
          }
        } catch {
          // If we can't parse JSON, continue with regular 403 handling
        }
      }
      // Regular 403 - insufficient permissions, don't clear token
      throw new ApiError('Доступ запрещён', 403);
    }

    if (!res.ok) {
      let errorMessage = `Ошибка запроса: ${res.status}`;
      let errorData: unknown;
      let rawText = '';

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await res.json();
          const extracted = extractMessage(errorData);
          if (extracted) {
            errorMessage = extracted;
          }
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
        redirectToLogin();
        throw new ApiError('Не авторизован', 401);
      }

      throw new ApiError(errorMessage, res.status, errorData);
    }

    if (res.status === 204) {
      return {} as T;
    }

    if (parseAs === 'blob') {
      return (await res.blob()) as unknown as T;
    }

    if (parseAs === 'text') {
      return (await res.text()) as unknown as T;
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
