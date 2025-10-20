import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectMongoose } from '@/lib/mongodb';
import { Channel, User } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot create DM with yourself' },
        { status: 400 }
      );
    }

    await connectMongoose();

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a unique identifier for the DM channel (hash of sorted user IDs)
    const userIds = [session.user.id, targetUserId].sort();
    const dmIdentifier = `${userIds[0]}-${userIds[1]}`;
    const dmHash = createHash('sha256').update(dmIdentifier).digest('hex').substring(0, 20);
    const channelName = `dm_${dmHash}`;

    // Find or create the direct message channel
    let channel = await Channel.findOne({
      type: 'direct',
      members: { $all: [session.user.id, targetUserId] }
    }).populate('members', 'username avatar status');

    if (!channel) {
      // Create new DM channel
      channel = new Channel({
        name: channelName,
        type: 'direct',
        members: [session.user.id, targetUserId],
        owner: session.user.id,
      });

      await channel.save();
      await channel.populate('members', 'username avatar status');
    }

    return NextResponse.json({
      success: true,
      data: channel,
      message: 'DM channel ready'
    });

  } catch (error: any) {
    console.error('Create DM error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create DM' },
      { status: 500 }
    );
  }
}

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

    // Get all direct message channels for the current user
    const dms = await Channel.find({
      type: 'direct',
      members: session.user.id
    })
      .populate('members', 'username avatar status')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    return NextResponse.json({
      success: true,
      data: dms
    });

  } catch (error: any) {
    console.error('Get DMs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get DMs' },
      { status: 500 }
    );
  }
}
