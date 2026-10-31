const { generateFlashcards, generateQuiz, generateSummary } = require('../utils/geminiHelper');
const { friendlyGeminiError } = require('../utils/geminiHelper');

// Optional "how many items" hint (the game asks for ~10 so it starts sooner)
const readCount = (value) => (Number.isInteger(value) && value >= 3 && value <= 25 ? value : undefined);

const generateFlashcardsHandler = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    const flashcards = await generateFlashcards(text, { count: readCount(req.body.count) });
    res.json(flashcards);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    const f = friendlyGeminiError(error, 'Failed to generate flashcards');
    res.status(f.status).json({ message: f.message });
  }
};

const generateQuizHandler = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    const quiz = await generateQuiz(text, { count: readCount(req.body.count) });
    res.json(quiz);
  } catch (error) {
    console.error('Error generating quiz:', error);
    const f = friendlyGeminiError(error, 'Failed to generate quiz');
    res.status(f.status).json({ message: f.message });
  }
};

const generateSummaryHandler = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    const summary = await generateSummary(text);
    res.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    const f = friendlyGeminiError(error, 'Failed to generate summary');
    res.status(f.status).json({ message: f.message });
  }
};

module.exports = {
  generateFlashcardsHandler,
  generateQuizHandler,
  generateSummaryHandler
};
