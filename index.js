import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

import authRoutes from './authRoutes.js';
import { addUser, removeUser, getUser, getUsersInRoom } from './user.js';
import { User, Room, Message } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
  socket.on("createRoom", async ({ userName, password, roomId }, callback) => {
    try {
      const dbUser = await User.findOne({ name: userName });
      console.log(userName, password, roomId)
      if (!dbUser) return callback("User not found");

      const isMatch = await dbUser.comparePassword(password);
      if (!isMatch) return callback("Incorrect password");

      const existingRoom = await Room.findOne({ room_id: roomId });
      if (existingRoom) return callback("Room ID already exists");

      const newRoom = new Room({
        room_id: roomId,
        room_admin: dbUser._id,
        members_list: [dbUser._id],
        messages_list: []
      });
      await newRoom.save();
      console.log("user ", userName, " has created the room with id ", roomId)
      const { error, user } = addUser({ id: socket.id, name: dbUser.name, room: roomId });
      if (error) return callback(error);

      socket.join(roomId);
      socket.emit("message", {
        user: "admin",
        text: `Room ${roomId} created! Welcome ${dbUser.name}`,
      });
      callback("Created the room", { roomId });
    }
    catch (err) {
      console.error(err);
      callback("Error creating room");
    }
  });


  socket.on("join", async ({ userName, password, roomId }, callback) => {
    try {
      const dbUser = await User.findOne({ name: userName });
      if (!dbUser) return callback("User not found");

      const isMatch = await dbUser.comparePassword(password);
      if (!isMatch) return callback("Incorrect password");

      const dbRoom = await Room.findOne({ room_id: roomId });
      if (!dbRoom) return callback("Room not found");

      if (!dbRoom.members_list.includes(dbUser._id)) {
        dbRoom.members_list.push(dbUser._id);
        await dbRoom.save();
      }

      const { error, user } = addUser({ id: socket.id, name: dbUser.name, room: roomId });
      if (error) return callback(error);

      socket.join(roomId);

      const messages = await Message.find({ room_id: dbRoom._id }).sort({ timestamp: -1 });

      const isAdmin = dbRoom.room_admin.toString() === dbUser._id.toString();
      const role = isAdmin ? "admin" : "participant";
      // welcome message to the socket
      console.log("sending the initials", messages)
      socket.emit("joinMessage", "welcome");
      console.log(userName, "has joined the room ", roomId)
      callback();


    }
    catch (err) {
      console.error(err);
      callback("Error joining room");
    }
  });

  // till here
  // takes message from a client
  // emits it to the respective room id
  socket.on("sendMessage", ({ name, room, message }, callback) => {
    console.log("Received message from ", name, " in room ", room, message)
    io.to(room).emit("message", { user: name, text: message });
    io.to(room).emit("roomData", {
      room: room,
      users: getUsersInRoom(room),
    });

    callback();
  });

  socket.on("disconnect", ({ name, room, message }) => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(room).emit("message", {
        user: "admin",
        text: `${user.name} has left the room.`,
      });
    }
  });
});

