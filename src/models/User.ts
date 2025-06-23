import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  image: {
    type: String,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema); 