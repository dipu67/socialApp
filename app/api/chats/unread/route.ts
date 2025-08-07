import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats, Messages } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the current user
    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all chats where the user is a participant
    const chats = await Chats.find({
      participants: currentUser._id
    }).populate([
      {
        path: 'participants',
        select: 'name email avatar'
      },
      {
        path: 'admin',
        select: 'name email'
      },
      {
        path: 'moderators',
        select: 'name email'
      }
    ]);

    // For each chat, calculate unread message count
    const chatUnreadCounts = await Promise.all(
      chats.map(async (chat) => {
        // Count messages in this chat that the user hasn't read
        const unreadCount = await Messages.countDocuments({
          chatId: chat._id,
          senderId: { $ne: currentUser._id }, // Don't count own messages as unread
          'readBy.userId': { $ne: currentUser._id } // Messages not read by current user
        });

        return {
          chatId: chat._id,
          unreadCount,
          chat: {
            _id: chat._id,
            groupName: chat.groupName,
            groupAvatar: chat.groupAvatar,
            isGroupChat: chat.isGroupChat,
            participants: chat.participants,
            admin: chat.admin,
            moderators: chat.moderators,
            lastActivity: chat.lastActivity,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
          }
        };
      })
    );

    // Calculate total unread count across all chats
    const totalUnreadCount = chatUnreadCounts.reduce((total, chat) => total + chat.unreadCount, 0);

    return NextResponse.json({
      success: true,
      totalUnreadCount,
      chatUnreadCounts,
      chats: chatUnreadCounts.map(item => ({
        ...item.chat,
        unreadCount: item.unreadCount
      }))
    });

  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json({ error: 'Failed to fetch unread counts' }, { status: 500 });
  }
}
