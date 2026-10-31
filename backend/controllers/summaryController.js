const Summary = require('../models/Summary');

const generateTitle = (type) => {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
  return `Untitled ${type} - ${date}`;
};

const createSummary = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required and must be a non-empty string' });
    }

    const summary = await Summary.create({
      userId: req.userId,
      title: title && title.trim() ? title.trim() : generateTitle('Summary'),
      content: content.trim()
    });

    res.status(201).json(summary);
  } catch (error) {
    console.error('Error creating summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(summaries);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSummary = async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    if (summary.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Summary not found' });
   }

    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSummary = async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    if (summary.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    await Summary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Summary deleted' });
  } catch (error) {
    console.error('Error deleting summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSummary,
  getSummaries,
  getSummary,
  deleteSummary
};
