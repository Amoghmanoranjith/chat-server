import express from 'express';
import { User, Room } from '../db.js'; // import Room too
const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, password } = req.body;
  try {
    const existing = await User.findOne({ name });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const user = new User({ name, password });
    await user.save();
    console.log("user:",name," created")
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/login', async (req, res) => {
  const { userName, password, roomId } = req.body;
  if (!userName || !password || !roomId) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const user = await User.findOne({ name:userName });
    if (!user) return res.status(400).json({ message: "User not found" });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });
    
    const room = await Room.findOne({ room_id:roomId });
    
    if (!room) return res.status(404).json({ message: "Room not found" });

    // If all checks pass
    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
      roomId: room.roomId
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});



export default router