import dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import authRoutes from './routes/user.route.js';
import roomRoutes from './routes/room.route.js'
import { addUser, removeUser, getUser, getUsersInRoom } from './user.js';
import { User, Room, Message } from './db.js';
import verify from './middlewares/verifyJWT.js';
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/room', verify, roomRoutes)

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
  socket.on("join", async ({ userName, userId, roomId }, callback) => {
    try {
      const dbRoom = await Room.findOne({ room_id: roomId });
      if (!dbRoom) return callback("Room not found");

      if (!dbRoom.members_list.includes(userId)) {
        dbRoom.members_list.push(userId);
        await dbRoom.save();
      }
      const addToRoom = addUser(userId, userName, roomId)
      if (!addToRoom) {
        console.log(`couldnt add ${userName} to ${roomId} due to duplicacy`)
        return callback("duplicate logins to the same room");
      }
      socket.join(roomId);
      const isAdmin = dbRoom.room_admin.toString() === userId.toString();
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
      console.log(`${userName} has joined ${roomId}`)
      callback();
      io.to(roomId).emit("roomDataUpdate", {
        users: getUsersInRoom(roomId)
      })
    }
    catch (err) {
      console.error(err);
      callback("Error joining room");
    }
  });

  // till here
  // takes message from a client
  // emits it to the respective room id
  socket.on("sendMessage", async ({ userName, userId, roomId, message, timestamp }, callback) => {
    try {
      // Lookup the user and room from DB
      const dbRoom = await Room.findOne({ room_id: roomId });

      if (!dbRoom) {
        console.error("Invalid user or room");
        return callback("Invalid user or room");
      }

      // Save message to DB
      const newMessage = new Message({
        room_id: dbRoom._id,
        message,
        sender: userName,
        user_id: userId,
        timestamp: timestamp || new Date(), // server can enforce timestamp if needed
      });

      await newMessage.save();
      // Emit to other clients
      io.to(roomId).emit("message", {
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


  socket.on("exit", ({ userName, userId, roomId }, callback) => {
    try {
      removeUser(userId, roomId)
      io.to(roomId).emit("roomDataUpdate", {
        users: getUsersInRoom(roomId)
      })
      console.log(`${userName} has exited ${roomId}`)
      callback()
    } catch (error) {
      console.error("Error exiting the room:", error);
      callback("Error exiting the room");
    }
  });

});


