// User types
export interface User {
  _id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  bio?: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Channel types
export interface Channel {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  owner?: string;
  members: string[] | User[];
  admins: string[];
  avatar?: string;
  lastMessage?: Message;
  lastActivity?: Date;
  isArchived: boolean;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface Attachment {
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Reaction {
  emoji: string;
  users: string[] | User[];
}

export interface Message {
  _id: string;
  channelId: string | Channel;
  userId: string | User;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: string | Message;
  edited: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  mentions?: string[] | User[];
  readBy: string[] | User[];
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Socket event types
export interface SocketEvents {
  'user:join': (data: { userId: string; channelId: string }) => void;
  'user:leave': (data: { userId: string; channelId: string }) => void;
  'user:typing': (data: { userId: string; channelId: string; isTyping: boolean }) => void;
  'user:status': (data: { userId: string; status: User['status'] }) => void;
  'message:send': (data: { channelId: string; content: string; attachments?: Attachment[]; replyTo?: string }) => void;
  'message:receive': (message: Message) => void;
  'message:edit': (data: { messageId: string; content: string }) => void;
  'message:delete': (data: { messageId: string }) => void;
  'message:react': (data: { messageId: string; emoji: string }) => void;
  'message:read': (data: { messageId: string; userId: string }) => void;
  'channel:create': (channel: Channel) => void;
  'channel:update': (channel: Channel) => void;
  'channel:delete': (channelId: string) => void;
  'channel:join': (data: { channelId: string; userId: string }) => void;
  'channel:leave': (data: { channelId: string; userId: string }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthToken {
  token: string;
  user: User;
}

// Session types
export interface Session {
  user: User;
  expires: string;
}