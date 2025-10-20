import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectMongoose } from './mongodb';
// Import from centralized models to ensure registration
import { User } from './models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        try {
          await connectMongoose();

          const user = await User.findOne({
            email: credentials.email.toLowerCase()
          }).select('+password');

          if (!user) {
            throw new Error('User not found');
          }

          const isPasswordValid = await user.comparePassword(credentials.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          // Update user status to online
          user.status = 'online';
          user.lastSeen = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.username,
            image: user.avatar
          };
        } catch (error: any) {
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || '';
        token.name = user.name || '';
        token.picture = user.image || undefined;
      }

      if (trigger === 'update' && session) {
        token.name = session.name;
        token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        // Add a JWT token for Socket.io authentication
        (session as any).token = generateToken(token.id as string);
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    newUser: '/dashboard'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-change-in-production',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-change-in-production',
}

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    { expiresIn: '30d' }
  );
}

export const verifyToken = (token: string): any => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production'
  );
}