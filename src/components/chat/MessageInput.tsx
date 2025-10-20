'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Chip,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  Close,
  Image as ImageIcon,
  InsertDriveFile,
} from '@mui/icons-material';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Message, Attachment } from '@/types';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  channelName?: string;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder,
  channelName = 'channel',
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-focus input when replying
  useEffect(() => {
    if (replyTo) {
      setTimeout(() => {
        textFieldRef.current?.focus();
      }, 0);
    }
  }, [replyTo]);

  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    } else if (!message && isTyping) {
      setIsTyping(false);
      onTyping?.(false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (message) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping?.(false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping]);

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
      onCancelReply?.();

      // Stop typing indicator
      setIsTyping(false);
      onTyping?.(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // In a real implementation, you would upload the file to a server
      // For now, we'll create a local URL
      const url = URL.createObjectURL(file);

      const attachment: Attachment = {
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'file',
        url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };

      newAttachments.push(attachment);
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ p: 2 }}>
      {replyTo && (
        <Paper
          sx={{
            p: 1,
            mb: 1,
            backgroundColor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Replying to{' '}
              <strong>
                {typeof replyTo.userId === 'object' ? replyTo.userId.username : 'Unknown'}
              </strong>
            </Typography>
            <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
              {replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <Close fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {attachments.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {attachments.map((attachment, index) => (
            <Chip
              key={index}
              icon={
                attachment.type === 'image' ? <ImageIcon /> : <InsertDriveFile />
              }
              label={attachment.name}
              onDelete={() => handleRemoveAttachment(index)}
              sx={{ maxWidth: 200 }}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileSelect}
        />

        <Tooltip title="Attach file">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? <CircularProgress size={24} /> : <AttachFile />}
          </IconButton>
        </Tooltip>

        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || `Message #${channelName}`}
          disabled={disabled || isSending}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.default',
            },
          }}
        />

        <Box sx={{ position: 'relative' }}>
          <Tooltip title="Add emoji">
            <IconButton
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
            >
              <EmojiEmotions />
            </IconButton>
          </Tooltip>

          {showEmojiPicker && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                mb: 1,
                zIndex: 1000,
              }}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.DARK}
                searchDisabled
                skinTonesDisabled
                height={350}
                width={300}
              />
            </Box>
          )}
        </Box>

        <Tooltip title="Send message">
          <IconButton
            onClick={handleSendMessage}
            disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
            color="primary"
          >
            {isSending ? <CircularProgress size={24} /> : <Send />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}