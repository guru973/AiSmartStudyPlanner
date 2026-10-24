// Centralized API configuration for Development & Production Live Server
const getBaseUrl = () => {
    let url = (import.meta.env.VITE_API_URL || '').trim();
    // Strip trailing slashes (e.g. 'http://localhost:5000/' -> 'http://localhost:5000')
    url = url.replace(/\/+$/, '');
    // If user accidentally included '/api' at the end, strip it to avoid duplicate '/api/api/...'
    if (url.endsWith('/api')) {
        url = url.slice(0, -4);
    }
    return url;
};

const BASE_URL = getBaseUrl();

export const API_PLANNER = `${BASE_URL}/api/planner`;
export const API_AUTH = `${BASE_URL}/api/auth`;
export default BASE_URL;

