const Quiz = require('../models/Quiz');

const generateTitle = (type) => {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
  return `Untitled ${type} - ${date}`;
};

const createQuiz = async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions are required and must be a non-empty array' });
    }

    const quiz = await Quiz.create({
      userId: req.userId,
      title: title && title.trim() ? title.trim() : generateTitle('Quiz'),
      questions
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuiz,
  deleteQuiz
};
