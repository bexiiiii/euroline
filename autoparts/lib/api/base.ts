// Normalizes base API origin so we don't end up with /api/api in Request URL
// If NEXT_PUBLIC_API_URL ends with "/api" or trailing slashes — strip them.

const RAW_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function normalizeBase(url: string): string {
  let out = url.trim();
  // strip trailing slashes
  out = out.replace(/\/+$/, '');
  // strip single trailing /api
  out = out.replace(/\/api$/, '');
  return out;
}

export const API_BASE = normalizeBase(RAW_BASE);

