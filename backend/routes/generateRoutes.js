const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { planVisualsHandler, visualImageHandler, slidesHandler } = require('../controllers/extraController');
const { generateFlashcardsHandler, generateQuizHandler, generateSummaryHandler } = require('../controllers/generateController');

router.post('/flashcards', protect, generateFlashcardsHandler);
router.post('/quiz', protect, generateQuizHandler);
router.post('/summary', protect, generateSummaryHandler);
router.post('/visuals/plan', protect, planVisualsHandler);
router.post('/visuals/image', protect, visualImageHandler);
router.post('/slides', protect, slidesHandler);

module.exports = router;
