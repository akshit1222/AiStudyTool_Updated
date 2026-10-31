const express = require('express');
const router = express.Router();
const { createFlashcardSet, getFlashcardSets, getFlashcardSet, deleteFlashcardSet } = require('../controllers/flashcardController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createFlashcardSet);
router.get('/', protect, getFlashcardSets);
router.get('/:id', protect, getFlashcardSet);
router.delete('/:id', protect, deleteFlashcardSet);

module.exports = router;
