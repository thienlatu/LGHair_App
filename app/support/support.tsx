import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Image,
  ScrollView,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

import { useAuthStore } from '../../src/stores/useAuthStore';
import { db } from '../../src/firebase/config';
import { createRoomAPI, sendMessageToRoomAPI, updateTypingStatus } from '../../src/services/chatService';
import { Message, SenderRole } from '../../src/types/chatTypes';
import { Theme } from '../../constants/Theme';
import { Colors } from '../../constants/Colors';

// Lọc từ ngữ thô tục (Profanity filter)
const containsProfanity = (text: string): boolean => {
  const badSubstrings = ['đm', 'dkm', 'đkm', 'đéo', 'cặc', 'lồn', 'địt', 'chịch', 'óc chó', 'chó đẻ', 'mẹ mày', 'bố mày', 'con đĩ', 'thằng chó', 'đĩ chó', 'đồ ngu', 'khốn nạn', 'mất dạy', 'vãi lồn', 'vãi cặc', 'vcl', 'vkl', 'clm', 'súc vật', 'đầu khấc', 'bú cu', 'đút đít', 'cak', 'cax', 'đjt', 'djt', 'mgu'];
  const cleanText = text.toLowerCase().replace(/\s+/g, '');
  for (const word of badSubstrings) {
    if (cleanText.includes(word.replace(/\s+/g, ''))) return true;
  }
  const badWords = ['ngu', 'nguu', 'nguuu', 'nguuuu', 'chó', 'choa', 'đĩ', 'cac', 'cl', 'cút'];
  const words = text.toLowerCase().split(/[\s,.\-!?_]+/);
  for (const w of words) {
    if (badWords.includes(w)) return true;
  }
  return false;
};

// Colors matching Shopee theme
const SHOPEE_ORANGE = '#EE4D2D';
const BG_COLOR = '#F5F5F5';

const QUICK_REPLIES = [
  'Kiểm tra đơn hàng',
  'Lỗi đăng nhập/đăng xuất',
  'Hướng dẫn thanh toán'
];

const SUGGESTIONS = [
  'Hướng dẫn đặt lịch cắt tóc',
  'Tại sao tôi không thể thêm số điện thoại?',
  'Hướng dẫn huỷ lịch hẹn',
  'Làm thế nào để lấy lại mật khẩu?'
];

export default function SupportScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initRoom = async () => {
      if (!isAuthenticated || !user?.maKH) return;
      
      setIsConnecting(true);
      try {
        let currentRoomId = await AsyncStorage.getItem('lghair_chat_room_id');
        
        if (!currentRoomId) {
          currentRoomId = await createRoomAPI(user.hoTen, user.email || '');
          await AsyncStorage.setItem('lghair_chat_room_id', currentRoomId);
        }
        
        setRoomId(currentRoomId);
        
        // Listen to messages (descending for inverted FlatList)
        const q = query(
          collection(db, 'ChatRooms', currentRoomId, 'Messages'), 
          orderBy('timestamp', 'desc')
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs: Message[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Message));
          setMessages(msgs);
          setIsConnecting(false);
        }, (error) => {
          console.error("Lỗi khi lắng nghe tin nhắn: ", error);
          setIsConnecting(false);
        });
      } catch (error) {
        console.error("Lỗi khi kết nối phòng chat: ", error);
        setIsConnecting(false);
      }
    };

    if (isAuthenticated) {
      initRoom();
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [isAuthenticated, user?.maKH]);

  const handleSend = async (customText?: string) => {
    const content = customText || inputText.trim();
    if (!content || isSending || !user?.maKH) return;

    if (containsProfanity(content)) {
      setValidationError('Tin nhắn chứa ngôn từ không phù hợp.');
      setTimeout(() => setValidationError(''), 4000);
      return;
    }

    setIsSending(true);
    setInputText('');
    Keyboard.dismiss();

    try {
      if (!roomId) throw new Error("Phòng chat chưa được khởi tạo");
      await sendMessageToRoomAPI({
        roomId: roomId,
        senderRole: SenderRole.Customer,
        senderName: user.hoTen,
        content
      });
      updateTypingStatus(roomId, false);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn", err);
      setInputText(content); // Restore text on fail
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!user?.maKH || !roomId) return;

    updateTypingStatus(roomId, text.trim().length > 0);
    
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (text.trim().length > 0) {
      typingTimeout.current = setTimeout(() => {
        updateTypingStatus(roomId, false);
      }, 3000);
    }
  };

  const formatTime = (ts: any): string => {
    if (!ts) return '';
    const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCustomer = item.senderRole === SenderRole.Customer;
    return (
      <View style={[styles.messageWrapper, isCustomer ? styles.messageWrapperCustomer : styles.messageWrapperStaff]}>
        {!isCustomer && (
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
            style={styles.avatarSmall} 
          />
        )}
        <View>
          <Text style={[styles.timeLabel, isCustomer ? { alignSelf: 'flex-end', marginRight: 4 } : { alignSelf: 'flex-start', marginLeft: 4 }]}>
            {formatTime(item.timestamp)}
          </Text>
          <View style={[styles.messageBubble, isCustomer ? styles.bubbleCustomer : styles.bubbleStaff]}>
            <Text style={[styles.messageText, isCustomer ? styles.textCustomer : styles.textStaff]}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWelcomeMessage = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeTitle}>
        Chào bạn {user?.hoTen || 'khách hàng'} 🌸,
      </Text>
      <Text style={styles.welcomeSub}>
        Bạn đang cần LGHair hỗ trợ gì vậy ạ? 🙋‍♀️
      </Text>
      
      <View style={styles.suggestionsContainer}>
        {SUGGESTIONS.map((sug, idx) => (
          <Pressable 
            key={idx} 
            style={styles.suggestionBtn}
            onPress={() => handleSend(sug)}
          >
            <Text style={styles.suggestionText}>{sug}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Fallback: Khi người dùng chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <View style={styles.unauthContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.unauthTitle}>YÊU CẦU ĐĂNG NHẬP</Text>
        <Text style={styles.unauthDesc}>Vui lòng đăng nhập để nhận hỗ trợ trực tiếp từ nhân viên của chúng tôi.</Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Shopee Style */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={24} color="#333" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.headerAvatar} 
            />
            <Text style={styles.headerTitle}>Chăm sóc khách hàng</Text>
          </View>
          <Pressable style={styles.headerIcon}>
            <Feather name="file-text" size={22} color="#333" />
          </Pressable>
        </View>
        {/* Khung chứa danh sách tin nhắn */}
        <View style={styles.messagesContainer}>
          {isConnecting ? (
            <ActivityIndicator size="small" color={SHOPEE_ORANGE} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderMessage}
              inverted // Đảo ngược để tin nhắn mới nằm dưới đáy (auto-scroll)
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={renderWelcomeMessage} // Inverted list -> Footer is at the top conceptually
            />
          )}
        </View>

        {/* Cảnh báo lỗi từ ngữ hoặc lỗi gửi */}
        {validationError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        ) : null}

        {/* Quick Replies (Horizontal Scroll) */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesContainer}>
            {QUICK_REPLIES.map((reply, idx) => (
              <Pressable 
                key={idx} 
                style={styles.quickReplyBtn}
                onPress={() => handleSend(reply)}
              >
                <Feather name="file-text" size={12} color="#555" style={{ marginRight: 4 }} />
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Khung nhập liệu (Composer) */}
        <View style={styles.composerWrapper}>
          <Pressable style={styles.attachBtn}>
            <Feather name="plus-circle" size={24} color="#666" />
          </Pressable>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập yêu cầu của bạn tại đây "
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={handleInputChange}
              editable={!isSending && !isConnecting}
              multiline
              maxLength={500}
            />
          </View>
          <Pressable 
            style={styles.sendButton} 
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isSending || isConnecting}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={inputText.trim() && !isSending && !isConnecting ? SHOPEE_ORANGE : '#CCC'} 
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIcon: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },

  unauthContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  unauthTitle: {
    ...Theme.typography.subtitle,
    color: Colors.light.text,
    marginBottom: 12,
  },
  unauthDesc: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: Colors.light.text,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
  },
  loginBtnText: {
    ...Theme.typography.button,
    color: Colors.light.background,
  },
  messagesContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageWrapperCustomer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageWrapperStaff: {
    alignSelf: 'flex-start',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '85%',
  },
  bubbleCustomer: {
    backgroundColor: SHOPEE_ORANGE,
    borderBottomRightRadius: 4, // Đuôi nhọn bên phải
  },
  bubbleStaff: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4, // Đuôi nhọn bên trái
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textCustomer: {
    color: '#fff',
  },
  textStaff: {
    color: '#333',
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 24,
    marginTop: 16,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SHOPEE_ORANGE,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  suggestionBtn: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  quickRepliesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  quickReplyText: {
    fontSize: 12,
    color: '#555',
  },
  composerWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: BG_COLOR,
  },
  attachBtn: {
    padding: 8,
    marginBottom: 2,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    marginLeft: 4,
    marginRight: 8,
  },
  input: {
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    color: '#333',
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    padding: 8,
    marginBottom: 2,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 130,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    fontSize: 12,
    color: '#e53935',
    textAlign: 'center',
  },

});