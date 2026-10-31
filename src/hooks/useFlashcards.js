import { useState, useCallback } from 'react';
import { apiFetch } from '../services/api';

export function useFlashcards() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isComplete = currentIndex >= cards.length && cards.length > 0;

  const loadCards = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());

    try {
      const result = await apiFetch('/api/generate/flashcards', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setCards(result);
    } catch (err) {
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReviewCards = useCallback(() => {
    setCards((prevCards) => prevCards.filter((_, i) => !known.has(i)));
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
  }, [known]);

  const flip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  const markKnown = useCallback(() => {
    setKnown((prev) => new Set([...prev, currentIndex]));
    setCurrentIndex((prev) => prev + 1);
    setFlipped(false);
  }, [currentIndex]);

  const markReview = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setFlipped(false);
  }, []);

  const setCardsFromSaved = useCallback((cards) => {
    setCards(cards);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
  }, []);

  return {
    cards,
    currentIndex,
    flipped,
    known,
    loading,
    error,
    isComplete,
    loadCards,
    loadReviewCards,
    flip,
    markKnown,
    markReview,
    setCardsFromSaved,
    setError,
  };
}
