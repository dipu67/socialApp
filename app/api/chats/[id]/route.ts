import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';

export async function PUT(
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
    const { name, description } = await request.json();

    // Find the chat
    const chat = await Chats.findById(chatId).populate('participants admin moderators');
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is admin or moderator
    const userEmail = session.user.email;
    const isAdmin = chat.admin?.email === userEmail;
    const isModerator = chat.moderators?.some((mod: any) => mod.email === userEmail);

    if (!isAdmin && !isModerator) {
      return NextResponse.json({ error: 'Only admins and moderators can update group info' }, { status: 403 });
    }

    // Update the chat
    chat.groupName = name;
    chat.groupDescription = description;
    await chat.save();

    await chat.populate('participants admin moderators');

    return NextResponse.json({
      message: 'Group updated successfully',
      chat: chat.toObject()
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
