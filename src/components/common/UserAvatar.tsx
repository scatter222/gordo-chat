'use client';

import React from 'react';
import { Avatar, Badge, AvatarProps, BadgeProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { User } from '@/types';

const StyledBadge = styled(Badge)<BadgeProps & { status: User['status'] }>(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor:
      status === 'online' ? '#44b700' :
      status === 'away' ? '#ffa500' :
      status === 'busy' ? '#f44336' :
      '#808080',
    color:
      status === 'online' ? '#44b700' :
      status === 'away' ? '#ffa500' :
      status === 'busy' ? '#f44336' :
      '#808080',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: status === 'online' ? 'ripple 1.2s infinite ease-in-out' : 'none',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'alt'> {
  user?: Partial<User>;
  showStatus?: boolean;
  size?: 'small' | 'medium' | 'large';
  username?: string;
  avatar?: string;
  status?: User['status'];
}

const sizeMap = {
  small: { width: 32, height: 32 },
  medium: { width: 40, height: 40 },
  large: { width: 56, height: 56 },
};

export function UserAvatar({
  user,
  showStatus = false,
  size = 'medium',
  username,
  avatar,
  status,
  ...props
}: UserAvatarProps) {
  const displayName = username || user?.username || 'User';
  const displayAvatar = avatar || user?.avatar;
  const displayStatus = status || user?.status || 'offline';

  const avatarElement = (
    <Avatar
      src={displayAvatar}
      alt={displayName}
      {...props}
      sx={{
        ...sizeMap[size],
        ...props.sx,
      }}
    >
      {displayName.charAt(0).toUpperCase()}
    </Avatar>
  );

  if (showStatus && displayStatus) {
    return (
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        status={displayStatus}
      >
        {avatarElement}
      </StyledBadge>
    );
  }

  return avatarElement;
}