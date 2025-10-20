'use client';

import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Typography,
  IconButton,
  Collapse,
  Box,
  Divider,
  Chip,
  Badge,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Tag as TagIcon,
  Lock,
  ExpandMore,
  ExpandLess,
  Add,
  Settings,
  Search,
  VolumeUp,
  People,
} from '@mui/icons-material';
import { Channel } from '@/types';
import { UserAvatar } from '@/components/common/UserAvatar';

interface ChannelListProps {
  channels: Channel[];
  currentChannelId?: string;
  currentUserId?: string;
  onChannelSelect: (channel: Channel) => void;
  onCreateChannel?: () => void;
  onChannelSettings?: (channel: Channel) => void;
  unreadCounts?: Record<string, number>;
}

interface ChannelGroup {
  title: string;
  channels: Channel[];
  expanded: boolean;
}

export function ChannelList({
  channels,
  currentChannelId,
  currentUserId,
  onChannelSelect,
  onCreateChannel,
  onChannelSettings,
  unreadCounts = {},
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupsExpanded, setGroupsExpanded] = useState<Record<string, boolean>>({
    public: true,
    private: true,
    direct: true,
  });

  const handleToggleGroup = (groupType: string) => {
    setGroupsExpanded(prev => ({
      ...prev,
      [groupType]: !prev[groupType],
    }));
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChannels = filteredChannels.reduce<Record<string, Channel[]>>(
    (acc, channel) => {
      const group = channel.type;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(channel);
      return acc;
    },
    {}
  );

  const renderChannelIcon = (channel: Channel) => {
    if (channel.type === 'direct') {
      const otherUser = Array.isArray(channel.members) &&
        channel.members.find(m => typeof m === 'object' && m._id !== currentUserId);

      if (otherUser && typeof otherUser === 'object') {
        return (
          <UserAvatar
            user={otherUser}
            size="small"
            showStatus={true}
          />
        );
      }
    }

    if (channel.avatar) {
      return (
        <UserAvatar
          username={channel.name}
          avatar={channel.avatar}
          size="small"
        />
      );
    }

    return channel.type === 'private' ? (
      <Lock fontSize="small" />
    ) : (
      <TagIcon fontSize="small" />
    );
  };

  const getChannelDisplayName = (channel: Channel) => {
    if (channel.type === 'direct' && Array.isArray(channel.members)) {
      const otherUser = channel.members.find(m =>
        typeof m === 'object' && m._id !== currentUserId
      );
      if (otherUser && typeof otherUser === 'object' && 'username' in otherUser) {
        return (otherUser as any).username;
      }
    }
    return channel.name;
  };

  return (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
      </Box>

      <Divider />

      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {Object.entries(groupedChannels).map(([type, channelList]) => (
          <Box key={type}>
            <ListItem
              dense
              sx={{
                px: 2,
                py: 0.5,
                '&:hover': { backgroundColor: 'transparent' },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleGroup(type)}
                      sx={{ p: 0.5 }}
                    >
                      {groupsExpanded[type] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 600, color: 'text.secondary' }}>
                      {type === 'direct' ? 'Direct Messages' : `${type} Channels`}
                    </Typography>
                  </Box>
                }
              />
              {type !== 'direct' && onCreateChannel && (
                <Tooltip title="Create Channel">
                  <IconButton size="small" onClick={onCreateChannel}>
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </ListItem>

            <Collapse in={groupsExpanded[type]} timeout="auto" unmountOnExit>
              {channelList.map((channel) => {
                const unreadCount = unreadCounts[channel._id] || 0;
                const isSelected = channel._id === currentChannelId;

                return (
                  <ListItemButton
                    key={channel._id}
                    selected={isSelected}
                    onClick={() => onChannelSelect(channel)}
                    sx={{
                      py: 0.5,
                      px: 2,
                      ml: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Badge badgeContent={unreadCount} color="error" max={99}>
                        {renderChannelIcon(channel)}
                      </Badge>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {getChannelDisplayName(channel)}
                        </Typography>
                      }
                      secondary={
                        channel.type !== 'direct' && channel.description && (
                          <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                            {channel.description}
                          </Typography>
                        )
                      }
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {channel.memberCount && channel.type !== 'direct' && (
                        <Tooltip title={`${channel.memberCount} members`}>
                          <Chip
                            icon={<People fontSize="small" />}
                            label={channel.memberCount}
                            size="small"
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        </Tooltip>
                      )}

                      {onChannelSettings && channel.type !== 'direct' && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChannelSettings(channel);
                          }}
                          sx={{ opacity: isSelected ? 1 : 0, '&:hover': { opacity: 1 } }}
                        >
                          <Settings fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemButton>
                );
              })}
            </Collapse>
          </Box>
        ))}
      </List>
    </Box>
  );
}