const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Ensure API routes are handled by Next.js
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: dev ? ["http://localhost:3000", "http://localhost:3001"] : process.env.NEXTAUTH_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Store user information
    socket.userId = null;
    socket.userEmail = null;

    // Authentication (simplified - in production, use proper JWT validation)
    if (socket.handshake.auth && socket.handshake.auth.token) {
      socket.userEmail = socket.handshake.auth.token;
      console.log('🔐 Authenticated user:', socket.userEmail);
    }

    // Join chat room
    socket.on('joinChat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`🏠 Socket ${socket.id} (${socket.userEmail}) joined chat ${chatId}`);
      
      // Notify others in the chat that user joined
      socket.to(`chat_${chatId}`).emit('userJoined', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        socketId: socket.id
      });
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`🚪 Socket ${socket.id} (${socket.userEmail}) left chat ${chatId}`);
      
      // Notify others in the chat that user left
      socket.to(`chat_${chatId}`).emit('userLeft', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        socketId: socket.id
      });
    });

    // Send message
    socket.on('sendMessage', (data) => {
      console.log('📤 Broadcasting message to chat:', data.chatId);
      // Broadcast to all users in the chat except sender
      socket.to(`chat_${data.chatId}`).emit('newMessage', {
        ...data,
        socketId: socket.id,
        userEmail: socket.userEmail
      });
    });

    // Typing indicators
    socket.on('startTyping', (chatId) => {
      console.log('⌨️ User started typing in chat:', chatId);
      socket.to(`chat_${chatId}`).emit('userTyping', {
        chatId,
        userId: socket.id,
        userEmail: socket.userEmail
      });
    });

    socket.on('stopTyping', (chatId) => {
      console.log('⏹️ User stopped typing in chat:', chatId);
      socket.to(`chat_${chatId}`).emit('userStoppedTyping', {
        chatId,
        userId: socket.id,
        userEmail: socket.userEmail
      });
    });

    // Message reactions
    socket.on('addReaction', (data) => {
      console.log('😀 Adding reaction:', data);
      socket.to(`chat_${data.chatId}`).emit('reactionAdded', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: socket.id,
        userEmail: socket.userEmail
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.id, reason);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server running on path: /api/socket`);
    });
});