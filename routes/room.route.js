import express from 'express';
import { User, Room } from '../db.js';
const router = express.Router();

router.post('/create', async (req, res) => {
  const { userName, password, roomId } = req.body;

  if (!userName || !password || !roomId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Find the user
    const user = await User.findOne({ name: userName });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    // Check if room already exists
    const existingRoom = await Room.findOne({ room_id: roomId });
    if (existingRoom) return res.status(409).json({ message: "Room already exists" });

    // Create new room
    const newRoom = new Room({
      room_id: roomId,
      room_admin: user._id,
      members_list: [user._id],
      messages_list: [] // Initialize with empty messages
    });
    await newRoom.save();
    return res.status(201).json({ message: "Room created successfully", roomId: newRoom.room_id });
  } 
  catch (error) {
    console.error("Room creation error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

/*
const roomSchema = new mongoose.Schema(
{
      room_id: { type: String, unique: true, required: true },
      room_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      members_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      messages_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
      created_at: { type: Date, default: Date.now }
});
*/

router.post('/join', async (req,res)=>{
  try {
    const {roomId} = req.body
    const userName = req.userName
    const userId = req.userId
    const room = await Room.findOne({room_id:roomId})
    if(!room){
      return res.status(404).json({
        error:"room not found"
      })
    }
    // return roomId, userName, role
    const role = (room.room_admin == userId?'admin':'participant')
    return res.status(200).json({
      userName: userName,
      userId:userId,
      roomId:roomId,
      role:role
    })
  } catch (error) {
    console.log(`join error: ${error}`)
    return res.json({
      error:error
    })
  }


})

export default router;
