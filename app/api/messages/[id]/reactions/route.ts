import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Messages, Chats } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

// POST /api/messages/[id]/reactions - Add or toggle reaction to a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = await params;
    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const message = await Messages.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is part of the chat
    const chat = await Chats.findById(message.chatId);
    if (!chat || !chat.participants.includes(currentUser._id.toString())) {
      return NextResponse.json({ error: 'Not authorized to react to this message' }, { status: 403 });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      (reaction: any) => reaction.emoji === emoji && reaction.users.includes(currentUser._id.toString())
    );

    if (existingReactionIndex !== -1) {
      // Remove reaction
      await Messages.findByIdAndUpdate(messageId, {
        $pull: { 
          'reactions.$[elem].users': currentUser._id 
        }
      }, {
        arrayFilters: [{ 'elem.emoji': emoji }]
      });

      // Remove empty reaction objects
      await Messages.findByIdAndUpdate(messageId, {
        $pull: { 
          reactions: { users: { $size: 0 } }
        }
      });
    } else {
      // Add reaction
      const existingEmojiIndex = message.reactions.findIndex(
        (reaction: any) => reaction.emoji === emoji
      );

      if (existingEmojiIndex !== -1) {
        // Add user to existing emoji reaction
        await Messages.findByIdAndUpdate(messageId, {
          $push: { 
            'reactions.$[elem].users': currentUser._id 
          }
        }, {
          arrayFilters: [{ 'elem.emoji': emoji }]
        });
      } else {
        // Create new emoji reaction
        await Messages.findByIdAndUpdate(messageId, {
          $push: { 
            reactions: {
              emoji,
              users: [currentUser._id]
            }
          }
        });
      }
    }

    const updatedMessage = await Messages.findById(messageId)
      .populate('senderId', 'name email avatar')
      .populate('reactions.users', 'name email avatar');

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/messages/[id]/reactions - Remove all reactions from a message (admin/moderator only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = await params;

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const message = await Messages.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const chat = await Chats.findById(message.chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is admin, moderator, or message sender
    const isAdmin = chat.admin?.toString() === currentUser._id.toString();
    const isModerator = chat.moderators?.some((mod: any) => mod.toString() === currentUser._id.toString());
    const isMessageSender = message.senderId.toString() === currentUser._id.toString();
    
    if (!isAdmin && !isModerator && !isMessageSender) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Clear all reactions
    await Messages.findByIdAndUpdate(messageId, {
      $set: { reactions: [] }
    });

    const updatedMessage = await Messages.findById(messageId)
      .populate('senderId', 'name email avatar')
      .populate('reactions.users', 'name email avatar');

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Error clearing reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
