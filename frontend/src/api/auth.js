import API_BASE_URL from './api';

const API_URL = `${API_BASE_URL}/api/auth`;

export const loginUser = async (username, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data; // { id, username, role, token, message }
};