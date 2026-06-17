import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Sisipkan Token Bearer JWT ke setiap request
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Tangani error 401 (token expired / invalid)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';

    // PENTING: jangan auto-redirect untuk request login itu sendiri.
    // 401 dari /auth/login = email/password salah → biarkan halaman login
    // menampilkan pesan error. Tanpa pengecualian ini, login gagal akan
    // memicu hard-reload ke /login sebelum banner error sempat muncul
    // (gejala: "seperti refresh, balik ke login, tanpa pesan apa-apa").
    const isAuthEndpoint = url.includes('/auth/login');

    if (status === 401 && !isAuthEndpoint) {
      // Token expired/invalid di tengah sesi → bersihkan & arahkan ke login.
      useAuthStore.getState().clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
export default apiClient;
