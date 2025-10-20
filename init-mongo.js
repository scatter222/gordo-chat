// MongoDB initialization script
db = db.getSiblingDB('gordo-chat');

// Create collections
db.createCollection('users');
db.createCollection('channels');
db.createCollection('messages');
db.createCollection('sessions');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.messages.createIndex({ channelId: 1, createdAt: -1 });
db.messages.createIndex({ userId: 1 });
db.channels.createIndex({ members: 1 });

// Insert default channel
db.channels.insertOne({
  name: 'general',
  description: 'General discussion channel',
  type: 'public',
  members: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialized successfully');