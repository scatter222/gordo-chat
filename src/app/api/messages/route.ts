import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectMongoose } from '@/lib/mongodb';
import Message from '@/models/Message';
import Channel from '@/models/Channel';
import { Types } from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    await connectMongoose();

    // Check if user has access to the channel
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    const isMember = channel.members.includes(session.user.id);

    if (channel.type === 'private' && !isMember) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build query
    const query: any = {
      channelId: channelId,
      deletedAt: null
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages
    const messages = await Message.find(query)
      .populate('userId', 'username avatar status')
      .populate('replyTo')
      .populate('mentions', 'username')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Reverse to get chronological order
    messages.reverse();

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get messages' },
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

    const { channelId, content, type = 'text', attachments, replyTo, mentions } = await req.json();

    // Validation
    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    if (type === 'text' && (!content || !content.trim())) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    await connectMongoose();

    // Check if user has access to the channel
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    const isMember = channel.members.includes(session.user.id);

    if (!isMember) {
      return NextResponse.json(
        { success: false, error: 'You must be a member of the channel to send messages' },
        { status: 403 }
      );
    }

    // Create message
    const message = new Message({
      channelId,
      userId: session.user.id,
      content,
      type,
      attachments,
      replyTo,
      mentions,
      readBy: [session.user.id]
    });

    await message.save();

    // Update channel's last activity and last message
    channel.lastActivity = new Date();
    channel.lastMessage = message._id as Types.ObjectId;
    await channel.save();

    // Populate fields for response
    await message.populate('userId', 'username avatar status');
    if (replyTo) {
      await message.populate('replyTo');
    }

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}