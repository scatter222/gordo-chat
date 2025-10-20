import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectMongoose } from './mongodb';
// Import all models from centralized location to ensure registration
import { User, Channel, Message } from './models';
import { IReaction } from '@/models/Message';
import { SocketEvents } from '@/types';

interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}

const activeUsers = new Map<string, SocketUser>();

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production'
      ) as { userId: string };

      await connectMongoose();

      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      socket.data.user = {
        userId: user._id.toString(),
        username: user.username,
        socketId: socket.id,
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`User ${user.username} connected`);

    // Add user to active users
    activeUsers.set(user.userId, user);

    // Update user status
    await User.findByIdAndUpdate(user.userId, {
      status: 'online',
      lastSeen: new Date(),
    });

    // Join user to their channels
    const userChannels = await Channel.find({ members: user.userId });
    for (const channel of userChannels) {
      socket.join(channel._id.toString());
      socket.to(channel._id.toString()).emit('user:status', {
        userId: user.userId,
        status: 'online',
      });
    }

    // Handle joining channels
    socket.on('user:join', async ({ channelId }) => {
      try {
        const channel = await Channel.findById(channelId);

        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        const isMember = channel.members.includes(user.userId);

        if (!isMember && channel.type === 'private') {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(channelId);
        socket.to(channelId).emit('user:join', {
          userId: user.userId,
          channelId,
        });
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Handle leaving channels
    socket.on('user:leave', async ({ channelId }) => {
      socket.leave(channelId);
      socket.to(channelId).emit('user:leave', {
        userId: user.userId,
        channelId,
      });
    });

    // Handle typing indicator
    socket.on('user:typing', ({ channelId, isTyping }) => {
      socket.to(channelId).emit('user:typing', {
        userId: user.userId,
        channelId,
        isTyping,
      });
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { channelId, content, attachments, replyTo } = data;

        // Validate channel access
        const channel = await Channel.findById(channelId);

        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        const isMember = channel.members.includes(user.userId);

        if (!isMember) {
          socket.emit('error', { message: 'You must be a member of the channel' });
          return;
        }

        // Create message
        const message = new Message({
          channelId,
          userId: user.userId,
          content,
          type: attachments?.length > 0 ? 'file' : 'text',
          attachments,
          replyTo,
          readBy: [user.userId],
        });

        await message.save();

        // Update channel
        channel.lastActivity = new Date();
        channel.lastMessage = message._id as any;
        await channel.save();

        // Populate message fields
        await message.populate('userId', 'username avatar status');
        if (replyTo) {
          await message.populate('replyTo');
        }

        // Emit to all channel members
        io.to(channelId).emit('message:receive', message.toJSON());

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle editing messages
    socket.on('message:edit', async ({ messageId, content }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.userId.toString() !== user.userId) {
          socket.emit('error', { message: 'You can only edit your own messages' });
          return;
        }

        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        await message.populate('userId', 'username avatar status');

        io.to(message.channelId.toString()).emit('message:edit', {
          messageId,
          content,
          editedAt: message.editedAt,
        });

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle deleting messages
    socket.on('message:delete', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.userId.toString() !== user.userId) {
          socket.emit('error', { message: 'You can only delete your own messages' });
          return;
        }

        message.deletedAt = new Date();
        await message.save();

        io.to(message.channelId.toString()).emit('message:delete', {
          messageId,
        });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle reactions
    socket.on('message:react', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Find or create reaction
        let reaction = message.reactions?.find((r: IReaction) => r.emoji === emoji);

        if (!reaction) {
          message.reactions = message.reactions || [];
          reaction = { emoji, users: [user.userId] };
          message.reactions.push(reaction);
        } else {
          const userIndex = reaction.users.indexOf(user.userId);

          if (userIndex === -1) {
            reaction.users.push(user.userId);
          } else {
            reaction.users.splice(userIndex, 1);

            // Remove reaction if no users
            if (reaction.users.length === 0) {
              message.reactions = message.reactions?.filter((r: IReaction) => r.emoji !== emoji);
            }
          }
        }

        await message.save();

        io.to(message.channelId.toString()).emit('message:react', {
          messageId,
          reactions: message.reactions,
        });

      } catch (error) {
        console.error('Error reacting to message:', error);
        socket.emit('error', { message: 'Failed to react to message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${user.username} disconnected`);

      // Remove from active users
      activeUsers.delete(user.userId);

      // Update user status
      await User.findByIdAndUpdate(user.userId, {
        status: 'offline',
        lastSeen: new Date(),
      });

      // Notify channels
      const userChannels = await Channel.find({ members: user.userId });
      for (const channel of userChannels) {
        socket.to(channel._id.toString()).emit('user:status', {
          userId: user.userId,
          status: 'offline',
        });
      }
    });
  });

  return io;
}