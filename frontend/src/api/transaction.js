const API_URL = 'http://localhost:5000/api/transactions';

export const createTransaction = async (token, employeeId, items) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ employee_id: employeeId, items }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit transaction');
  }

  return data;
};

export const getTodayTransactions = async (token) => {
  const res = await fetch(`${API_URL}/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to load today's transactions");
  }

  return data;
};