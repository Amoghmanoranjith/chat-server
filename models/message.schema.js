export default (mongoose) => {
    const messageSchema = new mongoose.Schema({
      room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
      message: { type: String, required: true },
      sender: { type: String, required: true },
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      timestamp: { type: Date, default: Date.now }
    });
  
    return mongoose.model('Message', messageSchema);
  };
  