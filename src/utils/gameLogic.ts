import type { HintType, HintInfo } from '../types/game';

export const HINT_INFO: Record<HintType, HintInfo> = {
  actor1: { type: 'actor1', emoji: '🎬', label: 'Actor' },
  actor2: { type: 'actor2', emoji: '🎭', label: 'Actor' },
  year: { type: 'year', emoji: '📆', label: 'Year' },
  director: { type: 'director', emoji: '🎥', label: 'Director' },
  tagline: { type: 'tagline', emoji: '🏷️', label: 'Tagline' },
};

export const calculateStars = (guessCount: number): number => {
  return Math.max(0, 5 - guessCount + 1);
};

export const isCorrectGuess = (guess: string, movieTitle: string): boolean => {
  const normalize = (str: string) => 
    str.toLowerCase()
       .replace(/[^\w\s]/g, '') // Remove punctuation
       .replace(/\s+/g, ' ')    // Normalize whitespace
       .trim();
  
  const normalizedGuess = normalize(guess);
  const normalizedTitle = normalize(movieTitle);
  
  return normalizedGuess === normalizedTitle;
};

export const formatShareText = (
  puzzleNumber: number,
  emojiPlot: string,
  stars: number,
  hintsUsed: HintType[],
  url: string
): string => {
  const starDisplay = stars > 0 ? '⭐'.repeat(stars) : '💔';
  const hintEmojis = hintsUsed.map(hint => HINT_INFO[hint].emoji).join('');
  
  return `Movemoji #${puzzleNumber} 🎬
${emojiPlot}

${starDisplay}${hintEmojis}

Play at ${url}`;
}; 