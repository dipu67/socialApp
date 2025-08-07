import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";import sharp from 'sharp';

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
    const type = formData.get('type') as string; // 'profile' or 'cover'

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

    // Optimize image based on type
    let optimizedBuffer: Buffer;
    let dimensions: { width: number; height: number };

    if (type === 'profile') {
      // Profile image: 400x400, circular crop
      dimensions = { width: 400, height: 400 };
      optimizedBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } else if (type === 'cover') {
      // Cover image: 1200x400, banner crop
      dimensions = { width: 1200, height: 400 };
      optimizedBuffer = await sharp(buffer)
        .resize(1200, 400, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } else if (type === 'post') {
      // Post image: max 800px width, maintain aspect ratio
      const metadata = await sharp(buffer).metadata();
      const originalWidth = metadata.width || 800;
      const originalHeight = metadata.height || 600;
      
      if (originalWidth > 800) {
        const ratio = 800 / originalWidth;
        dimensions = { width: 800, height: Math.round(originalHeight * ratio) };
        optimizedBuffer = await sharp(buffer)
          .resize(800, Math.round(originalHeight * ratio), { fit: 'inside' })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
      } else {
        dimensions = { width: originalWidth, height: originalHeight };
        optimizedBuffer = await sharp(buffer)
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "profile", "cover", or "post"' },
        { status: 400 }
      );
    }

    // Convert optimized buffer to base64 for client-side upload
    const base64Image = optimizedBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    return NextResponse.json({
      message: 'Image optimized successfully',
      imageData: `data:${mimeType};base64,${base64Image}`,
      dimensions,
      size: optimizedBuffer.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
