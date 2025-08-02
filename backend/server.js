const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const messageRoutes = require('./routes/message');
const http = require('http')
const {Server} = require('socket.io')
const fs = require('fs');
const path = require('path');

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Connect to MongoDB with error handling
connectDB().catch(err => {
  console.error('MongoDB connection failed:', err);
  // Don't exit the process, let it continue
});

const app = express();
// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://your-frontend-app.onrender.com']
      : [
          'http://localhost:5500',
          'http://127.0.0.1:5500',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:8080',
          'http://127.0.0.1:8080',
          'http://localhost:8000',
          'http://127.0.0.1:8000',
          'http://localhost:4000',
          'http://127.0.0.1:4000'
        ], 
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend-app.onrender.com']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/uploads/qr-codes', express.static('uploads/qr-codes'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/messages', messageRoutes);
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle mongoose errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      error: 'Validation failed',
      details: validationErrors
    });
  }
  
  // Handle mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server should stay running...');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// mongod --dbpath=D:\afai\data\rentalApp

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

    socket.on('joinRoom', ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    socket.on('sendMessage', async (msgData) => {
        try {
          // Validate message data
          if (!msgData.sender_id || !msgData.receiver_id || !msgData.property_id || !msgData.message_text) {
            console.error('Invalid message data:', msgData);
            socket.emit('messageError', { error: 'Invalid message data' });
            return;
          }

          // Validate message text length
          if (msgData.message_text.trim().length === 0) {
            socket.emit('messageError', { error: 'Message cannot be empty' });
            return;
          }

          if (msgData.message_text.length > 1000) {
            socket.emit('messageError', { error: 'Message too long (max 1000 characters)' });
            return;
          }

          const Message = require('./models/message');
      
          const newMessage = await Message.create({
            sender_id: msgData.sender_id,
            receiver_id: msgData.receiver_id,
            property_id: msgData.property_id,
            message_text: msgData.message_text.trim()
          });

          // Populate sender and receiver info for better display
          const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender_id', 'name email')
            .populate('receiver_id', 'name email');
      
          io.to(msgData.roomId).emit('receiveMessage', populatedMessage);
          console.log(`Message saved and sent to room ${msgData.roomId}:`, populatedMessage.message_text);
        } catch (err) {
          console.error('Socket message send failed:', err.message);
          socket.emit('messageError', { error: 'Failed to send message' });
        }
      });

    socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });

});