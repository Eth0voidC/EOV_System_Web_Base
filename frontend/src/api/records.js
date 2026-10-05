const API_URL = 'http://localhost:5000/api/records';

export const getEmployeeRecords = async (token, employeeId) => {
  const res = await fetch(`${API_URL}/${employeeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load records');
  }

  return data; // { balance, transactions: [{ id, date, status, items: [{ name, qty, price }] }], deductions: [] }
};