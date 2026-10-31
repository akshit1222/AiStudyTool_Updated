const mongoose = require('mongoose');

const flashcardSetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  cards: [{
    question: String,
    answer: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('FlashcardSet', flashcardSetSchema);
