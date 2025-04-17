import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import UserModel from './models/user.schema.js';
import RoomModel from './models/room.schema.js';
import MessageModel from './models/message.schema.js';

// 
console.log("Connecting to MongoDB URI:", process.env.MONGO_URI);
console.log("Connecting to MongoDB URI:", process.env);
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ MongoDB error:'));
db.once('open', () => console.log('✅ MongoDB connected'));

const User = UserModel(mongoose);
const Room = RoomModel(mongoose);
const Message = MessageModel(mongoose);

export { User, Room, Message };
