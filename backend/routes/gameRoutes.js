const express = require('express');
const router = express.Router();
const { submitScore, getLeaderboard, getMyStats } = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

router.post('/scores', protect, submitScore);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/stats', protect, getMyStats);

module.exports = router;
