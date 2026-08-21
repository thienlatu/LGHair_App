import { API_BASE_URL } from '../services/apiClient';

export const getImageUrl = (path?: any): string => {
  if (!path || typeof path !== 'string') return '';
  
  // Convert any backslashes to forward slashes
  const normalizedPath = path.replace(/\\/g, '/');
  
  // If it's already a full HTTP url, just encode it
  if (normalizedPath.startsWith('http')) return encodeURI(normalizedPath);
  
  // Ensure the path starts with a forward slash
  const safePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  // Concatenate with API_BASE_URL and encode URI
  return `${API_BASE_URL}${encodeURI(safePath)}`;
};
