// Game rules shared by the arena, lobby and leaderboard.
// Keep MAX points per question in sync with MAX_POINTS_PER_QUESTION in backend/controllers/gameController.js
export const QUESTION_SECONDS = 15;
export const START_LIVES = 3;
export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 50;
export const MAX_QUESTIONS = 20;
export const GAME_LENGTHS = [
  { id: 5, label: 'Quick', hint: '5 questions' },
  { id: 10, label: 'Standard', hint: '10 questions' },
  { id: 15, label: 'Marathon', hint: '15 questions' },
];
export const FREEZE_SECONDS = 8;
export const NICKNAME_KEY = 'studyforge:nickname';

export function multiplierForStreak(streak) {
  if (streak >= 7) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export function pointsFor(secondsLeft, streakAfterAnswer) {
  const speed = Math.round(MAX_SPEED_BONUS * Math.max(0, Math.min(1, secondsLeft / QUESTION_SECONDS)));
  return Math.round((BASE_POINTS + speed) * multiplierForStreak(streakAfterAnswer));
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Shuffles question order and answer positions, remapping the correct index.
export function prepareQuestions(raw, limit = MAX_QUESTIONS) {
  const valid = (raw || []).filter(
    (q) => q && q.question && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.correct)
  );
  return shuffle(valid)
    .slice(0, Math.min(limit, MAX_QUESTIONS))
    .map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      return {
        question: q.question,
        options: order.map((i) => q.options[i]),
        correct: order.indexOf(q.correct),
      };
    });
}

export const BADGES = [
  { id: 'first', name: 'First Spark', desc: 'Finish your first game', test: (s) => s.games >= 1 },
  { id: 'streak5', name: 'On Fire', desc: 'Reach a 5-answer streak', test: (s) => s.bestStreak >= 5 },
  { id: 'perfect', name: 'Flawless', desc: 'Answer every question correctly', test: (s) => s.perfectGames >= 1 },
  { id: 'regular', name: 'Regular', desc: 'Play 10 games', test: (s) => s.games >= 10 },
  { id: 'lvl5', name: 'Tempered', desc: 'Reach level 5', test: (s) => s.level >= 5 },
  { id: 'high', name: 'High Roller', desc: 'Score 1,500 in one game', test: (s) => s.best >= 1500 },
];

export function readNickname() {
  try {
    return localStorage.getItem(NICKNAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveNickname(value) {
  try {
    localStorage.setItem(NICKNAME_KEY, value);
  } catch {
    /* storage unavailable: nickname just won't persist */
  }
}

// Daily play streak, kept on this device
const DAYS_KEY = 'studyforge:days';

function dayStamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readDays() {
  try {
    return JSON.parse(localStorage.getItem(DAYS_KEY)) || { last: '', streak: 0 };
  } catch {
    return { last: '', streak: 0 };
  }
}

// Streak that is still alive today (played today or yesterday)
export function readDailyStreak() {
  const { last, streak } = readDays();
  if (!last) return 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return last === dayStamp() || last === dayStamp(yesterday) ? streak : 0;
}

export function recordPlayDay() {
  const days = readDays();
  const today = dayStamp();
  if (days.last === today) return days.streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const streak = days.last === dayStamp(yesterday) ? days.streak + 1 : 1;
  try {
    localStorage.setItem(DAYS_KEY, JSON.stringify({ last: today, streak }));
  } catch {
    /* ignore */
  }
  return streak;
}
