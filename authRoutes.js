// authRoutes.js
import express from 'express';
import { User } from './db.js';

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
  const { name, password } = req.body;
  try {
    const user = await User.findOne({ name });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
