import { puzzles } from '../data/puzzles';
import type { Puzzle } from '../types/game';

export const getTodayDateString = (): string => {
  const today = new Date();
  const easternTime = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const year = easternTime.getFullYear();
  const month = String(easternTime.getMonth() + 1).padStart(2, '0');
  const day = String(easternTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysSinceEpoch = (date: Date = new Date()): number => {
  // Convert current date to Eastern Time
  const easternTime = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Epoch date in Eastern Time (August 8, 2025)
  const epoch = new Date('2025-08-08T00:00:00-04:00'); // EDT time
  
  // Calculate difference in days
  const diffTime = easternTime.getTime() - epoch.getTime();
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

// Get custom puzzles from localStorage
const getCustomPuzzles = (): Puzzle[] => {
  try {
    return JSON.parse(localStorage.getItem('cinemoji_custom_puzzles') || '[]');
  } catch {
    return [];
  }
};

// Get puzzle schedule from localStorage
const getPuzzleSchedule = (): { puzzleId: number; date: string }[] => {
  try {
    return JSON.parse(localStorage.getItem('cinemoji_puzzle_schedule') || '[]');
  } catch {
    return [];
  }
};

export const getTodaysPuzzle = () => {
  const today = getTodayDateString();
  const history = getPuzzleHistory();
  const schedule = getPuzzleSchedule();
  const customPuzzles = getCustomPuzzles();
  const allPuzzles = [...puzzles, ...customPuzzles];
  
  // First, check if there's a scheduled puzzle for today
  const scheduledPuzzle = schedule.find(entry => entry.date === today);
  if (scheduledPuzzle) {
    const puzzle = allPuzzles.find(p => p.id === scheduledPuzzle.puzzleId);
    if (puzzle) {
      // Record the scheduled puzzle usage
      recordPuzzleUsage(puzzle.id, today);
      return puzzle;
    }
  }
  
  // Check if we already selected a puzzle for today
  const todaysPuzzle = history.find(entry => entry.date === today);
  if (todaysPuzzle) {
    const puzzle = allPuzzles.find(p => p.id === todaysPuzzle.puzzleId);
    if (puzzle) {
      return puzzle;
    }
  }
  
  // FIXED: Use deterministic puzzle selection that doesn't depend on localStorage state
  // Sort puzzles by ID to ensure consistent order across all browsers
  const sortedPuzzles = [...allPuzzles].sort((a, b) => a.id - b.id);
  
  // Use the date to deterministically select a puzzle
  const daysSinceEpoch = getDaysSinceEpoch();
  const puzzleIndex = Math.abs(daysSinceEpoch) % sortedPuzzles.length;
  const selectedPuzzle = sortedPuzzles[puzzleIndex];
  
  // Record the puzzle selection for today
  recordPuzzleUsage(selectedPuzzle.id, today);
  
  return selectedPuzzle;
};

export const getPuzzleNumber = (): number => {
  // Return the number of days since launch + 1
  return getDaysSinceEpoch() + 1;
}; 