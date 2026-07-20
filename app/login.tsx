import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/useAuthStore';
import ErrorModal from '../components/ui/ErrorModal';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAuthStore(state => state.login);
  const googleLogin = useAuthStore(state => state.googleLogin);
  const authError = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const validate = () => {
    let newErrors: any = {};
    if (!username.trim()) newErrors.username = 'Bắt buộc';
    if (!password) newErrors.password = 'Bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    clearError();

    const success = await login(username, password);
    
    if (!isMounted.current) return;
    
    if (success) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrors({});
    clearError();
    try {
      console.log("Bắt đầu gọi Google Sign-In (Đăng nhập)...");
      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (idToken) {
        const success = await googleLogin(idToken);
        if (!isMounted.current) return;
        
        if (success) {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
          return; // Avoid hitting finally block setIsLoading
        }
      }
    } catch (error: unknown) {
      console.log("Lỗi Google Sign-In:", error);
      if (!isMounted.current) return;
      
      let errorMsg = 'Đăng nhập bằng Google thất bại hoặc đã bị hủy.';
      if (error instanceof Error) {
        if (error.message.includes('DEVELOPER_ERROR') || error.message.includes('InvocationTargetException')) {
          errorMsg = 'Lỗi cấu hình Google Sign In (Thiếu SHA-1 hoặc WebClientId sai).';
        }
      }
      setErrors({ form: errorMsg });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  React.useEffect(() => {
    if (authError && isMounted.current) {
      setErrors(prev => ({ ...prev, form: authError }));
    }
  }, [authError]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { paddingTop: insets.top }]}>
        <Pressable onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#000" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <Text style={styles.title}>ĐĂNG NHẬP</Text>
          <Text style={styles.subtitle}>Chào mừng bạn quay lại với LG Hair.</Text>

          <ErrorModal
            visible={!!errors.form}
            title="ĐĂNG NHẬP THẤT BẠI"
            message={errors.form || ''}
            onClose={() => setErrors({ ...errors, form: undefined })}
          />

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL HOẶC SỐ ĐIỆN THOẠI *</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Nhập email hoặc số điện thoại..."
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) setErrors({ ...errors, username: undefined });
                }}
              />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MẬT KHẨU *</Text>
              <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 12 }}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#999" />
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </Pressable>

            <Pressable
              style={[styles.loginBtn, isLoading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
              )}
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={[styles.googleBtn, isLoading && { opacity: 0.8 }]} onPress={handleGoogleLogin} disabled={isLoading}>
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={{ width: 20, height: 20 }}
              />
              <Text style={styles.googleBtnText}>Đăng nhập bằng Google</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={styles.registerText}>CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  headerRow: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    justifyContent: 'center',
    marginBottom: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Inter_300Light',
    fontWeight: '300',
    color: '#111',
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_300Light',
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#888',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Inter_300Light',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#eaeaea',
    paddingHorizontal: 12,
    height: 44,
    color: '#333',
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
    height: 44,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    fontFamily: 'Inter_300Light',
    fontSize: 14,
    paddingHorizontal: 12,
    height: '100%',
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    marginTop: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontFamily: 'Inter_300Light',
    fontSize: 12,
    color: '#666',
  },
  loginBtn: {
    backgroundColor: '#000',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#fff',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eaeaea',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#999',
    fontSize: 11,
    fontFamily: 'Inter_300Light',
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
    backgroundColor: '#fff',
  },
  googleBtnText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter_300Light',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  registerText: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
