const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  questions: [{
    question: String,
    options: [String],
    correct: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);
