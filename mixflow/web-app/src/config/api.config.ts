/**
 * API Configuration
 * Handles API base URL for different environments
 */

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // In production, use environment variable or default to production backend
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://mixflow-backend.onrender.com';
  }

  // In development, use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3334';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_ENDPOINT = `${API_BASE_URL}/api`;

/**
 * Helper function to get full URL for uploads/static files
 */
export const getAssetUrl = (path: string): string => {
  if (!path) return '';

  // If path already includes http/https, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${path}`;
};

/**
 * Helper function to get stream URL for a track
 */
export const getStreamUrl = (trackId: string): string => {
  return `${API_ENDPOINT}/tracks/${trackId}/stream`;
};
