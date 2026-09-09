const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const convoySocket = require('./socket/convoySocket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io Real-Time Engine
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect to MongoDB
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Initialize Convoy Real-Time Socket Handlers
convoySocket(io);

// Define API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/convoys', require('./routes/api/convoys'));
app.use('/api/alerts', require('./routes/api/alerts'));
app.use('/api/stats', require('./routes/api/stats'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Cardem Mobile Enthusiast Platform',
    timestamp: new Date()
  });
});

// Production Static Asset Serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Centralized Async Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only listen if not required by supertest
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 [Cardem Server Running]: http://localhost:${PORT}`);
    console.log(`📡 [Real-Time Socket Gateway]: Ready on port ${PORT}`);
  });
}

module.exports = { app, server };
