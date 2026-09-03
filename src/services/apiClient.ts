import axios from 'axios';
import { tokenService } from './tokenService';
import { Alert } from 'react-native';
import { classifyError, ErrorType } from '../network/errorClassifier';
import { CustomAxiosRequestConfig, shouldRetry, getBackoffDelay, sleep } from '../network/retryPolicy';

export const API_BASE_URL = 'https://lghairapi.online';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const apiClientCallback = {
  onSessionExpired: () => { },
};

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenService.getRefreshToken();

        // Gửi refreshToken qua Body thay vì Cookie
        const refreshResponse = await axios.post(`${API_BASE_URL}/api/Account/refresh-token`, {
          RefreshToken: refreshToken
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (refreshResponse.data && refreshResponse.data.success) {
          const newAccessToken = refreshResponse.data.token || refreshResponse.data.accessToken;
          const newRefreshToken = refreshResponse.data.refreshToken;

          if (newAccessToken) {
            await tokenService.setTokens(newAccessToken, newRefreshToken || refreshToken || '');
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return apiClient(originalRequest);
          }
        }

        throw new Error('No access token returned');
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenService.clearTokens();

        // Gọi callback thay vì require trực tiếp để tránh circular dependency
        apiClientCallback.onSessionExpired();

        Alert.alert(
          "Phiên đăng nhập hết hạn",
          "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng.",
          [{ text: "Đăng nhập lại", style: "default" }]
        );
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu gặp lỗi khác (ví dụ: Timeout, Network Failure), xét xem có nên Retry (chỉ cho GET) không
    const config = error.config as CustomAxiosRequestConfig;
    if (config && (await shouldRetry(error, config))) {
      config.retryCount = (config.retryCount || 0) + 1;
      const delay = getBackoffDelay(config.retryCount);
      
      console.log(`[API Retry] Attempt ${config.retryCount} for ${config.url} in ${delay}ms...`);
      await sleep(delay);
      
      return apiClient(config);
    }

    // Nếu không phải 401 hoặc refresh thất bại, hoặc không được retry, classify lỗi chuẩn hóa
    const classifiedError = await classifyError(error);
    error.appError = classifiedError; // Đính kèm appError vào original error để các component khác có thể dùng nếu cần
    return Promise.reject(error); // Vẫn reject original error để giữ nguyên tính chất isAxiosError
  }
);

export default apiClient;
