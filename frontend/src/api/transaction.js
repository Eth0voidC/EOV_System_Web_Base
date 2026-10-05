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