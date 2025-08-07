import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { uploadPostMedia, initializeMinIOBuckets } from '@/lib/minio-utils';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image for posts (max width 800px, maintain aspect ratio)
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;
    
    let optimizedBuffer: Buffer;
    
    if (originalWidth > 800) {
      const ratio = 800 / originalWidth;
      optimizedBuffer = await sharp(buffer)
        .resize(800, Math.round(originalHeight * ratio), { fit: 'inside' })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
    } else {
      optimizedBuffer = await sharp(buffer)
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
    }

    // Upload to MinIO Storage
    try {
      // Initialize MinIO buckets
      await initializeMinIOBuckets();
      
      // Create a File object from the optimized buffer
      const optimizedFile = new File([new Uint8Array(optimizedBuffer)], `${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      
      // Get user ID for folder structure
      const userId = 'test-user'; // Temporary for testing
      // const userId = session.user.email; // Use this when auth is enabled
      
      console.log('Uploading post image to MinIO');
      
      // Upload the optimized image to MinIO
      const downloadURL = await uploadPostMedia(optimizedFile, userId || 'unknown');
      
      console.log('Post image uploaded successfully:', downloadURL);

      // Save image URL to database (you can extend this to save to Posts collection)
      // Example: Create a post record or update existing post with image URL
      // await connectDB();
      // const post = await Posts.create({
      //   author: userId,
      //   image: downloadURL,
      //   title: 'Image Post',
      //   content: 'Post with uploaded image'
      // });

      return NextResponse.json({
        message: 'Image uploaded successfully',
        imageUrl: downloadURL,
        // post: post // Include if saving to database
      });
    } catch (uploadError) {
      console.error('Error uploading to MinIO:', uploadError);
      throw uploadError;
    }

  } catch (error) {
    console.error('Error uploading post image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
