console.log('Testing API URL construction...');

// Тестируем как формируются URL в разных API файлах
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://euroline.1edu.kz').replace(/\/+$/, '');
console.log('API_BASE:', API_BASE);

const BASE_URL = `${API_BASE}/api`;
console.log('BASE_URL:', BASE_URL);

const endpoint = '/v1/cat/catalogs';
const finalUrl = `${BASE_URL}${endpoint}`;
console.log('Final URL:', finalUrl);

// Также протестируем другие API файлы
const AUTH_API_BASE = `${API_BASE}/api`;
console.log('AUTH_API_BASE:', AUTH_API_BASE);

const authEndpoint = '/auth/login';
const authUrl = `${AUTH_API_BASE}${authEndpoint}`;
console.log('Auth URL:', authUrl);
