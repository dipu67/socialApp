# Cloudflare R2 Storage Migration Guide

This project has been migrated from MinIO to Cloudflare R2 storage for better scalability and performance.

## Setup Instructions

### 1. Create Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., `social-app-storage`)
4. Note down your Account ID

### 2. Generate R2 API Tokens

1. Go to R2 > Manage R2 API tokens
2. Create a new API token with the following permissions:
   - Object:Read
   - Object:Write
   - Object:Delete
3. Note down the Access Key ID and Secret Access Key

### 3. Environment Variables

Update your `.env` file with the following:

```env
# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
R2_BUCKET_NAME=social-app-storage
R2_ACCOUNT_ID=your_cloudflare_account_id_here
R2_PUBLIC_URL=https://your-custom-domain.com
```

### 4. Custom Domain (Optional but Recommended)

For production, set up a custom domain for your R2 bucket:

1. Go to R2 > your bucket > Settings
2. Connect a custom domain
3. Update `R2_PUBLIC_URL` with your custom domain

### 5. File Organization

R2 uses a single bucket with folder structure:
- `profiles/` - Profile images
- `posts/` - Post media
- `chats/` - Chat media  
- `covers/` - Cover images
- `groups/` - Group media

## Migration Benefits

✅ **Global CDN**: Faster file delivery worldwide
✅ **Cost Effective**: Lower storage and bandwidth costs
✅ **Scalability**: Automatic scaling for any load
✅ **Reliability**: 99.9% uptime SLA
✅ **S3 Compatible**: Same API as AWS S3

## File URLs

Files will be accessible at:
- Default: `https://account-id.r2.cloudflarestorage.com/bucket-name/file-path`
- Custom Domain: `https://your-domain.com/file-path`

## Backward Compatibility

The existing MinIO code has been updated to work with R2 while maintaining backward compatibility. All existing MinIO URLs will continue to work during the transition period.

## Testing

1. Upload a profile picture
2. Create a post with an image
3. Check that files are accessible via the R2 URLs
4. Verify old images are properly deleted when replaced

## Troubleshooting

### CORS Issues
If you encounter CORS issues, configure CORS in your R2 bucket settings:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

### Authentication Errors
- Verify your API keys are correct
- Ensure the API token has the right permissions
- Check that the Account ID matches your Cloudflare account

### File Access Issues
- Ensure your bucket is publicly accessible
- Check the R2_PUBLIC_URL is correctly configured
- Verify custom domain DNS settings if using custom domain
