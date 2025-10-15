import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const isBrowser = typeof window !== 'undefined';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Kiểm tra thuộc tính token trong localStorage và thêm vào header nếu có
apiClient.interceptors.request.use(
  (config) => {
    if (isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
    // Nếu lỗi là 401 Unauthorized, chuyển hướng người dùng đến trang đăng nhập
    if (isBrowser && error.response && error.response.status === 401) {
      // Xóa token và chuyển hướng đến trang đăng nhập
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;