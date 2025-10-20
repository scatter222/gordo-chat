'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings,
  Logout,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Channel, User } from '@/types';
import { ChannelList } from '@/components/chat/ChannelList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useTheme } from '@/components/providers/ThemeProvider';

const drawerWidth = 280;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;

      try {
        // Fetch user data
        const userResponse = await fetch('/api/users/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser(userData.data);
        }

        // Fetch channels
        const channelsResponse = await fetch('/api/channels');
        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();
          setChannels(channelsData.data);

          // Select first channel or general channel
          const generalChannel = channelsData.data.find(
            (ch: Channel) => ch.name === 'general'
          );
          setCurrentChannel(generalChannel || channelsData.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoadingChannels(false);
      }
    };

    fetchData();
  }, [session]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  if (status === 'loading' || isLoadingChannels) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* App Header in Drawer */}
      <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Gordo Chat
        </Typography>
      </Box>

      <Divider />

      {/* User Info */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <UserAvatar user={currentUser || undefined} showStatus />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
            {currentUser?.username}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Channels List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <ChannelList
          channels={channels}
          currentChannelId={currentChannel?._id}
          onChannelSelect={handleChannelSelect}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar for Mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flex: 1 }}>
              Gordo Chat
            </Typography>
            <IconButton onClick={handleProfileMenuOpen} color="inherit">
              <UserAvatar
                user={currentUser || undefined}
                size="small"
                showStatus
              />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column',
          mt: { xs: 7, md: 0 }, // Account for mobile app bar
        }}
      >
        {!isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              display: 'flex',
              gap: 1,
            }}
          >
            <IconButton onClick={toggleTheme}>
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
            <IconButton onClick={handleProfileMenuOpen}>
              <UserAvatar
                user={currentUser || undefined}
                size="small"
                showStatus
              />
            </IconButton>
          </Box>
        )}

        {currentChannel ? (
          <ChatInterface
            channel={currentChannel}
            currentUser={currentUser}
            onOpenChannelInfo={() => {}}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a channel to start chatting
            </Typography>
          </Box>
        )}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => router.push('/settings')}>
          <Settings sx={{ mr: 1 }} fontSize="small" />
          Settings
        </MenuItem>
        <MenuItem onClick={toggleTheme}>
          {mode === 'dark' ? (
            <>
              <LightMode sx={{ mr: 1 }} fontSize="small" />
              Light Mode
            </>
          ) : (
            <>
              <DarkMode sx={{ mr: 1 }} fontSize="small" />
              Dark Mode
            </>
          )}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} fontSize="small" />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}