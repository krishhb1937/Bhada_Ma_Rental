const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

app.use(express.json());

// Basic route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('test', (data) => {
    console.log('Test message received:', data);
    socket.emit('test-response', { message: 'Test successful!', data });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
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