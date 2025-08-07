import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Messages } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const chatId = (await params).id;

    // Find the current user
    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark all unread messages in this chat as read by the current user
    const result = await Messages.updateMany(
      {
        chatId: chatId,
        senderId: { $ne: currentUser._id }, // Don't mark own messages
        'readBy.userId': { $ne: currentUser._id } // Only messages not already read by user
      },
      {
        $push: {
          readBy: {
            userId: currentUser._id,
            readAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      markedAsRead: result.modifiedCount,
      message: `Marked ${result.modifiedCount} messages as read`
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
