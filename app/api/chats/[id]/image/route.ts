import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Chats } from '@/lib/db/chat';
import { uploadGroupMedia } from '@/lib/minio-utils';
import sharp from 'sharp';

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
      return NextResponse.json({ error: 'Cannot upload image for direct message' }, { status: 400 });
    }

    // Check if user is admin or moderator
    const isAdmin = chat.admin?.email === userEmail;
    const isModerator = chat.moderators?.some((mod: any) => mod.email === userEmail);
    
    if (!isAdmin && !isModerator) {
      return NextResponse.json({ error: 'Only admin and moderators can change group image' }, { status: 403 });
    }

    const data = await request.formData();
    const file: File | null = data.get('image') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be less than 5MB' }, { status: 400 });
    }

    // Convert file to buffer and optimize with sharp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize image with sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    try {
      // Delete old group avatar if it exists
      if (chat.groupAvatar) {
        console.log('🗑️ Old group avatar would be deleted:', chat.groupAvatar);
        // TODO: Implement MinIO deletion if needed
      }

      // Create a File-like object for MinIO upload
      const optimizedFile = new File([new Uint8Array(optimizedBuffer)], `group-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Upload to MinIO
      const downloadURL = await uploadGroupMedia(optimizedFile, chatId);

      // Update chat with new image URL
      chat.groupAvatar = downloadURL;
      await chat.save();

      return NextResponse.json({
        message: 'Group image updated successfully',
        imageUrl: downloadURL
      });
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error uploading group image:', error);
    return NextResponse.json({ error: 'Failed to upload group image' }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Cannot remove image from direct message' }, { status: 400 });
    }

    // Check if user is admin or moderator
    const isAdmin = chat.admin?.email === userEmail;
    const isModerator = chat.moderators?.some((mod: any) => mod.email === userEmail);
    
    if (!isAdmin && !isModerator) {
      return NextResponse.json({ error: 'Only admin and moderators can remove group image' }, { status: 403 });
    }

    // Remove the image file if it exists
    if (chat.groupAvatar) {
      try {
        // Delete image from MinIO Storage
        console.log('🗑️ Group avatar would be deleted:', chat.groupAvatar);
        // TODO: Implement MinIO deletion if needed
        console.log('✅ Group avatar deletion skipped (MinIO implementation needed)');
      } catch (error) {
        console.error('Error deleting image from storage:', error);
        // Continue anyway - we'll still remove the reference from database
      }
    }

    // Remove image URL from chat
    chat.groupAvatar = null;
    await chat.save();

    return NextResponse.json({
      message: 'Group image removed successfully'
    });
  } catch (error) {
    console.error('Error removing group image:', error);
    return NextResponse.json({ error: 'Failed to remove group image' }, { status: 500 });
  }
}
