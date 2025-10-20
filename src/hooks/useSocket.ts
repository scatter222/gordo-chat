'use client';

import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { Message, Channel, User, SocketEvents } from '@/types';

interface UseSocketOptions {
  onMessageReceive?: (message: Message) => void;
  onMessageEdit?: (data: { messageId: string; content: string; editedAt: Date }) => void;
  onMessageDelete?: (data: { messageId: string }) => void;
  onMessageReact?: (data: { messageId: string; reactions: any[] }) => void;
  onUserJoin?: (data: { userId: string; channelId: string }) => void;
  onUserLeave?: (data: { userId: string; channelId: string }) => void;
  onUserTyping?: (data: { userId: string; channelId: string; isTyping: boolean }) => void;
  onUserStatus?: (data: { userId: string; status: User['status'] }) => void;
  onError?: (error: { message: string }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: (session as any).token, // You'll need to add token to session
      },
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      options.onError?.(error);
    });

    // Message events
    socket.on('message:receive', (message: Message) => {
      options.onMessageReceive?.(message);
    });

    socket.on('message:edit', (data) => {
      options.onMessageEdit?.(data);
    });

    socket.on('message:delete', (data) => {
      options.onMessageDelete?.(data);
    });

    socket.on('message:react', (data) => {
      options.onMessageReact?.(data);
    });

    // User events
    socket.on('user:join', (data) => {
      options.onUserJoin?.(data);
    });

    socket.on('user:leave', (data) => {
      options.onUserLeave?.(data);
    });

    socket.on('user:typing', (data) => {
      options.onUserTyping?.(data);

      // Update typing users state
      setTypingUsers(prev => {
        const channelTyping = prev[data.channelId] || [];

        if (data.isTyping) {
          if (!channelTyping.includes(data.userId)) {
            return {
              ...prev,
              [data.channelId]: [...channelTyping, data.userId],
            };
          }
        } else {
          return {
            ...prev,
            [data.channelId]: channelTyping.filter(id => id !== data.userId),
          };
        }

        return prev;
      });
    });

    socket.on('user:status', (data) => {
      options.onUserStatus?.(data);
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session]);

  // Socket methods
  const joinChannel = (channelId: string) => {
    socketRef.current?.emit('user:join', { channelId });
  };

  const leaveChannel = (channelId: string) => {
    socketRef.current?.emit('user:leave', { channelId });
  };

  const sendMessage = (
    channelId: string,
    content: string,
    attachments?: any[],
    replyTo?: string
  ) => {
    socketRef.current?.emit('message:send', {
      channelId,
      content,
      attachments,
      replyTo,
    });
  };

  const editMessage = (messageId: string, content: string) => {
    socketRef.current?.emit('message:edit', { messageId, content });
  };

  const deleteMessage = (messageId: string) => {
    socketRef.current?.emit('message:delete', { messageId });
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    socketRef.current?.emit('message:react', { messageId, emoji });
  };

  const sendTyping = (channelId: string, isTyping: boolean) => {
    socketRef.current?.emit('user:typing', { channelId, isTyping });
  };

  const markMessageAsRead = (messageId: string) => {
    socketRef.current?.emit('message:read', { messageId, userId: session?.user?.id });
  };

  return {
    socket: socketRef.current,
    isConnected,
    typingUsers,
    joinChannel,
    leaveChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    sendTyping,
    markMessageAsRead,
  };
}