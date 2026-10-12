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

export const createUser = async (userData) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create account');
  }

  return data;
};

export const getUsers = async () => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}/users`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Failed to load accounts');

  return data;
};

export const updateUser = async (id, userData) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update account');
  }

  return data;
};