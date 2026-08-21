import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useDataStore } from '../stores/useDataStore';

export function useAppLifecycle() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        NetInfo.fetch().then(state => {
          if (state.isConnected && state.isInternetReachable) {
            console.log('[AppLifecycle] Foreground active & Network online -> Revalidating...');
            useDataStore.getState().loadServices();
          }
        });
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
