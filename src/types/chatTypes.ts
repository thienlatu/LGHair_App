import { FieldValue, Timestamp } from 'firebase/firestore';

export enum SenderRole {
  Customer = 'Customer',
  Staff = 'Staff',
  System = 'System'
}

export enum RoomStatus {
  Open = 'Open',
  Closed = 'Closed'
}

export enum ConversationState {
  HANDOFF_REQUESTED = 'HANDOFF_REQUESTED',
  STAFF_CONNECTED = 'STAFF_CONNECTED'
}

// Support both web SDK Timestamp and literal object formats
export type FirestoreTimestamp = Timestamp | { seconds: number; nanoseconds: number } | Date | FieldValue;

export interface Message {
  id?: string;
  content: string;
  senderRole: SenderRole | string;
  senderName?: string;
  timestamp: FirestoreTimestamp | any;
  isLocal?: boolean; // Used for optimistic UI updates
}

export interface ChatRoom {
  roomId: string;
  customerName: string;
  customerEmail: string;
  status: RoomStatus | string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  isCustomerTyping: boolean;
  isStaffTyping: boolean;
}
