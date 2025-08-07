import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';

export interface SocketWithUser extends Socket {
  userId?: string;
  userEmail?: string; 
}

let io: SocketIOServer;

export const initializeSocket = (server: HTTPServer) => {
  if (!io) {
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"]
      }
    });

    // Authentication middleware
    io.use(async (socket: SocketWithUser, next) => {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          let userId: string;
          
          // Try to get user ID from session first
          if ((session.user as any).id) {
            userId = (session.user as any).id;
          } else {
            // Fallback: Get user ID from database using email
            await connectDB();
            const user = await Users.findOne({ email: session.user.email }).select('_id');
            if (!user) {
              next(new Error('User not found'));
              return;
            }
            userId = user._id.toString();
          }
          
          socket.userId = userId;
          socket.userEmail = session.user.email;
          next();
        } else {
          next(new Error('Authentication failed'));
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket: SocketWithUser) => {
      console.log(`User ${socket.userEmail} connected`);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Join chat room
      socket.on('join_chat', (chatId: string) => {
        socket.join(`chat_${chatId}`);
        console.log(`User ${socket.userEmail} joined chat ${chatId}`);
      });

      // Leave chat room
      socket.on('leave_chat', (chatId: string) => {
        socket.leave(`chat_${chatId}`);
        console.log(`User ${socket.userEmail} left chat ${chatId}`);
      });

      // Send message
      socket.on('send_message', (data: {
        chatId: string;
        content: string;
        messageType: string;
        fileUrl?: string;
        fileName?: string;
        replyTo?: string;
      }) => {
        // Broadcast to all users in the chat
        socket.to(`chat_${data.chatId}`).emit('new_message', {
          ...data,
          senderId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });

      // Typing indicators
      socket.on('typing_start', (chatId: string) => {
        socket.to(`chat_${chatId}`).emit('user_typing', {
          userId: socket.userId,
          userEmail: socket.userEmail
        });
      });

      socket.on('typing_stop', (chatId: string) => {
        socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
          userId: socket.userId
        });
      });

      // Message reactions
      socket.on('add_reaction', (data: {
        messageId: string;
        chatId: string;
        emoji: string;
      }) => {
        socket.to(`chat_${data.chatId}`).emit('reaction_added', {
          ...data,
          userId: socket.userId
        });
      });

      // Mark messages as read
      socket.on('mark_as_read', (data: {
        chatId: string;
        messageIds: string[];
      }) => {
        socket.to(`chat_${data.chatId}`).emit('messages_read', {
          ...data,
          userId: socket.userId,
          readAt: new Date().toISOString()
        });
      });

      // Group events
      socket.on('user_joined_group', (data: {
        chatId: string;
        userId: string;
        userName: string;
      }) => {
        socket.to(`chat_${data.chatId}`).emit('group_member_joined', data);
      });

      socket.on('user_left_group', (data: {
        chatId: string;
        userId: string;
        userName: string;
      }) => {
        socket.to(`chat_${data.chatId}`).emit('group_member_left', data);
      });

      // Online status
      socket.on('update_status', (status: 'online' | 'away' | 'offline') => {
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status
        });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userEmail} disconnected`);
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status: 'offline'
        });
      });
    });
  }

  return io;
};

export const getSocketInstance = () => io;
