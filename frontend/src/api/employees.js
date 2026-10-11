// import API_BASE_URL from './api';

// const API_URL = `${API_BASE_URL}/api/employees`;

// export const getAllEmployees = async (token) => {
//   const res = await fetch(API_URL, {
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   const data = await res.json();

//   if (!res.ok) {
//     throw new Error(data.error || 'Failed to load employees');
//   }

//   return data; // array of employee records
// };


import API_BASE_URL from './api';

const API_URL = `${API_BASE_URL}/api/employees`;

// GET: Retrieve all employees.
export const getAllEmployees = async (token) => {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load employees');
  }

  return data;
};

// POST: Register a new employee.
export const createEmployee = async (employee, token) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(employee),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to register employee');
  }

  return data;
};

// PUT: Update an existing employee.
export const updateEmployee = async (employeeId, employee, token) => {
  const res = await fetch(`${API_URL}/${employeeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(employee),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update employee');
  }

  return data;
};