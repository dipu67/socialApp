import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadProfileImage, initializeMinIOBuckets, deleteImageByUrl, isMinioUrl } from '@/lib/minio-utils';
import { BUCKETS } from '@/lib/minio';
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

    // Delete old profile image if it exists
    if (currentUser.avatar && isMinioUrl(currentUser.avatar)) {
      try {
        console.log('🗑️ Deleting old profile image:', currentUser.avatar);
        await deleteImageByUrl(currentUser.avatar, BUCKETS.PROFILES);
        console.log('✅ Old profile image deleted successfully');
      } catch (error) {
        console.warn('⚠️ Failed to delete old profile image:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new profile image to MinIO
    const imageUrl = await uploadProfileImage(file, userId);

    // Update user profile in database
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { 
        avatar: imageUrl,
        'media.profilePicture': imageUrl
      },
      { new: true, select: 'name email avatar' }
    );

    console.log('✅ Profile image uploaded and saved:', imageUrl);

    return NextResponse.json({ 
      url: imageUrl,
      message: 'Profile image uploaded and saved successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 });
  }
}
