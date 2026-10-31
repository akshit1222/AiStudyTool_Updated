const mongoose = require('mongoose');

const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  nickname: {
    type: String,
    default: 'Player',
    maxlength: 16
  },
  score: { type: Number, required: true, min: 0 },
  correct: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 1 },
  maxStreak: { type: Number, default: 0, min: 0 },
  xp: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

gameScoreSchema.index({ score: -1, createdAt: 1 });

module.exports = mongoose.model('GameScore', gameScoreSchema);
