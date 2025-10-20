import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Socket } from 'net';

// This is a workaround for Socket.io with Next.js App Router
// In production, you'd want to use a separate WebSocket server

export const dynamic = 'force-dynamic';

type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

const SocketHandler = (req: NextRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new SocketIOServer(res.socket.server as any, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('user:join', ({ channelId }) => {
        console.log(`User joined channel: ${channelId}`);
        socket.join(channelId);
        socket.to(channelId).emit('user:join', { userId: socket.id, channelId });
      });

      socket.on('user:leave', ({ channelId }) => {
        console.log(`User left channel: ${channelId}`);
        socket.leave(channelId);
        socket.to(channelId).emit('user:leave', { userId: socket.id, channelId });
      });

      socket.on('message:send', async ({ channelId, content, attachments, replyTo }) => {
        console.log(`Message sent to channel ${channelId}: ${content}`);
        // Broadcast to all users in the channel
        io.to(channelId).emit('message:receive', {
          _id: new Date().getTime().toString(),
          channelId,
          userId: socket.id,
          content,
          attachments,
          replyTo,
          createdAt: new Date(),
        });
      });

      socket.on('user:typing', ({ channelId, isTyping }) => {
        socket.to(channelId).emit('user:typing', {
          channelId,
          userId: socket.id,
          isTyping,
          username: 'User', // You'd get this from session
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  res.end();
};

export async function GET(req: NextRequest) {
  return new Response('Socket.io endpoint', { status: 200 });
}

export async function POST(req: NextRequest) {
  return new Response('Socket.io endpoint', { status: 200 });
}