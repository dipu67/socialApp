# MinIO File Storage Setup

This chat application uses MinIO for file storage, including profile images, cover images, post media, and chat files.

## Quick Start

### 1. Start MinIO Server

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose -f docker-compose.minio.yml up -d
```

**Option B: Using Docker directly**
```bash
docker run -d \
  --name chat-app-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v minio_data:/data \
  minio/minio server /data --console-address ":9001"
```

**Option C: Local installation**
- Download MinIO from https://min.io/download
- Run: `minio server ./data --console-address ":9001"`

### 2. Access MinIO Console

Open http://localhost:9001 in your browser and login with:
- Username: `minioadmin`
- Password: `minioadmin`

### 3. Initialize Buckets

Run the setup script to create all required buckets:
```bash
node scripts/setup-minio.js
```

Or manually create buckets in the MinIO console:
- `profile-images` - User profile pictures
- `cover-images` - User cover photos  
- `post-media` - Post images and videos
- `chat-media` - Chat files, images, videos
- `group-media` - Group avatars and media

### 4. Environment Variables

Make sure these are set in your `.env.local`:
```env
MINIO_ENDPOINT=http://localhost:9001
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1
```

## API Endpoints

The following upload endpoints are available:

- `POST /api/upload-profile-image` - Upload profile images
- `POST /api/upload-cover-image` - Upload cover images
- `POST /api/upload-post-image` - Upload post media
- `POST /api/upload-group-media` - Upload group avatars
- `POST /api/chats/[id]/messages` - Upload chat files (FormData)

## Frontend Usage

Use the provided hooks for easy file uploads:

```typescript
import { useProfileImageUpload } from '@/hooks/useMinIOUpload';

function ProfileUpload({ userId }) {
  const { uploadProfileImage, uploading, progress, error } = useProfileImageUpload(userId, {
    onSuccess: (url) => console.log('Uploaded:', url),
    onError: (error) => console.error('Upload failed:', error),
  });

  const handleFileSelect = async (file: File) => {
    try {
      const url = await uploadProfileImage(file);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {uploading && <p>Uploading... {progress?.percentage}%</p>}
      {error && <p>Error: {error}</p>}
      <input type="file" onChange={e => handleFileSelect(e.target.files[0])} />
    </div>
  );
}
```

## File Storage Structure

```
MinIO Buckets:
├── profile-images/
│   └── profiles/
│       └── {userId}/
│           └── {timestamp}-{uuid}.{ext}
├── cover-images/
│   └── covers/
│       └── {userId}/
│           └── {timestamp}-{uuid}.{ext}
├── post-media/
│   └── posts/
│       └── {userId}/
│           └── {timestamp}-{uuid}.{ext}
├── chat-media/
│   └── chats/
│       └── {chatId}/
│           └── {userId}/
│               └── {timestamp}-{uuid}.{ext}
└── group-media/
    └── groups/
        └── {groupId}/
            └── {timestamp}-{uuid}.{ext}
```

## File Size Limits

- Images: 10MB
- Videos: 100MB  
- Documents: 50MB
- Other files: 50MB

## Supported File Types

- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Videos**: MP4, AVI, MOV, WMV, FLV, WebM
- **Documents**: PDF, DOC, DOCX

## Production Setup

For production, update your environment variables:

```env
MINIO_ENDPOINT=https://your-minio-server.com
MINIO_ACCESS_KEY=your-production-access-key
MINIO_SECRET_KEY=your-production-secret-key
MINIO_REGION=us-east-1
```

## Troubleshooting

1. **Connection Failed**: Ensure MinIO is running on port 9001
2. **Bucket Not Found**: Run the setup script or create buckets manually
3. **Upload Failed**: Check file size limits and supported file types
4. **Permission Denied**: Verify access keys and bucket policies

## Security Notes

- Change default credentials in production
- Set appropriate bucket policies
- Use HTTPS in production
- Consider implementing signed URLs for private files
