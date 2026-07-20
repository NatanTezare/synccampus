import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- REQUEST: attach JWT from storage to every outgoing call ---
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('synccampus_token');
    
    if (token && config.headers) {
      // Use the modern Axios .set() method to safely assign headers
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      console.warn('⚠️ Axios Client: No token found in localStorage for this request.');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE: normalize errors, handle expired/invalid sessions globally ---
axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success: boolean; message: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';

    console.error(`❌ API Error Intercepted [${status}]:`, message);

    // Session expired or invalid token -> force back to login.
    if (status === 401) {
      localStorage.removeItem('synccampus_token');
      localStorage.removeItem('synccampus_user');
      
      if (window.location.pathname !== '/login') {
        console.log('🔄 Redirecting to login page due to 401 Unauthorized...');
        window.location.href = '/login?sessionExpired=true';
      }
    }

    return Promise.reject({ status, message });
  }
);

export default axiosClient;