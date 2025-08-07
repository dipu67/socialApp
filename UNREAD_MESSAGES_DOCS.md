# Real-time Unread Message Badges Feature

## Overview
Successfully implemented real-time unread message badges that show across the application - in both sidebar (desktop) and bottom navigation (mobile). The system tracks unread messages per chat and displays counts with automatic updates.

## Key Features Implemented

### 🔄 **Real-time Unread Tracking**
- **API Endpoints**: `/api/chats/unread` and `/api/chats/[id]/read`
- **Database Logic**: Uses existing `readBy` field in message schema
- **Auto-refresh**: Polls every 30 seconds + visibility change detection
- **Smart Counting**: Only counts messages from other users, not your own

### 📱 **Mobile Bottom Navigation Badges**
- **Red badges** appear on Chat tab when unread messages exist
- **Badge limit**: Shows "99+" for counts over 99
- **Position**: Top-right corner of chat icon
- **Auto-hide**: Disappears when no unread messages

### 💻 **Desktop Sidebar Badges** 
- **Red badges** on Chat navigation item
- **Consistent styling** with mobile badges
- **Real-time updates** via polling hook

### 📋 **Chat List Individual Badges**
- **Per-chat unread counts** in chat list
- **Red badges** next to each chat with unread messages
- **Dynamic updates** when viewing chats

## File Structure

### New API Routes
```
/app/api/chats/unread/route.ts           # Get all unread counts
/app/api/chats/[id]/read/route.ts        # Mark chat as read
```

### New Hook
```
/hooks/useUnreadMessages.ts              # Manages unread state & API calls
```

### Updated Components
```
/app/(authenticated)/chat/page.tsx       # Integrated unread hook & auto-mark-read
/components/chat/ChatList.tsx            # Added unread badges per chat
/components/mobile-bottom-nav.tsx        # Added badge to Chat tab
/components/sidebar.tsx                  # Added badge to Chat nav item
```

## How It Works

### 1. **Unread Counting Logic**
```javascript
// API counts messages where:
const unreadCount = await Messages.countDocuments({
  chatId: chat._id,
  senderId: { $ne: currentUser._id },     // Not from current user
  'readBy.userId': { $ne: currentUser._id } // Not read by current user
});
```

### 2. **Auto Mark as Read**
```javascript
// When user opens a chat:
const handleSelectChat = async (chat) => {
  await markChatAsRead(chat._id);  // Marks all messages as read
  setSelectedChat(chat);
};
```

### 3. **Real-time Updates**
```javascript
// Hook polls every 30 seconds + on tab focus:
useEffect(() => {
  const pollInterval = setInterval(() => {
    if (!document.hidden) {
      fetchUnreadCounts();
    }
  }, 30000);
}, []);
```

### 4. **Badge Display Logic**
```javascript
// Only show badge if count > 0:
{totalUnreadCount > 0 && (
  <Badge variant="destructive">
    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
  </Badge>
)}
```

## Database Schema Integration

### Existing Message Schema
```javascript
readBy: [{
  userId: ObjectId,     // User who read the message
  readAt: Date         // When they read it
}]
```

### No Schema Changes Required
- Uses existing `readBy` array in messages
- No migration needed
- Backwards compatible

## Usage Examples

### Basic Hook Usage
```typescript
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

function MyComponent() {
  const { 
    totalUnreadCount,     // Total across all chats
    chatUnreadCounts,     // Per-chat breakdown
    chatsWithUnread,      // Chats with unread counts attached
    markChatAsRead,       // Function to mark chat as read
    refreshUnreadCounts   // Manual refresh function
  } = useUnreadMessages();

  return (
    <div>
      {totalUnreadCount > 0 && (
        <span>You have {totalUnreadCount} unread messages</span>
      )}
    </div>
  );
}
```

### API Direct Usage
```javascript
// Get unread counts
const response = await fetch('/api/chats/unread');
const data = await response.json();
console.log('Total unread:', data.totalUnreadCount);

// Mark chat as read
await fetch(`/api/chats/${chatId}/read`, { method: 'POST' });
```

## Performance Optimizations

### ✅ **Efficient Polling**
- Only polls when tab is visible
- 30-second intervals (configurable)
- Immediate updates on user actions

### ✅ **Smart Database Queries**
- Optimized MongoDB aggregation
- Indexed on chatId and userId
- Excludes own messages from count

### ✅ **Local State Management**
- Immediate UI updates on actions
- Reduced API calls via caching
- Optimistic updates for better UX

## Badge Styling

### Consistent Design System
- **Color**: Red (`bg-red-500`) for urgent attention
- **Shape**: Round badges for counts
- **Size**: Minimum 16px width for readability
- **Position**: Top-right of icons
- **Typography**: Bold, white text

### Responsive Behavior
- **Mobile**: Slightly smaller badges (16px min)
- **Desktop**: Standard size (20px min)
- **High counts**: "99+" truncation for long numbers

## Future Enhancements

### Possible Improvements
1. **WebSocket Integration**: Replace polling with real-time WebSocket updates
2. **Push Notifications**: Browser notifications for new messages
3. **Sound Alerts**: Audio cues for new messages
4. **Read Receipts**: Show when others have read your messages
5. **Typing Indicators**: Real-time typing status
6. **Message Previews**: Show snippet of latest unread message

### Configuration Options
- Polling interval adjustment
- Badge color customization  
- Sound notification settings
- Read receipt preferences

The unread message system is now fully functional and provides a seamless real-time experience across all devices and screen sizes!
