const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1/finance-vault';

export const fetchOpportunities = async (queryParams = {}) => {
    const params = new URLSearchParams(queryParams);
    const response = await fetch(`${API_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch opportunities');
    return await response.json();
};

export const fetchMarqueeOpportunities = async () => {
    const response = await fetch(`${API_URL}/marquee`);
    if (!response.ok) throw new Error('Failed to fetch marquee opportunities');
    return await response.json();
};

export const createOpportunity = async (data) => {
    const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create opportunity');
    return await response.json();
};

export const updateOpportunity = async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update opportunity');
    return await response.json();
};

export const deleteOpportunity = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete opportunity');
    return await response.json();
};
