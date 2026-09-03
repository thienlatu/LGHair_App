import apiClient from './apiClient';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SenderRole } from '../types/chatTypes';

/**
 * Gọi API để tạo phòng chat (hoặc lấy phòng hiện tại nếu BE hỗ trợ)
 */
export const createRoomAPI = async (
  customerName: string,
  customerEmail: string
): Promise<string> => {
  const { data } = await apiClient.post('/api/chat/room', {
    customerName,
    customerEmail
  });
  return data.roomId;
};

/**
 * Gọi API để gửi tin nhắn thay vì dùng Firebase trực tiếp
 */
export const sendMessageToRoomAPI = async (params: {
  roomId: string;
  senderRole: SenderRole;
  senderName?: string;
  content: string;
}) => {
  await apiClient.post('/api/chat/send', {
    roomId: params.roomId,
    senderRole: params.senderRole,
    senderName: params.senderName,
    content: params.content
  });
};

/**
 * Updates the customer typing status
 */
export const updateTypingStatus = async (roomId: string, isTyping: boolean) => {
  if (!roomId) return;
  try {
    const roomRef = doc(db, 'ChatRooms', roomId);
    await updateDoc(roomRef, { isCustomerTyping: isTyping });
  } catch (err) {
    console.error("Error updating typing status", err);
  }
};
