// Socket.io server with MongoDB integration for Gordo Chat
// This runs alongside the Next.js dev server and saves messages to MongoDB

const { Server } = require('socket.io');
const { createServer } = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/gordo-chat?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-for-testing-only';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import models (CommonJS versions)
const User = require('./src/models-cjs/User');
const Channel = require('./src/models-cjs/Channel');
const Message = require('./src/models-cjs/Message');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const activeUsers = new Map();
const typingUsers = new Map();

// Helper function to verify JWT token
async function verifyToken(token) {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Helper function to get user from token or auth data
async function getUserFromAuth(authData) {
  try {
    // Try to verify JWT token first
    if (authData.token) {
      const decoded = await verifyToken(authData.token);
      if (decoded && decoded.userId) {
        const user = await User.findById(decoded.userId).select('_id username email avatar status');
        if (user) {
          return user;
        }
      }
    }

    // Fallback to userId if provided
    if (authData.userId) {
      const user = await User.findById(authData.userId).select('_id username email avatar status');
      if (user) {
        return user;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user from auth:', error);
    return null;
  }
}

io.on('connection', async (socket) => {
  console.log('✅ New client connected:', socket.id);

  // Get user from handshake auth
  const user = await getUserFromAuth(socket.handshake.auth);
  if (user) {
    socket.data.user = user;
    socket.data.userId = user._id.toString();
    console.log(`🔐 User authenticated: ${user.username || user.email} (${user._id})`);

    // Update user status to online
    await User.findByIdAndUpdate(user._id, { status: 'online' });

    // Store in active users
    activeUsers.set(socket.id, {
      userId: user._id.toString(),
      username: user.username || user.email
    });
  } else {
    console.log('⚠️ Client connected without authentication');
  }

  // Handle user joining a channel
  socket.on('user:join', async ({ channelId }) => {
    console.log(`User ${socket.data.userId || socket.id} joining channel: ${channelId}`);
    socket.join(channelId);

    // Add user to channel members if authenticated
    if (socket.data.userId) {
      try {
        await Channel.findByIdAndUpdate(
          channelId,
          { $addToSet: { members: socket.data.userId } }
        );
      } catch (error) {
        console.error('Error adding user to channel:', error);
      }
    }

    // Notify others in the channel
    socket.to(channelId).emit('user:join', {
      userId: socket.data.userId || socket.id,
      channelId
    });
  });

  // Handle user leaving a channel
  socket.on('user:leave', ({ channelId }) => {
    console.log(`User ${socket.data.userId || socket.id} leaving channel: ${channelId}`);
    socket.leave(channelId);

    // Notify others in the channel
    socket.to(channelId).emit('user:leave', {
      userId: socket.data.userId || socket.id,
      channelId
    });
  });

  // Handle sending messages
  socket.on('message:send', async ({ channelId, content, attachments, replyTo }) => {
    console.log(`📨 Message sent to channel ${channelId}: "${content}"`);

    if (!socket.data.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Create and save the message to MongoDB
      const message = new Message({
        channelId,
        userId: socket.data.userId,
        content,
        attachments: attachments || [],
        replyTo,
        reactions: [],
        readBy: [socket.data.userId]
      });

      await message.save();

      // Populate user data and convert to plain object
      const populatedMessage = await Message.findById(message._id)
        .populate('userId', 'username email avatar status')
        .populate({
          path: 'replyTo',
          populate: {
            path: 'userId',
            select: 'username email avatar'
          }
        })
        .lean();

      console.log(`✅ Message saved to database with ID: ${message._id}`);

      // The populated message should now have all the user data
      const messageData = populatedMessage;

      // Debug log to check what we're sending
      console.log('Broadcasting message with userId:', typeof messageData.userId === 'object' ?
        `User object: ${messageData.userId.username || messageData.userId.email}` :
        `User ID string: ${messageData.userId}`);

      // Broadcast to all users in the channel (including sender)
      io.to(channelId).emit('message:receive', messageData);

    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message editing
  socket.on('message:edit', async ({ messageId, content }) => {
    console.log(`✏️ Message ${messageId} edited`);

    if (!socket.data.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Update the message in the database
      const message = await Message.findById(messageId);

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user owns the message
      if (message.userId.toString() !== socket.data.userId) {
        socket.emit('error', { message: 'Unauthorized to edit this message' });
        return;
      }

      message.content = content;
      message.edited = true;
      message.editedAt = new Date();
      await message.save();

      // Broadcast to all users in the channel
      io.to(message.channelId.toString()).emit('message:edit', {
        messageId,
        content,
        editedAt: message.editedAt
      });

    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Handle message deletion
  socket.on('message:delete', async ({ messageId }) => {
    console.log(`🗑️ Message ${messageId} deleted`);

    if (!socket.data.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Find and delete the message
      const message = await Message.findById(messageId);

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user owns the message
      if (message.userId.toString() !== socket.data.userId) {
        socket.emit('error', { message: 'Unauthorized to delete this message' });
        return;
      }

      const channelId = message.channelId.toString();
      await message.deleteOne();

      // Broadcast to all users in the channel
      io.to(channelId).emit('message:delete', {
        messageId
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle reactions
  socket.on('message:react', async ({ messageId, emoji }) => {
    console.log(`😊 Reaction ${emoji} added to message ${messageId}`);

    if (!socket.data.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const message = await Message.findById(messageId);

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Find existing reaction
      let reaction = message.reactions.find(r => r.emoji === emoji);

      if (reaction) {
        // Add or remove user from reaction
        const userIndex = reaction.users.indexOf(socket.data.userId);
        if (userIndex === -1) {
          reaction.users.push(socket.data.userId);
        } else {
          reaction.users.splice(userIndex, 1);
        }

        // Remove reaction if no users
        if (reaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add new reaction
        message.reactions.push({
          emoji,
          users: [socket.data.userId]
        });
      }

      await message.save();

      // Fetch the message with populated reaction users
      const populatedMessage = await Message.findById(messageId)
        .populate({
          path: 'reactions.users',
          select: 'username avatar status'
        });

      // Broadcast to all users in the channel
      io.to(message.channelId.toString()).emit('message:react', {
        messageId,
        reactions: populatedMessage.reactions
      });

    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Handle typing status
  socket.on('user:typing', ({ channelId, isTyping }) => {
    const username = socket.data.user?.username || socket.data.user?.email || `User_${socket.id.substring(0, 8)}`;

    if (isTyping) {
      console.log(`⌨️ ${username} is typing in channel ${channelId}`);
    }

    // Broadcast typing status to others in the channel
    socket.to(channelId).emit('user:typing', {
      channelId,
      userId: socket.data.userId || socket.id,
      username,
      isTyping
    });
  });

  // Handle message read status
  socket.on('message:read', async ({ messageId }) => {
    if (!socket.data.userId) return;

    try {
      await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { readBy: socket.data.userId } }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('❌ Client disconnected:', socket.id);

    // Update user status to offline if authenticated
    if (socket.data.userId) {
      await User.findByIdAndUpdate(socket.data.userId, { status: 'offline' });
    }

    // Remove from active users
    activeUsers.delete(socket.id);

    // Notify all channels this user was in
    const channels = Array.from(socket.rooms).filter(room => room !== socket.id);
    channels.forEach(channelId => {
      socket.to(channelId).emit('user:leave', {
        userId: socket.data.userId || socket.id,
        channelId
      });
    });
  });
});

const PORT = process.env.SOCKET_PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server with MongoDB integration running on port ${PORT}`);
  console.log(`📡 Accepting connections from localhost:3000 and localhost:3001`);
  console.log(`🗄️ Connected to MongoDB at: ${MONGODB_URI}`);
  console.log('\n💡 To use Socket.io in your app:');
  console.log('   1. Make sure NEXT_PUBLIC_SOCKET_URL=http://localhost:3002 is in your .env');
  console.log('   2. The Next.js app will automatically connect when available');
  console.log('\n✨ Real-time features enabled:');
  console.log('   - Instant message delivery with database persistence');
  console.log('   - Typing indicators');
  console.log('   - User presence tracking');
  console.log('   - Message reactions');
  console.log('   - Message editing and deletion\n');
});