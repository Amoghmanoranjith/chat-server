const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./user.js");

const PORT = process.env.PORT || 5000;
const router = require("./router.js");
const { call } = require("function-bind");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(router);

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);
    if (!user) return callback("User could not be added.");

    socket.join(user.room);
    socket.emit("message", {
      user: "admin",
      text: `Hey ${user.name}, welcome to the room ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined!` });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left the room.`,
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
