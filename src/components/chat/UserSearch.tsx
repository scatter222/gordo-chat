'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { User } from '@/types';

interface UserSearchProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export function UserSearch({ open, onClose, onSelectUser }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchUsers(value);
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    setQuery('');
    setUsers([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Start Direct Message</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search users by name or email..."
            value={query}
            onChange={handleQueryChange}
            size="small"
          />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={30} />
            </Box>
          )}

          {!loading && users.length === 0 && query && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No users found
              </Typography>
            </Box>
          )}

          {!loading && users.length === 0 && !query && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Start typing to search for users
              </Typography>
            </Box>
          )}

          {!loading && users.length > 0 && (
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {users.map((user) => (
                <ListItem key={user._id} disablePadding>
                  <ListItemButton onClick={() => handleSelectUser(user)}>
                    <ListItemAvatar>
                      <Avatar
                        src={user.avatar}
                        alt={user.username}
                        sx={{ width: 40, height: 40 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      secondary={
                        user.status && (
                          <Chip
                            label={user.status}
                            size="small"
                            color={user.status === 'online' ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
