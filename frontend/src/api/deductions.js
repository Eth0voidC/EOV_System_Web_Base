const API_URL = 'http://localhost:5000/api/deductions';

export const getPendingDeductions = async (token, start, end) => {
    const res = await fetch(`${API_URL}/pending?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch deductions');
    return data;
};

export const processDeductions = async (token, start, end) => {
    const res = await fetch(`${API_URL}/process`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ start_date: start, end_date: end })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process deductions');
    return data;
};