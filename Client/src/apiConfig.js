// Centralized API configuration for Development & Production Live Server
const getBaseUrl = () => {
    // 1. Local Development check (localhost / 127.0.0.1)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
        }
    }

    // 2. Production Live Deployment (Vercel): Always connect to the live Render Backend URL
    return 'https://aistudytimetableindicator-server-1.onrender.com';
};

const BASE_URL = getBaseUrl();

export const API_PLANNER = `${BASE_URL}/api/planner`;
export const API_AUTH = `${BASE_URL}/api/auth`;
export default BASE_URL;
