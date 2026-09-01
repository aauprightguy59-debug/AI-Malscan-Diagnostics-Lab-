/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dynamically determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // Check if we're in production or development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Local development
    return 'http://localhost:3000';
  }
  
  // Check for GitHub Pages deployment (frontend only, fallback mode)
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    console.warn('GitHub Pages detected. Using fallback local diagnostic engine only.');
    return null; // null signals to use fallback mode
  }
  
  // Check for custom backend URL from environment or localStorage
  const customBackend = typeof window !== 'undefined' ? localStorage.getItem('api_backend_url') : null;
  if (customBackend) {
    return customBackend;
  }
  
  // Default to Render.com deployed backend (replace with your actual URL after deployment)
  return 'https://ai-malscan-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Wrapper for fetch with automatic fallback and error handling
 */
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!API_BASE_URL) {
    return {
      ok: false,
      error: 'Backend not configured. Using local diagnostic engine fallback.'
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        error: `API Error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json() as T;
    return { ok: true, data };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`API call to ${endpoint} failed:`, errorMsg);
    return {
      ok: false,
      error: `Network error: ${errorMsg}`
    };
  }
}

/**
 * Set a custom backend URL (for runtime configuration)
 */
export function setCustomBackendUrl(url: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('api_backend_url', url);
    window.location.reload();
  }
}
