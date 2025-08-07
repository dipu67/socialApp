import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

export async function POST(
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
      return NextResponse.json({ error: 'Cannot modify moderators in direct message' }, { status: 400 });
    }

    // Check if user is admin
    if (chat.admin?.email !== userEmail) {
      return NextResponse.json({ error: 'Only admin can promote/demote moderators' }, { status: 403 });
    }

    // Find the member
    const member = await Users.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if member is in the chat
    const isMember = chat.participants.some((participant: any) => 
      participant._id.toString() === memberId
    );
    if (!isMember) {
      return NextResponse.json({ error: 'User is not a member of this chat' }, { status: 400 });
    }

    // Cannot promote/demote admin
    if (chat.admin?._id.toString() === memberId) {
      return NextResponse.json({ error: 'Cannot modify admin permissions' }, { status: 400 });
    }

    // Initialize moderators array if it doesn't exist
    if (!chat.moderators) {
      chat.moderators = [];
    }

    // Check if user is already a moderator
    const isModerator = chat.moderators.some((moderator: any) => 
      moderator._id.toString() === memberId
    );

    if (isModerator) {
      // Demote from moderator
      chat.moderators = chat.moderators.filter((moderator: any) => 
        moderator._id.toString() !== memberId
      );
      await chat.save();
      return NextResponse.json({
        message: 'Member demoted from moderator',
        action: 'demoted'
      });
    } else {
      // Promote to moderator
      chat.moderators.push(memberId);
      await chat.save();
      return NextResponse.json({
        message: 'Member promoted to moderator',
        action: 'promoted'
      });
    }
  } catch (error) {
    console.error('Error modifying moderator:', error);
    return NextResponse.json({ error: 'Failed to modify moderator' }, { status: 500 });
  }
}
