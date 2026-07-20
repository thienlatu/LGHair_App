import axios from 'axios';
import { tokenService } from './tokenService';


// export const API_BASE_URL = ' https://sustained-fading-civil.ngrok-free.dev';
export const API_BASE_URL = 'https://latuthien2005-001-site1.dtempurl.com';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Thêm Access Token vào mỗi Request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý tự động Refresh Token khi gặp lỗi 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa từng thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenService.getRefreshToken();

        // Gửi refreshToken qua Body thay vì Cookie
        const refreshResponse = await axios.post(`${API_BASE_URL}/api/Account/refresh-token`, {
          RefreshToken: refreshToken
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (refreshResponse.data && refreshResponse.data.success) {
          // Lấy token mới từ BE (bạn cần sửa BE để trả về token mới trong body)
          const newAccessToken = refreshResponse.data.token || refreshResponse.data.accessToken;
          const newRefreshToken = refreshResponse.data.refreshToken;

          if (newAccessToken) {
            await tokenService.setTokens(newAccessToken, newRefreshToken || refreshToken || '');
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token cũng hết hạn -> Yêu cầu đăng nhập lại
        await tokenService.clearTokens();
        // Cập nhật AuthStore để đẩy user văng ra UI ngay lập tức
        const { useAuthStore } = require('../stores/useAuthStore');
        useAuthStore.setState({ user: null, isAuthenticated: false });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
