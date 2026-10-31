const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes, getQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createQuiz);
router.get('/', protect, getQuizzes);
router.get('/:id', protect, getQuiz);
router.delete('/:id', protect, deleteQuiz);

module.exports = router;
