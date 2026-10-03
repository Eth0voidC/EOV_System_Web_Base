const API_URL = 'http://localhost:5000/api/products';

export const getAllProducts = async () => {
  const token = localStorage.getItem('token');

  const res = await fetch(API_URL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load products');
  }

  return data; // array of { product_item_id, product_name, price, stock_quantity, category_name, image }
};