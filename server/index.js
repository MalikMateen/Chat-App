const express = require('express');
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors())

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Store message history for each room
const messageHistory = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (room) => {
    socket.join(room);
    socket.room = room;
    // Notify room members about new user
    socket.to(room).emit('userJoined', socket.id);
    
    // Send message history to newly joined user
    if (messageHistory[room]) {
      socket.emit('messageHistory', messageHistory[room]);
    }
  });

  socket.on('sendMessage', (message) => {
    const { room } = socket;
    // Store message in history
    if (!messageHistory[room]) {
      messageHistory[room] = [];
    }
    messageHistory[room].push(message);
    // Keep message history limited to 10 messages
    if (messageHistory[room].length > 10) {
      messageHistory[room].shift();
    }
    // Broadcast message to room members
    socket.to(room).emit('message', message);
  });

  socket.on('sendPrivateMessage', ({ recipient, message }) => {
    // Send private message to specific recipient
    socket.to(recipient).emit('privateMessage', {
      sender: socket.id,
      message
    });
  });

  socket.on('typing', () => {
    // Broadcast typing indicator to room members
    socket.to(socket.room).emit('userTyping', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const { room } = socket;
    if (room) {
      // Notify room members about user leaving
      socket.to(room).emit('userLeft', socket.id);
    }
  });
});

server.listen(3001, () => {
  console.log('Server is running on port 3001');
});
