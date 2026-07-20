import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/useAuthStore';
import ErrorModal from '../components/ui/ErrorModal';
import apiClient from '../src/services/apiClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const register = useAuthStore(state => state.register);
  const googleLogin = useAuthStore(state => state.googleLogin);
  const authError = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; password?: string; confirmPassword?: string; terms?: string; otp?: string; form?: string; success?: string }>({});

  const validate = () => {
    let newErrors: any = {};
    if (!name.trim()) newErrors.name = 'Bắt buộc';
    if (!phone.trim()) newErrors.phone = 'Bắt buộc';
    if (!password) newErrors.password = 'Bắt buộc';
    else if (password.length < 6) newErrors.password = 'Ít nhất 6 ký tự';

    if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';
    if (!termsAccepted) newErrors.terms = 'Vui lòng đồng ý điều khoản';

    if (email.trim() && otpSent && !otp.trim()) {
      newErrors.otp = 'Vui lòng nhập mã OTP từ email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    clearError();

    // Nếu có email nhưng chưa gửi OTP
    if (email.trim() && !otpSent) {
      try {
        const response = await apiClient.post('/api/Account/send-register-otp', `"${email}"`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.data.success) {
          setOtpSent(true);
          setErrors({ success: 'Đã gửi mã OTP vào email của bạn. Vui lòng kiểm tra hộp thư!' });
        }
      } catch (error: any) {
        setErrors({ form: error.response?.data?.message || 'Không thể gửi mã xác nhận' });
      }
      setIsLoading(false);
      return;
    }

    // Đăng ký chính thức (có hoặc không có OTP)
    const success = await register(name, phone, email, password, otp);

    setIsLoading(false);

    if (success) {
      router.replace('/profile');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      console.log("Bắt đầu gọi Google Sign-In (Đăng ký)...");
      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (idToken) {
        setIsLoading(true);
        const success = await googleLogin(idToken);
        if (success) {
          router.replace('/');
        }
      }
    } catch (error: any) {
      console.log("Lỗi Google Sign-In:", error);
      setErrors({ form: 'Đăng ký bằng Google thất bại hoặc đã bị hủy.' });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (authError) {
      setErrors(prev => ({ ...prev, form: authError }));
    }
  }, [authError]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#000" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>TẠO TÀI KHOẢN</Text>
            <Text style={styles.subtitle}>Đăng ký để đặt lịch hẹn và mua sắm dễ dàng hơn.</Text>

            <ErrorModal
              visible={!!errors.form}
              title="ĐĂNG KÝ THẤT BẠI"
              message={errors.form || ''}
              onClose={() => setErrors({ ...errors, form: undefined })}
            />
            <ErrorModal
              visible={!!errors.success}
              title="THÔNG BÁO"
              message={errors.success || ''}
              onClose={() => setErrors({ ...errors, success: undefined })}
            />

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>HỌ VÀ TÊN *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Nhập họ và tên của bạn..."
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>SỐ ĐIỆN THOẠI *</Text>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                  />
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>EMAIL (TUỲ CHỌN)</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Nhập email..."
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    editable={!otpSent} // Khóa lại không cho sửa sau khi đã gửi OTP
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>
              </View>

              {otpSent && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>MÃ XÁC NHẬN OTP *</Text>
                  <TextInput
                    style={[styles.input, errors.otp && styles.inputError]}
                    placeholder="Nhập mã 6 số từ email..."
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (errors.otp) setErrors({ ...errors, otp: undefined });
                    }}
                  />
                  {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
                </View>
              )}

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
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
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>XÁC NHẬN MẬT KHẨU *</Text>
                  <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                      }}
                    />
                  </View>
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>
              </View>

              <Pressable
                style={styles.checkboxRow}
                onPress={() => {
                  setTermsAccepted(!termsAccepted);
                  if (errors.terms) setErrors({ ...errors, terms: undefined });
                }}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkboxText}>Tôi đồng ý với các điều khoản dịch vụ</Text>
              </Pressable>
              {errors.terms && <Text style={[styles.errorText, { marginTop: -10, marginBottom: 20 }]}>{errors.terms}</Text>}

              <Pressable
                style={[styles.registerBtn, isLoading && { opacity: 0.8 }]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerBtnText}>
                    {(email.trim() && !otpSent) ? "GỬI MÃ XÁC NHẬN" : "TẠO TÀI KHOẢN"}
                  </Text>
                )}
              </Pressable>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>HOẶC</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable style={[styles.googleBtn, isLoading && { opacity: 0.8 }]} onPress={handleGoogleRegister} disabled={isLoading}>
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={{ width: 20, height: 20 }}
                />
                <Text style={styles.googleBtnText}>Đăng ký bằng Google</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Pressable onPress={() => router.back()}>
                <Text style={styles.loginText}>ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    flex: 1,
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
    marginBottom: 20,
  },
  formContainer: { width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 0,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 2,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkboxText: {
    fontFamily: 'Inter_300Light',
    fontSize: 12,
    color: '#666',
  },
  registerBtn: {
    backgroundColor: '#000',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  registerBtnText: {
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
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loginText: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
