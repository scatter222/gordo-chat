'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import {
  Info,
  Search,
  Phone,
  VideoCall,
  MoreVert,
  People,
} from '@mui/icons-material';
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

  // Fetch initial messages
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

    // Join channel via socket
    joinChannel(channel._id);

    // Cleanup
    return () => {
      leaveChannel(channel._id);
    };
  }, [channel._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    if (editingMessage) {
      // Edit existing message
      editMessage(editingMessage._id, content);
      setEditingMessage(null);
    } else {
      // Send new message via socket
      sendMessage(channel._id, content, attachments, replyTo?._id);
      setReplyTo(null);
    }
  };

  const handleTyping = useCallback((isTyping: boolean) => {
    sendTyping(channel._id, isTyping);
  }, [channel._id]);

  const handleReply = (message: Message) => {
    setReplyTo(message);
    setEditingMessage(null);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setReplyTo(null);
  };

  const handleDelete = (message: Message) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message._id);
    }
  };

  const handleReact = (message: Message, emoji: string) => {
    reactToMessage(message._id, emoji);
  };

  // Get channel display name for DMs
  const getChannelDisplayName = () => {
    if (channel.type === 'direct' && Array.isArray(channel.members)) {
      const otherUser = channel.members.find(m =>
        typeof m === 'object' && m._id !== currentUser?._id
      );
      if (otherUser && typeof otherUser === 'object') {
        return otherUser.username;
      }
    }
    return channel.name;
  };

  // Get typing users for this channel
  const channelTypingUsers = typingUsers[channel._id] || [];
  const typingUsersFiltered = channelTypingUsers.filter(id => id !== currentUser?._id);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Channel Header */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {channel.type === 'private' && '🔒 '}
              {getChannelDisplayName()}
            </Typography>

            {channel.type !== 'direct' && channel.description && (
              <Typography
                variant="body2"
                sx={{ ml: 2, color: 'text.secondary' }}
                noWrap
              >
                {channel.description}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {channel.type !== 'direct' && (
              <>
                <Chip
                  icon={<People />}
                  label={channel.memberCount || channel.members.length}
                  size="small"
                />

                {Array.isArray(channel.members) && (
                  <AvatarGroup max={4} sx={{ mr: 2 }}>
                    {channel.members.slice(0, 4).map((member) => {
                      const memberData = typeof member === 'object' ? member : null;
                      return memberData ? (
                        <Tooltip key={memberData._id} title={memberData.username}>
                          <Avatar
                            alt={memberData.username}
                            src={memberData.avatar}
                            sx={{ width: 32, height: 32 }}
                          />
                        </Tooltip>
                      ) : null;
                    })}
                  </AvatarGroup>
                )}
              </>
            )}

            <IconButton>
              <Search />
            </IconButton>

            <IconButton>
              <Phone />
            </IconButton>

            <IconButton>
              <VideoCall />
            </IconButton>

            <IconButton onClick={onOpenChannelInfo}>
              <Info />
            </IconButton>

            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Divider />

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 1,
          backgroundColor: 'background.default',
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <Box key={date}>
                <Divider sx={{ my: 2 }}>
                  <Chip
                    label={
                      new Date(date).toDateString() === new Date().toDateString()
                        ? 'Today'
                        : new Date(date).toDateString() ===
                          new Date(Date.now() - 86400000).toDateString()
                        ? 'Yesterday'
                        : date
                    }
                    size="small"
                    variant="outlined"
                  />
                </Divider>

                {dateMessages.map((message, index) => {
                  const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                  const showAvatar =
                    !prevMessage ||
                    prevMessage.userId !== message.userId ||
                    new Date(message.createdAt).getTime() -
                      new Date(prevMessage.createdAt).getTime() >
                      300000; // 5 minutes

                  return (
                    <MessageItem
                      key={message._id}
                      message={message}
                      currentUser={currentUser}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onReact={handleReact}
                      showAvatar={showAvatar}
                      isCompact={!showAvatar}
                    />
                  );
                })}
              </Box>
            ))}
          </>
        )}

        {/* Typing indicator */}
        {typingUsersFiltered.length > 0 && (
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {typingUsersFiltered.length === 1
                ? 'Someone is typing...'
                : `${typingUsersFiltered.length} people are typing...`}
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={!isConnected}
        channelName={getChannelDisplayName()}
      />

      <style jsx global>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-indicator span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #999;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
}