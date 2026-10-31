require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const authOtpRoutes = require('./routes/authOtpRoutes');
const generateRoutes = require('./routes/generateRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const quizRoutes = require('./routes/quizRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

connectDB();

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', authOtpRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/game', gameRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
