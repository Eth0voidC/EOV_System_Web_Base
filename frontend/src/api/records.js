
import API_BASE_URL from './api';

const API_URL = `${API_BASE_URL}/api/records`;

export const getEmployeeRecords = async (token, employeeId) => {
  const res = await fetch(`${API_URL}/${employeeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load records');
  }

  return data; // { balance, transactions, deductions }
};