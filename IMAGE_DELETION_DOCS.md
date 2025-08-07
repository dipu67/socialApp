# Image Upload and Deletion System

## Overview
The application now automatically deletes previous profile and cover images when new ones are uploaded, preventing Firebase Storage from accumulating unused images.

## How it Works

### 1. Image Upload Process
1. User selects a new image through the upload modal
2. Image is optimized and uploaded to Firebase Storage
3. **Before saving the new image URL**, the system checks for existing images
4. If an existing Firebase Storage image is found, it's deleted
5. The new image URL is saved to the database

### 2. Deletion Logic
Located in `/lib/firebase-utils.ts`:

- **`deleteImageFromFirebase(imageUrl)`**: Deletes a single image
- **`deleteMultipleImagesFromFirebase(imageUrls)`**: Deletes multiple images

### 3. API Integration
The profile update API (`/api/user/profile`) automatically handles deletion:

```typescript
// Before updating avatar
if (currentAvatar && currentAvatar !== newAvatar) {
  await deleteImageFromFirebase(currentAvatar);
}
```

### 4. Safety Features
- Only deletes Firebase Storage URLs (checks for `firebasestorage.googleapis.com`)
- Continues with update even if deletion fails
- Treats "file not found" errors as successful deletions
- Extensive logging for debugging

### 5. Components Involved

#### Frontend
- `hooks/useUserProfile.ts` - Profile management with `updateProfileImage()`
- `components/image-upload-modal.tsx` - Upload interface
- `app/dashboard/profile/page.tsx` - Profile page with upload modals

#### Backend
- `app/api/user/profile/route.ts` - Main profile update with deletion
- `app/api/delete-image/route.ts` - Manual deletion endpoint
- `lib/firebase-utils.ts` - Firebase deletion utilities

### 6. Usage Example

```typescript
// Update profile image (automatically deletes previous)
await updateProfileImage(newImageUrl, 'avatar');

// Manual deletion (if needed)
await deleteImageFromFirebase(oldImageUrl);
```

### 7. Error Handling
- Non-blocking: Upload continues even if deletion fails
- Logging: All operations are logged to console
- Graceful degradation: Handles missing files and network errors

## Testing
1. Upload a profile image
2. Upload a different profile image
3. Check Firebase Storage console - old image should be gone
4. Check browser console for deletion logs
