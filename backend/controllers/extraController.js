const { planVisuals, generateVisualImage, generateSlideOutline } = require('../utils/studyExtras');
const { friendlyGeminiError } = require('../utils/geminiHelper');

const MAX_TEXT = 80000;
const IMAGE_LIMIT = 30; // image requests per user ...
const IMAGE_WINDOW_MS = 10 * 60 * 1000; // ... per 10 minutes
const imageHits = new Map();

function readText(req, res) {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    res.status(400).json({ message: 'Please provide at least a few sentences of notes' });
    return null;
  }
  return text.slice(0, MAX_TEXT);
}

// Image generation costs real money, so keep a simple per-user cap.
function withinImageLimit(userId) {
  const now = Date.now();
  const hits = (imageHits.get(userId) || []).filter((t) => now - t < IMAGE_WINDOW_MS);
  if (hits.length >= IMAGE_LIMIT) {
    imageHits.set(userId, hits);
    return false;
  }
  hits.push(now);
  imageHits.set(userId, hits);
  return true;
}

const planVisualsHandler = async (req, res) => {
  try {
    const text = readText(req, res);
    if (!text) return;
    const count = Number.isInteger(req.body.count) ? req.body.count : 4;
    res.json({ items: await planVisuals(text, count) });
  } catch (error) {
    console.error('Error planning visuals:', error);
    const f = friendlyGeminiError(error, 'Failed to plan pictures');
    res.status(f.status).json({ message: f.message });
  }
};

const visualImageHandler = async (req, res) => {
  try {
    const { title, prompt } = req.body;
    if (typeof prompt !== 'string' || prompt.trim().length < 5 || prompt.length > 1500) {
      return res.status(400).json({ message: 'A picture description is required' });
    }
    if (!withinImageLimit(req.userId)) {
      return res.status(429).json({ message: 'Picture limit reached. Please wait a few minutes.' });
    }
    res.json(await generateVisualImage(typeof title === 'string' ? title.slice(0, 120) : 'Concept', prompt.trim()));
  } catch (error) {
    console.error('Error generating picture:', error);
    const f = friendlyGeminiError(error, 'Failed to generate picture');
    res.status(f.status).json({ message: f.message });
  }
};

const slidesHandler = async (req, res) => {
  try {
    const text = readText(req, res);
    if (!text) return;
    res.json(await generateSlideOutline(text));
  } catch (error) {
    console.error('Error generating slides:', error);
    const f = friendlyGeminiError(error, 'Failed to generate slides');
    res.status(f.status).json({ message: f.message });
  }
};

module.exports = { planVisualsHandler, visualImageHandler, slidesHandler };
