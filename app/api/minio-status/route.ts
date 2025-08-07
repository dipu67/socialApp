import { NextResponse } from 'next/server';
import { minioClient, BUCKETS } from '@/lib/minio';
import { HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    const status: any = {
      connection: 'unknown',
      buckets: {},
      timestamp: new Date().toISOString()
    };

    // Test each bucket
    for (const [name, bucketName] of Object.entries(BUCKETS)) {
      try {
        // Check if bucket exists
        await minioClient.send(new HeadBucketCommand({ Bucket: bucketName }));
        
        // List a few objects to test access
        const listResult = await minioClient.send(new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 5
        }));

        status.buckets[name] = {
          name: bucketName,
          exists: true,
          accessible: true,
          objectCount: listResult.KeyCount || 0,
          sampleObjects: listResult.Contents?.slice(0, 3).map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified
          })) || []
        };
      } catch (error) {
        status.buckets[name] = {
          name: bucketName,
          exists: false,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // If at least one bucket is accessible, connection is working
    status.connection = Object.values(status.buckets).some((bucket: any) => bucket.accessible) 
      ? 'connected' 
      : 'failed';

    return NextResponse.json(status);

  } catch (error) {
    return NextResponse.json({
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
