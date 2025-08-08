# R2 Public URL Configuration Update

## Changes Made

### Environment Configuration
Updated `.env` file to use R2 Public Development URL:
```
R2_PUBLIC_URL=https://pub-2f0e8ac1b14b487d8a9c6cccc7ce21d1.r2.dev
```

### Benefits of Using R2 Public URL

1. **Direct Access**: Images are served directly from Cloudflare's CDN
2. **Better Performance**: No proxy overhead through your application
3. **Automatic Caching**: Cloudflare automatically caches images globally
4. **Reduced Server Load**: Images don't go through your Next.js server
5. **Better Security**: R2 handles access control and rate limiting

### How It Works

1. **Upload**: Images are uploaded to R2 storage as before
2. **URL Generation**: New URLs use format: `https://pub-xxx.r2.dev/folder/file.jpg`
3. **Access**: Direct access from browser to Cloudflare's global CDN
4. **Caching**: Automatic global caching for faster loading

### URL Format Comparison

**Old URL (via proxy)**:
```
/api/storage/social-app-storage/profiles/user-id/image.jpg
```

**New URL (direct R2)**:
```
https://pub-2f0e8ac1b14b487d8a9c6cccc7ce21d1.r2.dev/profiles/user-id/image.jpg
```

### For Production

When you're ready for production, you can:

1. **Set up a custom domain** in your Cloudflare R2 settings
2. **Update R2_PUBLIC_URL** to your custom domain
3. **Enable additional Cloudflare features** like:
   - Access controls
   - Advanced caching rules
   - Image optimization
   - Security features

Example production URL:
```
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### Backward Compatibility

The system still supports:
- Old MinIO URLs (for migration)
- API proxy URLs (as fallback)
- Both development and production configurations

All existing images will continue to work without any issues.
