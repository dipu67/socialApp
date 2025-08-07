import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadGroupMedia, initializeMinIOBuckets } from '@/lib/minio-utils';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Initialize MinIO buckets
    await initializeMinIOBuckets();

    // Upload group media (avatar, etc.) to MinIO
    const imageUrl = await uploadGroupMedia(file, groupId);

    // Connect to MongoDB and update group/chat
    await connectDB();
    
    const updatedChat = await Chats.findByIdAndUpdate(
      groupId,
      { groupAvatar: imageUrl },
      { new: true, select: 'groupName groupDescription groupAvatar participants' }
    );

    if (!updatedChat) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      url: imageUrl,
      message: 'Group media uploaded and saved successfully',
      group: updatedChat
    });

  } catch (error) {
    console.error('Error uploading group media:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to upload group media' }, { status: 500 });
  }
}
