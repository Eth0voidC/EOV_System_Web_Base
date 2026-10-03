const API_URL = 'http://localhost:5000/api/employees';

export const getAllEmployees = async (token) => {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load employees');
  }

  return data; // array of { employee_id, employee_code, last_name, first_name, employment_status, account_status }
};