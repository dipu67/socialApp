import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

// POST /api/chats/[id]/members - Add member to group
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;
    const { userId, userIds } = await request.json();

    // Support both single user and multiple users
    const idsToAdd = userIds || (userId ? [userId] : []);
    
    if (!idsToAdd || idsToAdd.length === 0) {
      return NextResponse.json({ error: 'User ID(s) required' }, { status: 400 });
    }

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const chat = await Chats.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return NextResponse.json({ error: 'Chat not found or not a group' }, { status: 404 });
    }

    // Check if user is admin or moderator
    const isAdmin = chat.admin?.toString() === currentUser._id.toString();
    const isModerator = chat.moderators?.some((mod:any) => mod.toString() === currentUser._id.toString());

    if (!isAdmin && !isModerator) {
      return NextResponse.json({ error: 'Only admins and moderators can add members' }, { status: 403 });
    }

    // Check which users are not already members
    const currentParticipantIds = chat.participants.map((p: any) => p.toString());
    const newUserIds = idsToAdd.filter((id: string) => !currentParticipantIds.includes(id));
    
    if (newUserIds.length === 0) {
      return NextResponse.json({ error: 'All users are already members' }, { status: 400 });
    }

    // Verify all users exist
    const usersToAdd = await Users.find({ _id: { $in: newUserIds } });
    if (usersToAdd.length !== newUserIds.length) {
      return NextResponse.json({ error: 'Some users not found' }, { status: 404 });
    }

    // Add users to participants
    await Chats.findByIdAndUpdate(chatId, {
      $push: { participants: { $each: newUserIds } }
    });

    const updatedChat = await Chats.findById(chatId)
      .populate('participants', 'name email avatar')
      .populate('admin', 'name email')
      .populate('moderators', 'name email');

    return NextResponse.json({ 
      chat: updatedChat, 
      message: `${newUserIds.length} member(s) added successfully`,
      addedCount: newUserIds.length
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chats/[id]/members - Remove member from group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const chat = await Chats.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return NextResponse.json({ error: 'Chat not found or not a group' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = chat.admin?.toString() === currentUser._id.toString();
    const isModerator = chat.moderators?.some((mod:any) => mod.toString() === currentUser._id.toString());
    const isRemovingSelf = userId === currentUser._id.toString();
    
    if (!isAdmin && !isModerator && !isRemovingSelf) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Remove user from participants
    await Chats.findByIdAndUpdate(chatId, {
      $pull: { 
        participants: userId,
        moderators: userId
      }
    });

    const updatedChat = await Chats.findById(chatId)
      .populate('participants', 'name email avatar')
      .populate('admin', 'name email')
      .populate('moderators', 'name email');

    return NextResponse.json({ chat: updatedChat });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
