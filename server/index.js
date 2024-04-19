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
  socket.on("join_group_room", (room) => {
    socket.join(room);
    socket.room = room;
    socket
      .to(room)
      .emit("user_joined_group", { userId: socket.id, roomId: room });
  });

  socket.on("leave_group_room", () => {
    const { room } = socket;
    if (room) {
      socket.leave(room);
      socket
        .to(room)
        .emit("user_left_group", { userId: socket.id, roomId: room });
    }
  });

  socket.on("send_message_to_room", (data) => {
    const { room, message } = data;
    io.to(room).emit("receive_message", {
      roomId: room,
      userId: socket.id,
      message,
    });
  });

  socket.on("typing_in_room", (data) => {
    const { room, message } = data;
    socket
      .to(room)
      .emit("group_typing", { roomId: room, userId: socket.id, message });
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
