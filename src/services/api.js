const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  const headers = {
    ...options.headers,
  };
  
  // Set Content-Type for requests with a body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  const config = {
    ...options,
    headers,
    credentials: 'include', // Required for httpOnly auth cookies
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export { BASE_URL };
