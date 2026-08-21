import { AxiosError, AxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { classifyError, ErrorType } from './errorClassifier';

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  retryable?: boolean;
  retryCount?: number;
}

const MAX_RETRIES = 3;

export function getBackoffDelay(retryCount: number): number {
  const baseDelay = 500 * Math.pow(2, retryCount - 1);
  const jitter = Math.floor(Math.random() * 250); 
  return baseDelay + jitter;
}

export async function shouldRetry(error: AxiosError, config: CustomAxiosRequestConfig): Promise<boolean> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected || netState.isInternetReachable === false) {
    return false;
  }

  const currentRetryCount = config.retryCount || 0;
  if (currentRetryCount >= MAX_RETRIES) {
    return false;
  }

  const method = config.method?.toUpperCase();
  const isGet = method === 'GET';
  const isRetryableExplicit = config.retryable === true;
  
  if (!isGet && !isRetryableExplicit) {
    return false;
  }

  const appError = await classifyError(error);

  if (appError.type === ErrorType.NETWORK_FAILURE || appError.type === ErrorType.TIMEOUT) {
    return true;
  }

  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
