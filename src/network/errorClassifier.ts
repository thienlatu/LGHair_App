import { AxiosError } from 'axios';
import NetInfo from '@react-native-community/netinfo';

export enum ErrorType {
  OFFLINE_BEFORE_SEND = 'OFFLINE_BEFORE_SEND',
  TIMEOUT = 'TIMEOUT',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  ABORTED = 'ABORTED',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
}

export async function classifyError(error: any): Promise<AppError> {
  // Bỏ NetInfo.fetch() vì trên Emulator/Thiết bị mạng yếu nó sẽ block thread rất lâu gây lag
  // 1. Lỗi hủy request từ AbortController
  if (error.name === 'CanceledError' || error.message === 'canceled') {
    return {
      type: ErrorType.ABORTED,
      message: 'Yêu cầu bị huỷ bỏ.',
      originalError: error
    };
  }

  // 3. Xử lý lỗi mạng và timeout (chỉ giữ lại lỗi liên quan đến kết nối)
  if (error.isAxiosError) {
    const axiosError = error as AxiosError<any>;

    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT,
        message: 'Không thể nhận phản hồi từ máy chủ.',
        originalError: error
      };
    }

    if (!axiosError.response) {
      return {
        type: ErrorType.NETWORK_FAILURE,
        message: 'Kết nối bị gián đoạn.',
        originalError: error
      };
    }
  }

  // Mặc định, nếu không phải lỗi mạng thì để nguyên (hoặc Unknown cho NetworkManager)
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Có lỗi không xác định xảy ra.',
    originalError: error
  };
}
