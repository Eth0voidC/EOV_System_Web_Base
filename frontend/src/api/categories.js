const API_URL = 'http://localhost:5000/api/categories';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const parse = async (res, fallback) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || fallback);
    err.status = res.status;
    throw err;
  }
  return data;
};

export const getAllCategories = async () => {
  const res = await fetch(API_URL, { headers: authHeaders() });
  return parse(res, 'Failed to load categories'); // [{ product_category_id, category_name }]
};

export const createCategory = async (categoryName) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ category_name: categoryName }),
  });
  return parse(res, 'Failed to add category'); // { product_category_id, category_name }
};