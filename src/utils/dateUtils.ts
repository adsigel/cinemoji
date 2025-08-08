import { puzzles } from '../data/puzzles';

export const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getDaysSinceEpoch = (date: Date = new Date()): number => {
  const epoch = new Date('2025-08-08'); // Game launch date (today)
  const diffTime = date.getTime() - epoch.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Get puzzle history from localStorage to track which puzzles have been used
const getPuzzleHistory = (): { puzzleId: number; date: string }[] => {
  try {
    const stored = localStorage.getItem('cinemoji_puzzle_history');
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as { puzzleId: number; date: string }[];
  } catch (error) {
    console.error('Error reading puzzle history:', error);
    return [];
  }
};

// Save puzzle history to localStorage
const savePuzzleHistory = (history: { puzzleId: number; date: string }[]): void => {
  try {
    localStorage.setItem('cinemoji_puzzle_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving puzzle history:', error);
  }
};

// Record that a puzzle was used on a specific date
const recordPuzzleUsage = (puzzleId: number, date: string): void => {
  const history = getPuzzleHistory();
  
  // Remove any existing entry for this date to avoid duplicates
  const filtered = history.filter(entry => entry.date !== date);
  
  // Add new entry
  filtered.push({ puzzleId, date });
  
  // Keep only last 100 entries to prevent localStorage bloat
  const trimmed = filtered.slice(-100);
  
  savePuzzleHistory(trimmed);
};

export const getTodaysPuzzle = () => {
  const today = getTodayDateString();
  const history = getPuzzleHistory();
  
  // Check if we already selected a puzzle for today
  const todaysPuzzle = history.find(entry => entry.date === today);
  if (todaysPuzzle) {
    const puzzle = puzzles.find(p => p.id === todaysPuzzle.puzzleId);
    if (puzzle) {
      return puzzle;
    }
  }
  
  // Get list of puzzle IDs that have been used
  const usedPuzzleIds = new Set(history.map(entry => entry.puzzleId));
  
  // Find unused puzzles
  const unusedPuzzles = puzzles.filter(puzzle => !usedPuzzleIds.has(puzzle.id));
  
  let selectedPuzzle;
  
  if (unusedPuzzles.length > 0) {
    // Use deterministic selection from unused puzzles based on date
    const daysSinceEpoch = getDaysSinceEpoch();
    const puzzleIndex = Math.abs(daysSinceEpoch) % unusedPuzzles.length;
    selectedPuzzle = unusedPuzzles[puzzleIndex];
  } else {
    // All puzzles have been used, find the one with the oldest usage date
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const oldestEntry = sortedHistory[0];
    selectedPuzzle = puzzles.find(p => p.id === oldestEntry.puzzleId) || puzzles[0];
  }
  
  // Record the puzzle selection for today
  recordPuzzleUsage(selectedPuzzle.id, today);
  
  return selectedPuzzle;
};

export const getPuzzleNumber = (): number => {
  // Return the number of days since launch + 1
  return getDaysSinceEpoch() + 1;
}; 