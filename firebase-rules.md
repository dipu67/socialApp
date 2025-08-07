# Firebase Storage Security Rules

To check and update your Firebase Storage security rules:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Storage -> Rules

## Recommended Rules for Testing

For testing purposes, you can use these permissive rules (NOT for production):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Recommended Rules for Production

For production, use authenticated rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /profile-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /cover-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Current Error Investigation

Check the browser console and Firebase console logs for specific error messages.
Common issues:
- Storage rules are too restrictive
- Authentication not properly configured
- CORS issues
- Project configuration mismatch

After updating rules, wait 1-2 minutes for changes to propagate.
