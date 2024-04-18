const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    socket.join(room);
    socket.room = room;
    socket.to(room).emit("user_joined", socket.id);
  });

  socket.on("leave_room", () => {
    const { room } = socket;
    if (room) {
      socket.leave(room);
      socket.to(room).emit("user_left", socket.id);
    }
  });

  socket.on("send_message", (data) => {
    const { room, message } = data;
    io.to(room).emit("receive_message", { room, userId: socket.id, message });
  });

  socket.on("typing", () => {
    socket.to(socket.room).emit("user_typing", socket.id);
  });

  socket.on("disconnect", () => {
    const { room } = socket;
    if (room) {
      socket.to(room).emit("user_disconnect", socket.id);
    }
  });
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
