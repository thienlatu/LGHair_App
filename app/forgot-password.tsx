import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import apiClient from '../src/services/apiClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import ErrorModal from '../components/ui/ErrorModal';
import { ActivityIndicator } from 'react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async () => {
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    setIsLoading(true); setError('');
    try {
      const res = await apiClient.post('/api/Account/send-otp', `"${email}"`, {
          headers: { 'Content-Type': 'application/json' }
      });
      if (res.data.success) {
        setStep(2);
        setSuccess('Đã gửi mã OTP vào email của bạn!');
      }
    } catch (err: any) {
      let errorMsg = err.response?.data?.message || 'Không thể gửi mã xác nhận';
      // Làm gọn các lỗi kỹ thuật từ Server trả về để UI không bị vỡ hoặc xấu
      if (errorMsg.includes('535') || errorMsg.includes('BadCredentials') || errorMsg.includes('smtp')) {
        errorMsg = 'Hệ thống gửi Email đang tạm bảo trì (Lỗi Server). Vui lòng dùng tính năng Xác minh bằng Google!';
      }
      setError(errorMsg);
    }
    setIsLoading(false);
  };

  const handleGoogleVerify = async () => {
    setIsLoading(true); setError('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken ;
      if (idToken) {
        const res = await apiClient.post('/api/Account/forgot-password-google', { Credential: idToken });
        if (res.data.success) {
          setEmail(res.data.email);
          setIsGoogleVerified(true);
          setStep(2);
          setSuccess('Xác minh Google thành công!');
        }
      }
    } catch (err: any) {
      setError('Xác minh Google thất bại hoặc đã bị hủy.');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!isGoogleVerified && !otp.trim()) { setError('Vui lòng nhập mã OTP'); return; }
    if (!newPassword || newPassword.length < 6) { setError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu không khớp'); return; }

    setIsLoading(true); setError('');
    try {
      const res = await apiClient.post('/api/Account/reset-password', {
        Email: email,
        OTP: otp,
        NewPassword: newPassword
      });
      if (res.data.success) {
        setSuccess('Đổi mật khẩu thành công! Chuyển hướng về đăng nhập...');
        setTimeout(() => router.replace('/login'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
    setIsLoading(false);
  };

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
            <Text style={styles.title}>KHÔI PHỤC MẬT KHẨU</Text>
            <Text style={styles.subtitle}>Nhập email để nhận mã xác nhận (OTP)</Text>

            <ErrorModal 
              visible={!!error} 
              title="THẤT BẠI" 
              message={error} 
              onClose={() => setError('')} 
            />
            <ErrorModal 
              visible={!!success} 
              title="THÔNG BÁO" 
              message={success} 
              onClose={() => setSuccess('')} 
            />

            {step === 1 ? (
              <>
                <View style={{ width: '100%' }}>
                  <Pressable style={[styles.googleBtn, isLoading && {opacity:0.8}]} onPress={handleGoogleVerify} disabled={isLoading}>
                    <Image 
                      source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }} 
                      style={{ width: 18, height: 18, marginRight: 10 }} 
                    />
                    <Text style={styles.googleBtnText}>Xác minh bằng Google</Text>
                  </Pressable>
                </View>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>HOẶC DÙNG EMAIL</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>EMAIL CỦA BẠN</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập email đã đăng ký..."
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <Pressable style={[styles.submitBtn, isLoading && {opacity:0.8}]} onPress={handleSendOtp} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>GỬI MÃ XÁC NHẬN</Text>}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.form}>
                  {!isGoogleVerified && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>MÃ XÁC NHẬN OTP</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nhập mã 6 số từ email..."
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={setOtp}
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>MẬT KHẨU MỚI</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập mật khẩu mới..."
                      placeholderTextColor="#999"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập lại mật khẩu mới..."
                      placeholderTextColor="#999"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>

                  <Pressable style={[styles.submitBtn, isLoading && {opacity:0.8}]} onPress={handleResetPassword} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ĐẶT LẠI MẬT KHẨU</Text>}
                  </Pressable>
                </View>
              </>
            )}
            
            <View style={styles.footer}>
              <Pressable onPress={() => router.back()}>
                <Text style={styles.footerText}>QUAY LẠI ĐĂNG NHẬP</Text>
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
    backgroundColor: '#fff',
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_300Light',
    fontWeight: '300',
    color: '#111',
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'Inter_300Light',
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  socialLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#888',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#eaeaea',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  googleBtnText: {
    fontFamily: 'Inter_300Light',
    fontSize: 14,
    color: '#333',
  },
  facebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: '#1877F2',
  },
  facebookBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
    color: '#fff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  divider: { flex: 1, height: 1, backgroundColor: '#eaeaea' },
  dividerText: {
    color: '#999',
    paddingHorizontal: 12,
    fontFamily: 'Inter_300Light',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
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
  submitBtn: {
    backgroundColor: '#000',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#fff',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
