import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  clientGeneratedId: {
    type: String,
    unique: true,
    sparse: true,
  },
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    required: true,
  },
  hasReminder: {
    type: Boolean,
    default: false,
  },
  reminderDate: {
    type: String,
  },
  reminderTime: {
    type: String,
  }
}, { timestamps: true });

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
