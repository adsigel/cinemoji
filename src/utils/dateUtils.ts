import { puzzles } from '../data/puzzles';

export const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getDaysSinceEpoch = (date: Date = new Date()): number => {
  const epoch = new Date('2024-01-01'); // Game launch date
  const diffTime = date.getTime() - epoch.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const getPuzzleFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const puzzleId = urlParams.get('puzzle');
  
  if (puzzleId) {
    const id = parseInt(puzzleId, 10);
    const puzzle = puzzles.find(p => p.id === id);
    if (puzzle) {
      return puzzle;
    }
  }
  
  return null;
};

export const getTodaysPuzzle = () => {
  // Check for URL override first (for testing)
  const urlPuzzle = getPuzzleFromUrl();
  if (urlPuzzle) {
    return urlPuzzle;
  }
  
  // Otherwise use normal daily rotation
  const daysSinceEpoch = getDaysSinceEpoch();
  const puzzleIndex = daysSinceEpoch % puzzles.length;
  return puzzles[puzzleIndex];
};

export const getPuzzleNumber = (): number => {
  // If using URL override, return the puzzle ID
  const urlPuzzle = getPuzzleFromUrl();
  if (urlPuzzle) {
    return urlPuzzle.id;
  }
  
  // Otherwise return normal daily number
  return getDaysSinceEpoch() + 1;
}; 