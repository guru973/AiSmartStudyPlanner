// Centralized API configuration for Development & Production Live Server
const getBaseUrl = () => {
    let url = (import.meta.env.VITE_API_URL || '').trim();

    // In a browser environment, automatically detect if we're on a live production domain (e.g. Vercel)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

        // If on live production and URL is either missing or pointing to localhost, fallback to Render backend
        if (!isLocal && (!url || url.includes('localhost') || url.includes('127.0.0.1'))) {
            url = 'https://aistudytimetableindicator-server-1.onrender.com';
        }
    }

    // Default to localhost for local dev if still unspecified
    if (!url) {
        url = 'http://localhost:5000';
    }

    // Strip trailing slashes
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
