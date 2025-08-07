import { NextResponse } from 'next/server';
import { initializeMinIOBuckets } from '@/lib/minio-utils';

export async function GET() {
  try {
    await initializeMinIOBuckets();
    return NextResponse.json({ 
      message: 'MinIO buckets initialized successfully!',
      buckets: [
        'profile-images',
        'cover-images', 
        'post-media',
        'chat-media',
        'group-media'
      ]
    });
  } catch (error) {
    console.error('MinIO initialization error:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize MinIO buckets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
