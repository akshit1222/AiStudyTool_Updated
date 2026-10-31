import { useState, useCallback } from 'react';
import { apiFetch } from '../services/api';

export function useQuiz() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const score = answers.filter((a) => a.selected === a.correct).length;

  const isComplete =
    questions.length > 0 &&
    currentIndex === questions.length - 1 &&
    submitted;

  const loadQuiz = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setSubmitted(false);

    try {
      const result = await apiFetch('/api/generate/quiz', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setQuestions(result);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAnswer = useCallback(
    (index) => {
      if (submitted) return;
      const correct = questions[currentIndex]?.correct;
      setSelectedAnswer(index);
      setAnswers((prev) => [...prev, { selected: index, correct }]);
      setSubmitted(true);
    },
    [submitted, questions, currentIndex]
  );

  const next = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    }
  }, [currentIndex, questions.length]);

  const setQuestionsFromSaved = useCallback((questions) => {
    setQuestions(questions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setSubmitted(false);
  }, []);

  return {
    questions,
    currentIndex,
    selectedAnswer,
    answers,
    loading,
    error,
    submitted,
    score,
    isComplete,
    loadQuiz,
    selectAnswer,
    next,
    setQuestionsFromSaved,
    setError,
  };
}
