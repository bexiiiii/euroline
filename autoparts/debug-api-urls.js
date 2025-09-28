console.log('Testing API URL construction...');

// Тестируем как формируются URL в разных API файлах
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
console.log('API_BASE:', API_BASE);

const BASE_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}`;
console.log('BASE_URL:', BASE_URL);

const endpoint = '/api/v1/cat/catalogs';
const finalUrl = `${BASE_URL}${endpoint}`;
console.log('Final URL:', finalUrl);

// Также протестируем другие API файлы
const AUTH_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/';
console.log('AUTH_API_BASE:', AUTH_API_BASE);

const authEndpoint = '/v1/auth/login';
const authUrl = `${AUTH_API_BASE}${authEndpoint}`;
console.log('Auth URL:', authUrl);
