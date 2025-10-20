import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
// Import all models to ensure they're registered
import { User, Channel } from '@/lib/models';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password, confirmPassword } = await req.json();

    // Validation
    if (!username || !password || !confirmPassword) {
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

    // Username validation (3-30 characters, alphanumeric and underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    await connectMongoose();

    // Check if username already exists
    const existingUser = await User.findOne({
      username: username.toLowerCase()
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      username,
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