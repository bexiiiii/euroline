export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function isAuthenticated() {
  return !!getToken();
}
