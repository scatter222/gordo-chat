'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

// Singleton socket instance
let socketInstance: Socket | null = null;
let connectionCount = 0;

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const optionsRef = useRef(options);

  // Update options ref on each render
  useEffect(() => {
    optionsRef.current = options;
  });

  // Initialize socket connection (only once per session)
  useEffect(() => {
    if (!session?.user) {
      if (socketInstance) {
        console.log('No session, disconnecting socket');
        socketInstance.disconnect();
        socketInstance = null;
        connectionCount = 0;
      }
      return;
    }

    // If socket already exists and is connected, just update the state
    if (socketInstance?.connected) {
      setIsConnected(true);
      return;
    }

    // Increment connection count
    connectionCount++;
    console.log(`Socket connection attempt #${connectionCount}`);

    // Only create a new socket if one doesn't exist
    if (!socketInstance) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
      console.log('Creating new Socket.io connection to:', socketUrl);

      socketInstance = io(socketUrl, {
        auth: {
          token: (session as any).token,
          userId: session.user.id,
          username: session.user.name || session.user.email,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      // Set up event listeners only once
      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    // Connect if not connected
    if (!socketInstance.connected) {
      socketInstance.connect();
    }

    return () => {
      // Don't disconnect on unmount, keep the connection alive
      console.log('Component unmounting, keeping socket connection alive');
    };
  }, [session?.user?.id]); // Only reconnect if user ID changes

  // Set up event handlers (can change without reconnecting)
  useEffect(() => {
    if (!socketInstance) return;

    const socket = socketInstance;

    // Message events
    const handleMessageReceive = (message: Message) => {
      optionsRef.current.onMessageReceive?.(message);
    };

    const handleMessageEdit = (data: any) => {
      optionsRef.current.onMessageEdit?.(data);
    };

    const handleMessageDelete = (data: any) => {
      optionsRef.current.onMessageDelete?.(data);
    };

    const handleMessageReact = (data: any) => {
      optionsRef.current.onMessageReact?.(data);
    };

    // User events
    const handleUserJoin = (data: any) => {
      optionsRef.current.onUserJoin?.(data);
    };

    const handleUserLeave = (data: any) => {
      optionsRef.current.onUserLeave?.(data);
    };

    const handleUserTyping = (data: any) => {
      optionsRef.current.onUserTyping?.(data);

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
    };

    const handleUserStatus = (data: any) => {
      optionsRef.current.onUserStatus?.(data);
    };

    const handleError = (error: any) => {
      optionsRef.current.onError?.(error);
    };

    // Add event listeners
    socket.on('message:receive', handleMessageReceive);
    socket.on('message:edit', handleMessageEdit);
    socket.on('message:delete', handleMessageDelete);
    socket.on('message:react', handleMessageReact);
    socket.on('user:join', handleUserJoin);
    socket.on('user:leave', handleUserLeave);
    socket.on('user:typing', handleUserTyping);
    socket.on('user:status', handleUserStatus);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      socket.off('message:receive', handleMessageReceive);
      socket.off('message:edit', handleMessageEdit);
      socket.off('message:delete', handleMessageDelete);
      socket.off('message:react', handleMessageReact);
      socket.off('user:join', handleUserJoin);
      socket.off('user:leave', handleUserLeave);
      socket.off('user:typing', handleUserTyping);
      socket.off('user:status', handleUserStatus);
      socket.off('error', handleError);
    };
  }, []); // Empty deps, handlers use ref

  // Socket methods - always use the same functions
  const joinChannel = useCallback((channelId: string) => {
    if (socketInstance?.connected) {
      console.log('Joining channel:', channelId);
      socketInstance.emit('user:join', { channelId });
    }
  }, []);

  const leaveChannel = useCallback((channelId: string) => {
    if (socketInstance?.connected) {
      console.log('Leaving channel:', channelId);
      socketInstance.emit('user:leave', { channelId });
    }
  }, []);

  const sendMessage = useCallback((
    channelId: string,
    content: string,
    attachments?: any[],
    replyTo?: string
  ) => {
    if (socketInstance?.connected) {
      socketInstance.emit('message:send', {
        channelId,
        content,
        attachments,
        replyTo,
      });
    }
  }, []);

  const editMessage = useCallback((messageId: string, content: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('message:edit', { messageId, content });
    }
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('message:delete', { messageId });
    }
  }, []);

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('message:react', { messageId, emoji });
    }
  }, []);

  const sendTyping = useCallback((channelId: string, isTyping: boolean) => {
    if (socketInstance?.connected) {
      socketInstance.emit('user:typing', { channelId, isTyping });
    }
  }, []);

  const markMessageAsRead = useCallback((messageId: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('message:read', { messageId, userId: session?.user?.id });
    }
  }, [session?.user?.id]);

  return {
    socket: socketInstance,
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