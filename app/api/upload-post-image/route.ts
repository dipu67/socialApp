import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { uploadToMinio, initializeMinIOBuckets, generateFileKey } from '@/lib/storage-utils';
import { BUCKETS } from '@/lib/storage';
import { Users } from '@/lib/db/users';
import { connectDB } from '@/lib/db/db';
import sharp from 'sharp';

// Keep using the existing storage-utils for backward compatibility
// The storage-utils now internally uses R2

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
      
      // Generate file key for organization
      const fileName = `${Date.now()}.jpg`;
      
      // Connect to database to get user info
      await connectDB();
      const user = await Users.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      const fileKey = generateFileKey(fileName, 'posts', user._id.toString());
      
      console.log('Uploading post image to R2 storage');
      
      // Upload the optimized image buffer directly to R2
      const downloadURL = await uploadToMinio(
        optimizedBuffer,
        BUCKETS.POSTS,
        fileKey,
        'image/jpeg'
      );
      
      console.log('Post image uploaded successfully to R2:', downloadURL);

      return NextResponse.json({
        message: 'Image uploaded successfully',
        imageUrl: downloadURL
      });
    } catch (uploadError) {
      console.error('Error uploading to MinIO:', uploadError);
      throw uploadError;
    }

  } catch (error) {
    console.error('Error creating post:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      // Handle specific Sharp errors
      if (error.message.includes('Input file contains unsupported image format')) {
        return NextResponse.json({ error: 'Unsupported image format. Please use JPG, PNG, or WebP.' }, { status: 400 });
      }
      
      // Handle file size errors
      if (error.message.includes('File size')) {
        return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
      }
      
      // Handle database errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        return NextResponse.json({ error: 'Invalid post data. Please check your input.' }, { status: 400 });
      }
      
      // Handle MinIO connection errors
      if (error.message.includes('Connection') || error.message.includes('Network')) {
        return NextResponse.json({ error: 'Upload service temporarily unavailable. Please try again.' }, { status: 503 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create post. Please try again.' },
      { status: 500 }
    );
  }
}
