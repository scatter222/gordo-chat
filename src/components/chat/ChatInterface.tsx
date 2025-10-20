'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Avatar,
  CircularProgress,
  Chip,
} from '@mui/material';
import { MoreVert, Tag, LockOutlined } from '@mui/icons-material';
import { Channel, Message, User, Attachment } from '@/types';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  channel: Channel;
  currentUser: User | null;
  onOpenChannelInfo?: () => void;
}

export function ChatInterface({
  channel,
  currentUser,
  onOpenChannelInfo,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    typingUsers,
    joinChannel,
    leaveChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    sendTyping,
  } = useSocket({
    onMessageReceive: (message) => {
      if (message.channelId === channel._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    },
    onMessageEdit: ({ messageId, content, editedAt }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? { ...msg, content, edited: true, editedAt }
            : msg
        )
      );
    },
    onMessageDelete: ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? { ...msg, deletedAt: new Date() }
            : msg
        )
      );
    },
    onMessageReact: ({ messageId, reactions }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? { ...msg, reactions }
            : msg
        )
      );
    },
  });

  // Get channel display name
  const getChannelDisplayName = () => {
    if (channel.type === 'direct') {
      const otherUser = channel.members?.find(
        (member: any) => member._id !== currentUser?._id
      );
      return otherUser?.username || 'Direct Message';
    }
    return channel.name;
  };

  // Fetch messages on channel change
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/messages?channelId=${channel._id}&limit=50`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data);
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Join channel via socket if connected
    if (isConnected) {
      joinChannel(channel._id);
    }

    // Cleanup
    return () => {
      if (isConnected) {
        leaveChannel(channel._id);
      }
    };
  }, [channel._id, joinChannel, leaveChannel, isConnected]);

  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM has updated before scrolling
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        // Add a small extra scroll to account for any padding/margins
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight + 100;
      }
    });
  };

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    if (editingMessage) {
      // Edit existing message
      if (isConnected) {
        editMessage(editingMessage._id, content);
      } else {
        // Fallback to API call if not connected
        try {
          const response = await fetch(`/api/messages`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: editingMessage._id, content }),
          });
          if (response.ok) {
            const data = await response.json();
            setMessages(prev =>
              prev.map(msg =>
                msg._id === editingMessage._id
                  ? { ...msg, content, edited: true, editedAt: new Date() }
                  : msg
              )
            );
          }
        } catch (error) {
          console.error('Failed to edit message:', error);
        }
      }
      setEditingMessage(null);
    } else {
      // Send new message
      if (isConnected) {
        sendMessage(channel._id, content, attachments, replyTo?._id);
      } else {
        // Fallback to API call if not connected
        try {
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelId: channel._id,
              content,
              attachments,
              replyTo: replyTo?._id,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setMessages(prev => [...prev, data.data]);
            scrollToBottom();
          }
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      }
      setReplyTo(null);
    }
  };

  const handleTyping = useCallback((isTyping: boolean) => {
    if (isConnected) {
      sendTyping(channel._id, isTyping);
    }
  }, [channel._id, sendTyping, isConnected]);

  const handleReply = (message: Message) => {
    setReplyTo(message);
    setEditingMessage(null);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setReplyTo(null);
  };

  const handleDelete = async (messageId: string) => {
    if (isConnected) {
      deleteMessage(messageId);
    } else {
      // Fallback to API call
      try {
        const response = await fetch(`/api/messages`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId }),
        });
        if (response.ok) {
          setMessages(prev =>
            prev.map(msg =>
              msg._id === messageId
                ? { ...msg, deletedAt: new Date() }
                : msg
            )
          );
        }
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (isConnected) {
      reactToMessage(messageId, emoji);
    }
  };

  // Get typing users for this channel
  const channelTypingUsers = typingUsers[channel._id] || [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Channel Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: channel.type === 'private' ? 'warning.main' : 'primary.main',
            }}
          >
            {channel.type === 'private' ? <LockOutlined /> : <Tag />}
          </Avatar>
          <Box>
            <Typography variant="h6">{getChannelDisplayName()}</Typography>
            <Typography variant="caption" color="text.secondary">
              {channel.members?.length || 0} members
              {!isConnected && ' • Not connected (messages will be sent via API)'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onOpenChannelInfo}>
          <MoreVert />
        </IconButton>
      </Paper>

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message._id}
              message={message}
              currentUser={currentUser}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Typing Indicator */}
      {channelTypingUsers.length > 0 && (
        <Box sx={{ px: 2, py: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {channelTypingUsers.join(', ')} {channelTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={false} // Always enable input, we'll use API fallback if not connected
        channelName={getChannelDisplayName()}
      />
    </Box>
  );
}