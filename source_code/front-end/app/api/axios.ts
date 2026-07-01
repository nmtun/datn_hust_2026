import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const isBrowser = typeof window !== 'undefined';

const getStoredToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem('token') ?? sessionStorage.getItem('token');
};

const clearStoredAuth = () => {
  if (!isBrowser) return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Đọc token từ localStorage/sessionStorage và thêm vào header nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý lỗi phản hồi từ server
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest =
      error.config?.url?.includes("/api/user/login");

    if (
      isBrowser &&
      error.response?.status === 401 &&
      !isLoginRequest
    ) {
      clearStoredAuth();
      window.location.href = "/auth/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;