'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Chat, People, Security, Speed } from '@mui/icons-material';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
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

  const features = [
    {
      icon: <Chat sx={{ fontSize: 40 }} />,
      title: 'Real-time Messaging',
      description: 'Instant messaging with WebSocket support for real-time communication',
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: 'Team Collaboration',
      description: 'Create channels, direct messages, and collaborate with your team',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure & Offline',
      description: 'Works in offline environments with secure authentication',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Fast & Responsive',
      description: 'Built with Next.js and optimized for performance',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Welcome to Gordo Chat
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            A simple, secure, and offline-friendly team communication platform
            built for your organization
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auth/register')}
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/auth/login')}
              sx={{ px: 4, py: 1.5 }}
            >
              Sign In
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 8,
          }}
        >
          {features.map((feature, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'background.paper',
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Tech Stack */}
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Built with Next.js, TypeScript, Material-UI, MongoDB, and Socket.io
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}