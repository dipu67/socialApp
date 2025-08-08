import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadCoverImage, initializeMinIOBuckets, deleteImageByUrl, isMinioUrl } from '@/lib/storage-utils';
import { BUCKETS } from '@/lib/storage';
import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Connect to MongoDB first to get current user data
    await connectDB();
    
    const currentUser = await Users.findById(userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is updating their own profile or has permission
    if (currentUser.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized to update this profile' }, { status: 403 });
    }

    // Initialize MinIO buckets
    await initializeMinIOBuckets();

    // Delete old cover image if it exists
    if (currentUser.coverImage && isMinioUrl(currentUser.coverImage)) {
      try {
        console.log('🗑️ Deleting old cover image:', currentUser.coverImage);
        await deleteImageByUrl(currentUser.coverImage, BUCKETS.COVERS);
        console.log('✅ Old cover image deleted successfully');
      } catch (error) {
        console.warn('⚠️ Failed to delete old cover image:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new cover image to MinIO
    const imageUrl = await uploadCoverImage(file, userId);

    // Update user profile in database
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { 
        coverImage: imageUrl,
        'media.coverPhoto': imageUrl
      },
      { new: true, select: 'name email avatar coverImage' }
    );

    console.log('✅ Cover image uploaded and saved:', imageUrl);

    return NextResponse.json({ 
      url: imageUrl,
      message: 'Cover image uploaded and saved successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error uploading cover image:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 });
  }
}
