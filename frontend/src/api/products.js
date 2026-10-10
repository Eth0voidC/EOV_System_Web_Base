const API_URL = 'http://localhost:5000/api/products';

const fetchProducts = async (query = '') => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}${query}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load products');
  }

  return data;
};

// Every product (Inventory, Delivery, Dashboard, future Admin pages)
export const getAllProducts = () => fetchProducts();

// Active products only (Staff Product page)
export const getActiveProducts = () => fetchProducts('?status=active');

// POST /api/products (Requires Admin)
export const createProduct = async (formData) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(API_URL, {
    method: 'POST',
    // Do NOT set Content-Type; the browser sets it automatically with boundaries for FormData
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data;
};

// PUT /api/products/:id (Requires Admin)
export const updateProduct = async (id, productData) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data;
};

// DELETE /api/products/:id (Requires Admin)
export const deleteProduct = async (id) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete product');
  return data;
};
// PATCH /api/products/:id/status (Requires Admin)
export const updateProductStatus = async (id, status) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product status');
  return data;
};