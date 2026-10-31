const FlashcardSet = require('../models/FlashcardSet');

const generateTitle = (type) => {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
  return `Untitled ${type} - ${date}`;
};

const createFlashcardSet = async (req, res) => {
  try {
    const { title, cards } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ message: 'Cards are required and must be a non-empty array' });
    }

    const flashcardSet = await FlashcardSet.create({
      userId: req.userId,
      title: title && title.trim() ? title.trim() : generateTitle('Flashcards'),
      cards
    });

    res.status(201).json(flashcardSet);
  } catch (error) {
    console.error('Error creating flashcard set:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFlashcardSets = async (req, res) => {
  try {
    const flashcardSets = await FlashcardSet.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(flashcardSets);
  } catch (error) {
    console.error('Error fetching flashcard sets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFlashcardSet = async (req, res) => {
  try {
    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    if (flashcardSet.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    res.json(flashcardSet);
  } catch (error) {
    console.error('Error fetching flashcard set:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFlashcardSet = async (req, res) => {
  try {
    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    if (flashcardSet.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    await FlashcardSet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Flashcard set deleted' });
  } catch (error) {
    console.error('Error deleting flashcard set:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createFlashcardSet,
  getFlashcardSets,
  getFlashcardSet,
  deleteFlashcardSet
};
