import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

// POST /api/chats/[id]/moderators - Add moderator to group
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
    const { userId } = await request.json();

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const chat = await Chats.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return NextResponse.json({ error: 'Chat not found or not a group' }, { status: 404 });
    }

    // Only admin can add moderators
    const isAdmin = chat.admin?.toString() === currentUser._id.toString();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admin can add moderators' }, { status: 403 });
    }

    // Check if user is a group member
    if (!chat.participants.includes(userId)) {
      return NextResponse.json({ error: 'User must be a group member' }, { status: 400 });
    }

    // Check if user is already a moderator
    const isAlreadyModerator = chat.moderators?.some((mod: any) => mod.toString() === userId);
    if (isAlreadyModerator) {
      return NextResponse.json({ error: 'User is already a moderator' }, { status: 400 });
    }

    // Add user to moderators
    await Chats.findByIdAndUpdate(chatId, {
      $push: { moderators: userId }
    });

    const updatedChat = await Chats.findById(chatId)
      .populate('participants', 'name email avatar')
      .populate('admin', 'name email')
      .populate('moderators', 'name email');

    return NextResponse.json({ chat: updatedChat });
  } catch (error) {
    console.error('Error adding moderator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chats/[id]/moderators - Remove moderator from group
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

    // Only admin can remove moderators
    const isAdmin = chat.admin?.toString() === currentUser._id.toString();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admin can remove moderators' }, { status: 403 });
    }

    // Remove user from moderators
    await Chats.findByIdAndUpdate(chatId, {
      $pull: { moderators: userId }
    });

    const updatedChat = await Chats.findById(chatId)
      .populate('participants', 'name email avatar')
      .populate('admin', 'name email')
      .populate('moderators', 'name email');

    return NextResponse.json({ chat: updatedChat });
  } catch (error) {
    console.error('Error removing moderator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
