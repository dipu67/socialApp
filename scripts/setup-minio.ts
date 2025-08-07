#!/usr/bin/env node

/**
 * MinIO Setup Script
 * This script initializes all required buckets for the chat application
 */

const { initializeMinIOBuckets } = require('../lib/minio-utils');

async function setupMinIO() {
  console.log('🚀 Starting MinIO setup...');
  
  try {
    await initializeMinIOBuckets();
    console.log('✅ MinIO setup completed successfully!');
    console.log('\n📦 Created buckets:');
    console.log('  - profile-images (for user profile pictures)');
    console.log('  - cover-images (for user cover photos)');
    console.log('  - post-media (for post images and videos)');
    console.log('  - chat-media (for chat files, images, videos)');
    console.log('  - group-media (for group avatars and media)');
    console.log('\n🎉 Your MinIO instance is ready for file uploads!');
  } catch (error:any) {
    console.error('❌ MinIO setup failed:', error.message);
    console.log('\n🔍 Please check:');
    console.log('  1. MinIO server is running on port 9001');
    console.log('  2. Environment variables are set correctly:');
    console.log('     - MINIO_ENDPOINT=http://localhost:9001');
    console.log('     - MINIO_ACCESS_KEY=minioadmin');
    console.log('     - MINIO_SECRET_KEY=minioadmin');
    console.log('  3. MinIO is accessible from your application');
    process.exit(1);
  }
}

setupMinIO();
