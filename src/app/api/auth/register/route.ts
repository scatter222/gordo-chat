import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import User from '@/models/User';
import Channel from '@/models/Channel';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, confirmPassword } = await req.json();

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Username validation (3-30 characters, alphanumeric and underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    await connectMongoose();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return NextResponse.json(
        { success: false, error: `${field} already exists` },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      status: 'online',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
    });

    await user.save();

    // Add user to general channel
    const generalChannel = await Channel.findOne({ name: 'general' });
    if (generalChannel) {
      generalChannel.members.push(user._id);
      await generalChannel.save();
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const userResponse = user.toJSON();

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Registration successful'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}