import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv'
import authRoutes from './routes/user.route.js';
import roomRoutes from './routes/room.route.js'
import { addUser, removeUser, getUser, getUsersInRoom } from './user.js';
import { User, Room, Message } from './db.js';

dotenv.config()
const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/room', roomRoutes)

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


  socket.on("join", async ({ userName, roomId }, callback) => {
    try {
      // 1. Find user
      const dbUser = await User.findOne({ name: userName });
      if (!dbUser) return callback("User not found");


      // 3. Find room
      const dbRoom = await Room.findOne({ room_id: roomId });
      console.log(roomId)
      if (!dbRoom) return callback("Room not found");

      // 4. Add user to room if not already a member
      if (!dbRoom.members_list.includes(dbUser._id)) {
        dbRoom.members_list.push(dbUser._id);
        await dbRoom.save();
      }

      socket.join(roomId);
      // console.log(messages)
      const isAdmin = dbRoom.room_admin.toString() === dbUser._id.toString();
      const role = isAdmin ? "admin" : "participant";
      // welcome message to the socket
      const previousMessages = await Message.find({ room_id: dbRoom._id }).sort({ timestamp: 1 });
      socket.emit("joinMessage", {
        role: role,
        messages: previousMessages.map(m => ({
          user: m.sender,
          text: m.message,
          timestamp: m.timestamp,
        }))
      });
      console.log(socket.id)
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
  socket.on("sendMessage", async ({ userName, room, message, timestamp }, callback) => {
    try {
      // Lookup the user and room from DB
      const dbUser = await User.findOne({ name: userName });
      const dbRoom = await Room.findOne({ room_id: room });

      if (!dbUser || !dbRoom) {
        console.error("Invalid user or room");
        return callback("Invalid user or room");
      }

      // Save message to DB
      const newMessage = new Message({
        room_id: dbRoom._id,
        message,
        sender: userName,
        user_id: dbUser._id,
        timestamp: timestamp || new Date(), // server can enforce timestamp if needed
      });

      await newMessage.save();
      console.log(userName, room, message, timestamp)
      // Emit to other clients
      io.to(room).emit("message", {
        user: userName,
        text: message,
        timestamp: newMessage.timestamp, // use saved timestamp
      });

      callback(); // send ack to sender
    } catch (err) {
      console.error("Error saving message:", err);
      callback("Error saving message");
    }
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

