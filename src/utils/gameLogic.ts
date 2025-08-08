import type { HintType, HintInfo } from '../types/game';

export const HINT_INFO: Record<HintType, HintInfo> = {
  actor1: { type: 'actor1', emoji: '🎭', label: 'Actor #1' },
  actor2: { type: 'actor2', emoji: '🎭', label: 'Actor #2' },
  year: { type: 'year', emoji: '📆', label: 'Year' },
  director: { type: 'director', emoji: '🎥', label: 'Director' },
  tagline: { type: 'tagline', emoji: '🏷️', label: 'Tagline' },
};

export const calculateStars = (guessCount: number): number => {
  return Math.max(0, 6 - guessCount);
};

// Normalize text for comparison by removing punctuation, extra spaces, and converting to lowercase
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove all punctuation
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const isCorrectGuess = (guess: string, movieTitle: string): boolean => {
  const normalizedGuess = normalizeText(guess);
  const normalizedTitle = normalizeText(movieTitle);
  
  // Direct match
  if (normalizedGuess === normalizedTitle) {
    return true;
  }
  
  // Handle common variations
  const guessWords = normalizedGuess.split(' ');
  const titleWords = normalizedTitle.split(' ');
  
  // Remove common articles for comparison
  const removeArticles = (words: string[]) => 
    words.filter(word => !['the', 'a', 'an'].includes(word));
  
  const guessWithoutArticles = removeArticles(guessWords).join(' ');
  const titleWithoutArticles = removeArticles(titleWords).join(' ');
  
  return guessWithoutArticles === titleWithoutArticles;
};

export const formatShareText = (
  puzzleNumber: number,
  emojiPlot: string,
  stars: number,
  revealedHints: HintType[],
  domain: string
): string => {
  const starEmojis = stars > 0 ? '⭐'.repeat(stars) : '💔';
  const hintEmojis = revealedHints.map(hint => HINT_INFO[hint].emoji).join('');
  
  return `Cinemoji #${puzzleNumber}

${emojiPlot}

${starEmojis}${hintEmojis}

Play at ${domain}`;
}; 