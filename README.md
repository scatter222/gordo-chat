# Gordo Chat

A simple, secure, and offline-friendly team communication platform built with Next.js, TypeScript, Material-UI, MongoDB, and Socket.io.

## Features

- **Real-time Messaging**: Instant messaging with WebSocket support
- **Channel Management**: Create public/private channels for team collaboration
- **Direct Messages**: One-on-one conversations with team members
- **File Sharing**: Upload and share files within conversations
- **Emoji Support**: Express yourself with emoji reactions and picker
- **User Authentication**: Secure login and registration system
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Offline-Friendly**: Designed to work in isolated network environments

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for WebSocket communication
- **Authentication**: NextAuth.js with JWT
- **Styling**: Emotion CSS-in-JS
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)
- MongoDB (if running without Docker)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd gordo-chat
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Build and run with Docker Compose:
```bash
docker-compose up --build
```

The application will be available at:
- Application: http://localhost:3000
- MongoDB: mongodb://localhost:27017

## Local Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update the MongoDB URI if needed.

3. Start MongoDB (if not using Docker):
```bash
# Using Docker for MongoDB only
docker run -d -p 27017:27017 --name gordo-mongo mongo:7.0
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://admin:admin123@localhost:27017/gordo-chat?authSource=admin` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-jwt-secret-key-change-in-production` |
| `NEXTAUTH_URL` | NextAuth callback URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | `your-nextauth-secret-change-in-production` |

## Project Structure

```
gordo-chat/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/         # API routes
│   │   ├── auth/        # Authentication pages
│   │   └── dashboard/   # Main chat interface
│   ├── components/      # React components
│   │   ├── chat/       # Chat-related components
│   │   ├── common/     # Shared components
│   │   └── providers/  # Context providers
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   ├── models/         # MongoDB models
│   ├── theme/          # MUI theme configuration
│   └── types/          # TypeScript type definitions
├── uploads/            # File upload directory
├── docker-compose.yml  # Docker Compose configuration
├── Dockerfile         # Docker image configuration
└── package.json       # Node.js dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile

### Channels
- `GET /api/channels` - List all channels
- `POST /api/channels` - Create new channel
- `GET /api/channels/[id]` - Get channel details
- `PUT /api/channels/[id]` - Update channel
- `DELETE /api/channels/[id]` - Delete channel

### Messages
- `GET /api/messages` - Get messages for a channel
- `POST /api/messages` - Send a new message

## Socket Events

### Client -> Server
- `user:join` - Join a channel
- `user:leave` - Leave a channel
- `user:typing` - Send typing indicator
- `message:send` - Send a message
- `message:edit` - Edit a message
- `message:delete` - Delete a message
- `message:react` - React to a message

### Server -> Client
- `message:receive` - New message received
- `message:edit` - Message edited
- `message:delete` - Message deleted
- `message:react` - Message reaction updated
- `user:status` - User status changed
- `user:typing` - User typing indicator

## Default Credentials

For testing purposes, you can use:
- Email: demo@example.com
- Password: demo123

## Production Deployment

1. Update environment variables with secure values
2. Build the production image:
```bash
docker-compose -f docker-compose.yml build
```

3. Run in production:
```bash
docker-compose -f docker-compose.yml up -d
```

## Security Considerations

- Change all default passwords and secrets
- Use HTTPS in production
- Configure proper CORS settings
- Implement rate limiting
- Add input validation and sanitization
- Regular security updates

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the GitHub repository.