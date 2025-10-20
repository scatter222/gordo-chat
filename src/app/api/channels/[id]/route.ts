import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectMongoose } from '@/lib/mongodb';
// Import all models to ensure they're registered for populate operations
import { Channel, User, Message } from '@/lib/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongoose();

    const channel = await Channel.findById(params.id)
      .populate('members', 'username avatar status bio')
      .populate('admins', 'username avatar')
      .populate('owner', 'username avatar');

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the channel
    const isMember = channel.members.some(
      (member: any) => member._id.toString() === session.user.id
    );

    if (channel.type === 'private' && !isMember) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: channel
    });

  } catch (error: any) {
    console.error('Get channel error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get channel' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, avatar } = await req.json();

    await connectMongoose();

    const channel = await Channel.findById(params.id);

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or owner
    const isAdmin = channel.admins.includes(session.user.id) ||
                    channel.owner?.toString() === session.user.id;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only admins can update channel' },
        { status: 403 }
      );
    }

    // Update fields if provided
    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (avatar !== undefined) channel.avatar = avatar;

    await channel.save();

    await channel.populate('members', 'username avatar status');

    return NextResponse.json({
      success: true,
      data: channel,
      message: 'Channel updated successfully'
    });

  } catch (error: any) {
    console.error('Update channel error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update channel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongoose();

    const channel = await Channel.findById(params.id);

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (channel.owner?.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only channel owner can delete the channel' },
        { status: 403 }
      );
    }

    await channel.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Channel deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete channel error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete channel' },
      { status: 500 }
    );
  }
}