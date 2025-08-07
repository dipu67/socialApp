# Group Image Upload with Firebase Integration

## Overview
Successfully implemented Firebase Storage integration for group chat images, replacing the previous local file system storage. Images are now uploaded to Firebase Storage and URLs are stored in MongoDB.

## Key Features Implemented

### 🔥 Firebase Storage Integration
- **Upload Location**: `group-images/{chatId}/group-{timestamp}.jpg`
- **Image Optimization**: Auto-resize to 400x400px with 85% JPEG quality
- **File Validation**: Max 5MB size limit, image files only
- **URL Storage**: Firebase download URLs stored in MongoDB `groupAvatar` field

### 🔒 Security & Permissions
- **Authorization**: Only group admins and moderators can upload/remove images
- **Session Verification**: Uses NextAuth session validation
- **File Validation**: Type and size checks before upload

### 🗑️ Smart Cleanup
- **Old Image Deletion**: Automatically deletes previous group image when uploading new one
- **Firebase Utils**: Uses existing `deleteImageFromFirebase` utility function
- **Error Handling**: Graceful fallback if deletion fails

## File Changes Made

### API Route: `/app/api/chats/[id]/image/route.ts`
**Before**: Local file system storage in `public/uploads/groups/`
**After**: Firebase Storage with image optimization

Key improvements:
- Sharp image processing (resize, optimize, convert to JPEG)
- Firebase Storage upload with proper metadata
- Automatic cleanup of old images
- Better error handling and responses

### Hook: `/hooks/useGroupImageUpload.ts` (NEW)
Created a reusable hook for group image operations:
- `uploadImage(chatId, file)` - Upload new group image
- `removeImage(chatId)` - Remove current group image  
- `isUploading` - Loading state management
- `error` - Error state management

### Component: `/components/chat/GroupInfoModal.tsx`
**Updated** to use the new hook:
- Simplified upload logic
- Better error handling
- Consistent loading states
- Cleaner code structure

## How It Works

### Upload Process
1. User selects image file in GroupInfoModal
2. Hook validates file (type, size)
3. API route optimizes image with Sharp
4. Image uploaded to Firebase Storage path: `group-images/{chatId}/group-{timestamp}.jpg`
5. Old image deleted from Firebase (if exists)
6. MongoDB updated with new Firebase download URL
7. UI refreshes with new image

### File Structure in Firebase
```
Firebase Storage:
├── group-images/
│   ├── {chatId1}/
│   │   └── group-1704123456789.jpg
│   ├── {chatId2}/
│   │   └── group-1704123567890.jpg
│   └── ...
```

### MongoDB Storage
```javascript
// Chat document structure
{
  _id: "chat_id_here",
  groupName: "My Group",
  groupAvatar: "https://firebasestorage.googleapis.com/v0/b/project/o/group-images%2F...jpg?alt=media&token=...",
  // ... other fields
}
```

## Usage Example

### In React Components
```tsx
import { useGroupImageUpload } from '@/hooks/useGroupImageUpload';

function MyComponent({ chatId }) {
  const { uploadImage, removeImage, isUploading, error } = useGroupImageUpload();
  
  const handleUpload = async (file: File) => {
    try {
      const imageUrl = await uploadImage(chatId, file);
      console.log('New image URL:', imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <div>
      {isUploading && <p>Uploading...</p>}
      {error && <p>Error: {error}</p>}
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
    </div>
  );
}
```

### Direct API Usage
```javascript
// Upload image
const formData = new FormData();
formData.append('image', file);

const response = await fetch(`/api/chats/${chatId}/image`, {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Image URL:', data.imageUrl);

// Remove image
await fetch(`/api/chats/${chatId}/image`, {
  method: 'DELETE',
});
```

## Benefits

✅ **Scalable Storage**: Firebase handles CDN and global distribution
✅ **Optimized Images**: Auto-resize and compress for better performance  
✅ **Clean URLs**: Firebase provides clean, shareable download URLs
✅ **Automatic Cleanup**: Old images deleted to save storage space
✅ **Better Error Handling**: Comprehensive validation and error responses
✅ **Consistent API**: Reusable hook pattern for frontend components
✅ **Security**: Proper authentication and authorization checks

## Dependencies Required
- `firebase` - Firebase SDK (✅ already installed)
- `sharp` - Image processing (✅ already installed)  
- `next-auth` - Authentication (✅ already installed)

## Environment Variables
Make sure these Firebase config variables are set:
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`  
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- etc.

The implementation is production-ready and follows your existing code patterns and architecture!
