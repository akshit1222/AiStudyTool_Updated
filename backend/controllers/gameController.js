const mongoose = require('mongoose');
const GameScore = require('../models/GameScore');
const User = require('../models/User');

// Maximum points one question can award: (100 base + 50 speed bonus) x 3 combo multiplier
const MAX_POINTS_PER_QUESTION = 450;
const MAX_QUESTIONS = 50;
const SUBMIT_COOLDOWN_MS = 5000;

// Level n starts at 100 * (n - 1)^2 XP
const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1;

const levelInfo = (xp) => {
  const level = levelFromXp(xp);
  const start = 100 * Math.pow(level - 1, 2);
  const next = 100 * Math.pow(level, 2);
  return { level, xpIntoLevel: xp - start, xpForNext: next - start };
};

const maskEmail = (email = '') => {
  const local = email.split('@')[0] || 'player';
  return `${local.slice(0, 3)}•••`;
};

const cleanNickname = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 16);
};

const submitScore = async (req, res) => {
  try {
    const { score, correct, total, maxStreak, nickname } = req.body;

    const ints = [score, correct, total, maxStreak ?? 0];
    if (!ints.every((n) => Number.isInteger(n) && n >= 0)) {
      return res.status(400).json({ message: 'Invalid score data' });
    }
    if (total < 1 || total > MAX_QUESTIONS || correct > total) {
      return res.status(400).json({ message: 'Invalid score data' });
    }
    if (score > correct * MAX_POINTS_PER_QUESTION || (maxStreak ?? 0) > correct) {
      return res.status(400).json({ message: 'Invalid score data' });
    }

    const last = await GameScore.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (last && Date.now() - last.createdAt.getTime() < SUBMIT_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Slow down — try again in a moment' });
    }

    const user = await User.findById(req.userId).select('email');
    const name = cleanNickname(nickname) || maskEmail(user?.email);

    const xp = Math.round(score / 10) + correct * 5 + (correct === total ? 50 : 0);

    const entry = await GameScore.create({
      userId: req.userId,
      nickname: name,
      score,
      correct,
      total,
      maxStreak: maxStreak ?? 0,
      xp
    });

    const [agg] = await GameScore.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: null, xp: { $sum: '$xp' } } }
    ]);
    const totalXp = agg?.xp || xp;
    const betterPlayers = await GameScore.aggregate([
      { $group: { _id: '$userId', best: { $max: '$score' } } },
      { $match: { best: { $gt: score } } },
      { $count: 'n' }
    ]);

    res.status(201).json({
      id: entry._id,
      xpEarned: xp,
      totalXp,
      ...levelInfo(totalXp),
      rank: (betterPlayers[0]?.n || 0) + 1
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const period = req.query.period === 'week' ? 'week' : 'all';
    const match = {};
    if (period === 'week') {
      match.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    const rows = await GameScore.aggregate([
      { $match: match },
      { $sort: { score: -1, createdAt: 1 } },
      {
        $group: {
          _id: '$userId',
          nickname: { $first: '$nickname' },
          best: { $first: '$score' },
          correct: { $first: '$correct' },
          total: { $first: '$total' },
          maxStreak: { $max: '$maxStreak' },
          games: { $sum: 1 },
          at: { $first: '$createdAt' }
        }
      },
      { $sort: { best: -1, at: 1 } }
    ]);

    const entries = rows.map((r, i) => ({
      rank: i + 1,
      nickname: r.nickname,
      score: r.best,
      correct: r.correct,
      total: r.total,
      maxStreak: r.maxStreak,
      games: r.games,
      isYou: r._id.toString() === req.userId
    }));

    const you = entries.find((e) => e.isYou) || null;

    res.json({ period, entries: entries.slice(0, 25), you, totalPlayers: entries.length });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyStats = async (req, res) => {
  try {
    const [agg] = await GameScore.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: null,
          xp: { $sum: '$xp' },
          games: { $sum: 1 },
          best: { $max: '$score' },
          bestStreak: { $max: '$maxStreak' },
          perfectGames: { $sum: { $cond: [{ $eq: ['$correct', '$total'] }, 1, 0] } },
          totalCorrect: { $sum: '$correct' }
        }
      }
    ]);

    const xp = agg?.xp || 0;
    res.json({
      totalXp: xp,
      ...levelInfo(xp),
      games: agg?.games || 0,
      best: agg?.best || 0,
      bestStreak: agg?.bestStreak || 0,
      perfectGames: agg?.perfectGames || 0,
      totalCorrect: agg?.totalCorrect || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { submitScore, getLeaderboard, getMyStats, levelInfo };
