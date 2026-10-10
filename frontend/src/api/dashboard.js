
const API_URL = 'http://localhost:5000/api/dashboard';

export const getDashboardAnalytics = async (token, year, month) => {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });

  const res = await fetch(`${API_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load dashboard data');
  }

  return data;
};