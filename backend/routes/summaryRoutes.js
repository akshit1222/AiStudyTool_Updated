const express = require('express');
const router = express.Router();
const { createSummary, getSummaries, getSummary, deleteSummary } = require('../controllers/summaryController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createSummary);
router.get('/', protect, getSummaries);
router.get('/:id', protect, getSummary);
router.delete('/:id', protect, deleteSummary);

module.exports = router;
