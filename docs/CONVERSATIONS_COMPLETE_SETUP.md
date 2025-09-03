# 💬 Conversations System - Complete Setup & Test Guide

## 🎯 Overview
The conversations system provides real-time messaging with direct messages and group chats, complete with sound notifications and live updates.

## 🚀 Quick Setup

### **Step 1: Database Setup**
Run the conversations schema in your Supabase SQL editor:

```sql
-- Copy and paste the entire content from:
database/conversations-schema.sql
```

This creates:
- `conversations` table
- `conversation_participants` table  
- `messages` table
- `message_attachments` table
- `profiles` table (if not exists)
- All necessary indexes and RLS policies

### **Step 2: Enable Realtime**
In your Supabase dashboard, go to **Database > Replication** and enable realtime for:
- ✅ `conversations`
- ✅ `messages` 
- ✅ `conversation_participants`

### **Step 3: Test the System**
Visit the test page to verify everything works:
```
Go to: /test-conversations
```

## 🧪 Testing the Conversations System

### **Automated Tests**
1. **Go to `/test-conversations`**
2. **Click "Run All Tests"**
3. **All tests should pass** ✅

### **Manual Testing**

#### **Test 1: Create Direct Message**
1. **Go to `/conversations`**
2. **Click "New" button**
3. **Select "Direct Message" tab**
4. **Search for a user**
5. **Select user and click "Create Conversation"**
6. **Should redirect to conversation page**

#### **Test 2: Create Group Chat**
1. **Go to `/conversations`**
2. **Click "New" button**
3. **Select "Group Chat" tab**
4. **Enter group name**
5. **Search and select multiple users**
6. **Click "Create Group"**
7. **Should redirect to group conversation**

#### **Test 3: Send Messages**
1. **Open a conversation**
2. **Type a message and press Enter**
3. **Message should appear immediately**
4. **No page refresh needed**

#### **Test 4: Real-time Updates**
1. **Open two browser windows/tabs**
2. **Log in as different users in each**
3. **Start a conversation between them**
4. **Send message from Window A**
5. **Window B should immediately show:**
   - 🔊 Notification sound
   - 📱 Toast notification
   - 💬 New message in conversation
   - 🔴 Updated unread count

## 🔧 System Architecture

### **Real-time Flow:**
```
User A sends message → Database → Supabase Realtime → User B receives:
├── Sound notification
├── Toast notification  
├── Message appears in chat
└── Unread count updates
```

### **Key Components:**
- **ConversationsPageClient**: Main conversations interface
- **ConversationPageClient**: Individual conversation chat
- **NewConversationDialog**: Create new conversations
- **MessageInputRealtime**: Send messages with real-time feedback
- **useRealtimeConversations**: Real-time state management

## 🎵 Sound Integration

The conversations system integrates with the notification sound system:
- **New message sound**: Plays when receiving messages
- **Different users**: Different notification tones
- **Browser compatibility**: Multiple fallback methods

## 📱 Features

### **Direct Messages:**
- ✅ One-on-one conversations
- ✅ Real-time messaging
- ✅ Sound notifications
- ✅ Unread message counts
- ✅ Message history

### **Group Chats:**
- ✅ Multi-user conversations
- ✅ Custom group names
- ✅ Member management
- ✅ Real-time for all participants
- ✅ Group notifications

### **Real-time Features:**
- ✅ Instant message delivery
- ✅ Live typing indicators
- ✅ Automatic conversation sorting
- ✅ Unread count updates
- ✅ Cross-tab synchronization

### **UI/UX Features:**
- ✅ Search conversations
- ✅ User search for new conversations
- ✅ Avatar support
- ✅ Message timestamps
- ✅ Responsive design
- ✅ Dark/light theme support

## 🔍 Troubleshooting

### **Common Issues:**

#### **"No conversations" or empty page:**
- ✅ Check database schema is installed
- ✅ Verify RLS policies are active
- ✅ Check user has proper authentication

#### **Can't create conversations:**
- ✅ Verify `/api/conversations/create` endpoint works
- ✅ Check user search API `/api/users/search`
- ✅ Ensure profiles table has user data

#### **Messages not appearing in real-time:**
- ✅ Enable realtime for `messages` table
- ✅ Check browser console for subscription errors
- ✅ Verify Supabase connection

#### **No sound notifications:**
- ✅ Test sound system on `/test-sound` first
- ✅ Check browser audio permissions
- ✅ Ensure user interaction before audio

### **Database Issues:**
```sql
-- Check if tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'conversation_participants');

-- Check if realtime is enabled:
SELECT schemaname, tablename, realtime 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## 🏁 Success Checklist

### **✅ System is working when:**
- All automated tests pass on `/test-conversations`
- Can create direct messages and group chats
- Messages appear instantly without refresh
- Sound notifications play for new messages
- Unread counts update in real-time
- Multiple browser tabs stay synchronized
- Search functionality works for users and conversations

### **🎯 Expected User Experience:**
1. **User opens conversations page** → Sees list of conversations
2. **User clicks "New"** → Can search and select users
3. **User creates conversation** → Redirects to chat interface
4. **User sends message** → Message appears immediately
5. **Other user receives message** → Hears sound + sees notification
6. **All without page refresh** → Seamless real-time experience

---

**The conversations system is now fully functional with real-time messaging, sound notifications, and a complete user interface. Test it thoroughly using the `/test-conversations` page!**