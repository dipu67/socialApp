import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const chatId = (await params).id;
    const memberId = (await params).memberId;
    const userEmail = session.user.email;

    // Find the chat
    const chat = await Chats.findById(chatId).populate('participants admin moderators');
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (!chat.isGroupChat) {
      return NextResponse.json({ error: 'Cannot remove members from direct message' }, { status: 400 });
    }

    // Check if user is admin
    if (chat.admin?.email !== userEmail) {
      return NextResponse.json({ error: 'Only admin can remove members' }, { status: 403 });
    }

    // Find the member to remove
    const memberToRemove = await Users.findById(memberId);
    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove admin
    if (chat.admin?._id.toString() === memberId) {
      return NextResponse.json({ error: 'Cannot remove admin' }, { status: 400 });
    }

    // Remove member from participants
    chat.participants = chat.participants.filter((participant: any) => 
      participant._id.toString() !== memberId
    );

    // Remove member from moderators if they are one
    chat.moderators = chat.moderators?.filter((moderator: any) => 
      moderator._id.toString() !== memberId
    ) || [];

    await chat.save();

    return NextResponse.json({
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
