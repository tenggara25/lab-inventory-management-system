import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface FetchOptions extends RequestInit {
  isFormData?: boolean;
  params?: URLSearchParams | string;
}

export async function api(endpoint: string, options: FetchOptions = {}) {
  const token = Cookies.get('token');
  const headers: HeadersInit = {};
  const { params, isFormData, headers: optionHeaders, ...fetchOptions } = options;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const queryString = typeof params === 'string' ? params : params.toString();
    url += endpoint.includes('?') ? `&${queryString}` : `?${queryString}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers: { ...headers, ...optionHeaders },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || 'An error occurred');
  }

  return data;
}
