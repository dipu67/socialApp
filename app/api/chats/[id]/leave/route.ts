import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';
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
    const userEmail = session.user.email;

    // Find the chat
    const chat = await Chats.findById(chatId).populate('participants admin moderators');
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (!chat.isGroupChat) {
      return NextResponse.json({ error: 'Cannot leave a direct message' }, { status: 400 });
    }

    // Check if user is admin
    if (chat.admin?.email === userEmail) {
      return NextResponse.json({ error: 'Admin cannot leave group. Transfer admin rights first.' }, { status: 400 });
    }

    // Find the user
    const user = await Users.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove user from participants
    chat.participants = chat.participants.filter((participant: any) => 
      participant._id.toString() !== user._id.toString()
    );

    // Remove user from moderators if they are one
    chat.moderators = chat.moderators?.filter((moderator: any) => 
      moderator._id.toString() !== user._id.toString()
    ) || [];

    await chat.save();

    return NextResponse.json({
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}
