import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectMongoose } from '@/lib/mongodb';
// Import all models to ensure they're registered for populate operations
import { Channel, User, Message } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongoose();

    // Get all channels where user is a member or public channels
    const channels = await Channel.find({
      $or: [
        { type: 'public' },
        { members: session.user.id }
      ]
    })
      .populate('members', 'username avatar status')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    return NextResponse.json({
      success: true,
      data: channels
    });

  } catch (error: any) {
    console.error('Get channels error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get channels' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, type = 'public', members = [] } = await req.json();

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Channel name is required' },
        { status: 400 }
      );
    }

    await connectMongoose();

    // Check if channel name already exists
    const existingChannel = await Channel.findOne({ name: name.toLowerCase() });

    if (existingChannel) {
      return NextResponse.json(
        { success: false, error: 'Channel name already exists' },
        { status: 400 }
      );
    }

    // Create new channel
    const channel = new Channel({
      name,
      description,
      type,
      owner: session.user.id,
      admins: [session.user.id],
      members: [session.user.id, ...members],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    await channel.save();

    // Populate members for response
    await channel.populate('members', 'username avatar status');

    return NextResponse.json({
      success: true,
      data: channel,
      message: 'Channel created successfully'
    });

  } catch (error: any) {
    console.error('Create channel error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create channel' },
      { status: 500 }
    );
  }
}