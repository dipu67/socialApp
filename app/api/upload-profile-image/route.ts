import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToMinio, initializeMinIOBuckets, deleteImageByUrl, isMinioUrl, generateFileKey, validateFile } from '@/lib/storage-utils';
import { BUCKETS } from '@/lib/storage';
import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';
import sharp from 'sharp';

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
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

    // Initialize R2 buckets
    await initializeMinIOBuckets();

    // Delete old profile image if it exists
    if (currentUser.avatar && isMinioUrl(currentUser.avatar)) {
      try {
        console.log('🗑️ Deleting old profile image from R2:', currentUser.avatar);
        await deleteImageByUrl(currentUser.avatar, BUCKETS.PROFILES);
        console.log('✅ Old profile image deleted successfully from R2');
      } catch (error) {
        console.warn('⚠️ Failed to delete old profile image from R2:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Convert file to buffer and optimize for profile picture
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image for profile (resize to 400x400, maintain aspect ratio)
    const optimizedBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // Upload new profile image to MinIO
    const fileName = `${Date.now()}.jpg`;
    const fileKey = generateFileKey(fileName, 'profiles', userId);
    
    const imageUrl = await uploadToMinio(
      optimizedBuffer,
      BUCKETS.PROFILES,
      fileKey,
      'image/jpeg'
    );

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
    
    // More specific error handling for common issues
    if (error instanceof Error) {
      // Handle specific Sharp errors
      if (error.message.includes('Input file contains unsupported image format')) {
        return NextResponse.json({ error: 'Unsupported image format. Please use JPG, PNG, or WebP.' }, { status: 400 });
      }
      
      // Handle file size errors
      if (error.message.includes('File size')) {
        return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
      }
      
      // Handle MinIO connection errors
      if (error.message.includes('Connection') || error.message.includes('Network')) {
        return NextResponse.json({ error: 'Upload service temporarily unavailable. Please try again.' }, { status: 503 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 });
  }
}
