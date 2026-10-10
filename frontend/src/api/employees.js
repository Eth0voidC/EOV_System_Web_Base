import API_BASE_URL from './api';

const API_URL = `${API_BASE_URL}/api/employees`;

export const getAllEmployees = async (token) => {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load employees');
  }

  return data; // array of employee records
};