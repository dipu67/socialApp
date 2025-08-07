import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';
import mongoose from 'mongoose';

// GET /api/chats - Get all chats for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const chats = await Chats.find({
      participants: currentUser._id
    })
    .populate('participants', 'name email avatar')
    .populate('lastMessage')
    .populate('admin', 'name email')
    .sort({ lastActivity: -1 });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chats - Create new chat (direct or group)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantIds, isGroupChat, groupName, groupDescription } = await request.json();

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate participants
    if (!participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json({ error: 'Invalid participants' }, { status: 400 });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([currentUser._id.toString(), ...participantIds])];

    // For direct chat, check if chat already exists
    if (!isGroupChat && allParticipants.length === 2) {
      const existingChat = await Chats.findOne({
        participants: { $all: allParticipants, $size: 2 },
        isGroupChat: false
      });

      if (existingChat) {
        return NextResponse.json({ chat: existingChat });
      }
    }

    // Create new chat
    const chatData: any = {
      participants: allParticipants,
      isGroupChat: !!isGroupChat,
      lastActivity: new Date()
    };

    if (isGroupChat) {
      if (!groupName) {
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
      }
      chatData.groupName = groupName;
      chatData.groupDescription = groupDescription;
      chatData.admin = currentUser._id;
    }

    const chat = new Chats(chatData);
    await chat.save();

    const populatedChat = await Chats.findById(chat._id)
      .populate('participants', 'name email avatar')
      .populate('admin', 'name email');

    return NextResponse.json({ chat: populatedChat }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
