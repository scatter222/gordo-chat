import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectMongoose } from '@/lib/mongodb';
import { User } from '@/lib/models';

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
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 1) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    await connectMongoose();

    // Search for users by username or email, excluding current user
    const users = await User.find({
      _id: { $ne: session.user.id },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('_id username email avatar status')
      .limit(10);

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error: any) {
    console.error('User search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}
