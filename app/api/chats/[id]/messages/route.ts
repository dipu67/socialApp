import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Messages, Chats } from '@/lib/db/chat';
import { Users } from '@/lib/db/users';

// GET /api/chats/[id]/messages - Get messages for a specific chat
export async function GET(
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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is participant in the chat
    const chat = await Chats.findById(chatId);
    if (!chat || !chat.participants.includes(currentUser._id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const messages = await Messages.find({ chatId })
      .populate('senderId', 'name email avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chats/[id]/messages - Send a new message
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
    
    await connectDB();

    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is participant in the chat
    const chat = await Chats.findById(chatId);
    if (!chat || !chat.participants.includes(currentUser._id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if request contains FormData (file upload) or JSON
    const contentType = request.headers.get('content-type');
    let content, messageType, fileUrl, fileName, fileSize, replyTo, file;

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      content = formData.get('content') as string;
      messageType = formData.get('messageType') as string;
      file = formData.get('file') as File;
      replyTo = formData.get('replyTo') as string;

      // Upload file to MinIO if present
      if (file) {
        try {
          // Import MinIO utilities
          const { uploadChatMedia, initializeMinIOBuckets, getFileType } = await import('@/lib/minio-utils');

          // Initialize buckets if not already done
          await initializeMinIOBuckets();

          // Upload file to MinIO
          fileUrl = await uploadChatMedia(file, chatId, currentUser._id.toString());
          fileName = file.name;
          fileSize = file.size;

          // Determine message type based on file
          const detectedType = getFileType(file.type);
          if (!messageType) {
            messageType = detectedType === 'other' ? 'file' : detectedType;
          }

          console.log('File uploaded to MinIO:', fileUrl);
        } catch (error) {
          console.error('Error uploading file to MinIO:', error);
          return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
        }
      }
    } else {
      // Handle JSON request
      const body = await request.json();
      content = body.content;
      messageType = body.messageType;
      fileUrl = body.fileUrl;
      fileName = body.fileName;
      fileSize = body.fileSize;
      replyTo = body.replyTo;
    }

    // Validate message content
    if (!content && !fileUrl) {
      return NextResponse.json({ error: 'Message content or file is required' }, { status: 400 });
    }

    // Create message
    const messageData: any = {
      chatId,
      senderId: currentUser._id,
      messageType: messageType || 'text',
      readBy: [{ userId: currentUser._id, readAt: new Date() }]
    };

    if (content) messageData.content = content;
    if (fileUrl) messageData.fileUrl = fileUrl;
    if (fileName) messageData.fileName = fileName;
    if (fileSize) messageData.fileSize = fileSize;
    if (replyTo) messageData.replyTo = replyTo;

    const message = new Messages(messageData);
    await message.save();

    // Update chat's last message and activity
    await Chats.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastActivity: new Date()
    });

    const populatedMessage = await Messages.findById(message._id)
      .populate('senderId', 'name email avatar')
      .populate('replyTo');

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
