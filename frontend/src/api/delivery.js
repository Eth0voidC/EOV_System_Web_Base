const API_URL = 'http://localhost:5000/api/deliveries';

export const createDelivery = async (token, items) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit delivery');
  }

  return data;
};