export default (mongoose) => {
    const roomSchema = new mongoose.Schema({
      room_id: { type: String, unique: true, required: true },
      room_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      members_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      messages_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
      created_at: { type: Date, default: Date.now }
    });
  
    return mongoose.model('Room', roomSchema);
  };
  