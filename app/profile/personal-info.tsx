import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { useAuthStore } from '../../src/stores/useAuthStore';
import PrimaryButton from '../../components/PrimaryButton';
import { userApi } from '../../src/services/userApi';
import axios from 'axios';
import { useHeaderHeight } from '@react-navigation/elements';

export default function PersonalInfoScreen() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.hoTen || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.sdt || '');
  const [gender, setGender] = useState(user?.gioiTinh || 'Nam');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  
  const isMounted = useRef(true);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const validate = () => {
    let newErrors: any = {};
    if (!name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!emailRegex.test(email)) newErrors.email = 'Email không hợp lệ';

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!phoneRegex.test(phone)) newErrors.phone = 'Số điện thoại không hợp lệ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await userApi.updateProfile({
        hoTen: name.trim(),
        email: email.trim(),
        sdt: phone.trim(),
        gioiTinh: gender
      });

      if (res.success && isMounted.current) {
        updateProfile({
          hoTen: name.trim(),
          email: email.trim(),
          sdt: phone.trim(),
          gioiTinh: gender
        });
        Alert.alert('Thành công', 'Cập nhật thông tin cá nhân thành công');
      }
    } catch (error: unknown) {
      if (!isMounted.current) return;
      if (axios.isAxiosError(error)) {
        Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
      } else {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            {user?.hinhAnh ? (
              <Image source={{ uri: user.hinhAnh }} style={{ width: 100, height: 100, borderRadius: 50 }} contentFit="cover" />
            ) : (
              <Feather name="user" size={40} color={Colors.light.text} />
            )}
            <Pressable style={styles.editAvatarBtn}>
              <Feather name="camera" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="Nhập họ và tên"
            placeholderTextColor={Colors.light.subText}
            editable={!isLoading}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
            }}
            placeholder="Nhập địa chỉ email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors.light.subText}
            editable={!isLoading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, errors.phone ? styles.inputError : null]}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
            }}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.light.subText}
            editable={!isLoading}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderContainer}>
            {['Nam', 'Nữ', 'Khác'].map((g) => (
              <Pressable
                key={g}
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                onPress={() => setGender(g)}
                disabled={isLoading}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton
          title={isLoading ? "ĐANG CẬP NHẬT..." : "CẬP NHẬT THÔNG TIN"}
          onPress={handleUpdate}
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
          disabled={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.xxl,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  formGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    ...Theme.typography.subtitle,
    color: Colors.light.text,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
    ...Theme.typography.body,
    color: Colors.light.text,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_300Light',
  },
  submitBtn: {
    marginTop: Theme.spacing.xl,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  genderBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderBtnActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  genderText: {
    ...Theme.typography.body,
    color: Colors.light.text,
  },
  genderTextActive: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  }
});
