import axios from 'axios';

const client = axios.create({
    baseURL: '/api',
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('luma_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('luma_token');
            localStorage.removeItem('luma_user');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default client;
