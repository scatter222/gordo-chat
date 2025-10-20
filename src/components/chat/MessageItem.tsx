'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Paper,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  MoreVert,
  Reply,
  Edit,
  Delete,
  EmojiEmotions,
  AttachFile,
  Image as ImageIcon,
} from '@mui/icons-material';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Message, User } from '@/types';
import { UserAvatar } from '@/components/common/UserAvatar';

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  showAvatar?: boolean;
  isCompact?: boolean;
}

export function MessageItem({
  message,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReact,
  showAvatar = true,
  isCompact = false,
}: MessageItemProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hovering, setHovering] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<null | HTMLElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReactionButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiPickerAnchor(event.currentTarget);
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    onReact?.(message._id as string, emojiData.emoji);
    setShowEmojiPicker(false);
    setEmojiPickerAnchor(null);
  };

  const formatTimestamp = (date: Date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Yesterday at ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const isOwnMessage = currentUser?._id === (typeof message.userId === 'string' ? message.userId : message.userId._id);
  const user = typeof message.userId === 'object' ? message.userId : null;

  if (message.deletedAt) {
    return (
      <Box sx={{ p: 1, opacity: 0.5 }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          Message deleted
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        p: 1,
        px: 2,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        position: 'relative',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {showAvatar && (
        <UserAvatar
          user={user || undefined}
          size="medium"
          showStatus={false}
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {!isCompact && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user?.username || user?.email || 'Unknown User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {formatTimestamp(message.createdAt)}
            </Typography>
            {message.edited && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                (edited)
              </Typography>
            )}
          </Box>
        )}

        {message.replyTo && typeof message.replyTo === 'object' && (
          <Paper
            sx={{
              p: 1,
              mb: 1,
              backgroundColor: 'background.default',
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {typeof message.replyTo.userId === 'object' ? (message.replyTo.userId.username || message.replyTo.userId.email) : 'Unknown'}
            </Typography>
            <Typography variant="body2" noWrap>
              {message.replyTo.content}
            </Typography>
          </Paper>
        )}

        {message.content && (
          <Typography
            variant="body1"
            sx={{
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.content}
          </Typography>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {message.attachments.map((attachment, index) => (
              <Chip
                key={index}
                icon={attachment.type === 'image' ? <ImageIcon /> : <AttachFile />}
                label={attachment.name}
                size="small"
                onClick={() => window.open(attachment.url, '_blank')}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {message.reactions.map((reaction, index) => (
              <Chip
                key={index}
                label={`${reaction.emoji} ${reaction.users.length}`}
                size="small"
                onClick={() => onReact?.(message._id as string, reaction.emoji)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        )}
      </Box>

      {hovering && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 8,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Tooltip title="Reply">
            <IconButton size="small" onClick={() => onReply?.(message)}>
              <Reply fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="React">
            <IconButton size="small" onClick={handleReactionButtonClick}>
              <EmojiEmotions fontSize="small" />
            </IconButton>
          </Tooltip>

          {showEmojiPicker && emojiPickerAnchor && (
            <Box
              ref={emojiPickerRef}
              sx={{
                position: 'absolute',
                top: emojiPickerAnchor.offsetTop + emojiPickerAnchor.offsetHeight,
                right: 8,
                zIndex: 1000,
              }}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                theme={Theme.DARK}
                searchDisabled
                skinTonesDisabled
                height={350}
                width={300}
              />
            </Box>
          )}

          {isOwnMessage && (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit?.(message)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete?.(message)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigator.clipboard.writeText(message.content); handleMenuClose(); }}>
          Copy Text
        </MenuItem>
        <MenuItem onClick={() => { navigator.clipboard.writeText(message._id); handleMenuClose(); }}>
          Copy Message ID
        </MenuItem>
      </Menu>
    </Box>
  );
}