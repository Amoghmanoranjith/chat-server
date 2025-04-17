// models/User.js
import bcrypt from 'bcrypt';

export default (mongoose) => {
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  }, { timestamps: true });

  // Hash password before saving
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  // Compare method for auth
  userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  return mongoose.model('User', userSchema);
};
