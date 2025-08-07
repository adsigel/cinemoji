import type { UserStats, GameResult, HintType } from '../types/game';

const STATS_KEY = 'movemoji_user_stats';
const HISTORY_KEY = 'movemoji_game_history';

// Initialize empty stats
const getDefaultStats = (): UserStats => ({
  gamesPlayed: 0,
  gamesWon: 0,
  totalStars: 0,
  hintsUsed: {
    actor1: 0,
    actor2: 0,
    year: 0,
    director: 0,
    tagline: 0
  },
  perfectDays: 0
});

// Get user statistics from localStorage
export const getUserStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) {
      return getDefaultStats();
    }
    
    const parsed = JSON.parse(stored) as UserStats;
    
    // Ensure all required fields exist (for backwards compatibility)
    return {
      ...getDefaultStats(),
      ...parsed
    };
  } catch (error) {
    console.error('Error reading user stats:', error);
    return getDefaultStats();
  }
};

// Save user statistics to localStorage
export const saveUserStats = (stats: UserStats): void => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

// Record a completed game and update statistics
export const recordGameResult = (result: GameResult): UserStats => {
  const currentStats = getUserStats();
  
  // Update basic stats
  const newStats: UserStats = {
    ...currentStats,
    gamesPlayed: currentStats.gamesPlayed + 1,
    lastPlayed: result.date
  };
  
  // Set first played date if not set
  if (!newStats.firstPlayed) {
    newStats.firstPlayed = result.date;
  }
  
  // If game was completed (won)
  if (result.completed) {
    newStats.gamesWon = currentStats.gamesWon + 1;
    newStats.totalStars = currentStats.totalStars + result.stars;
    
    // Check for perfect day (5 stars + no hints)
    if (result.stars === 5 && result.hintsUsed.length === 0) {
      newStats.perfectDays = currentStats.perfectDays + 1;
    }
  }
  
  // Update hint usage statistics
  result.hintsUsed.forEach(hintType => {
    newStats.hintsUsed[hintType] = currentStats.hintsUsed[hintType] + 1;
  });
  
  // Save updated stats
  saveUserStats(newStats);
  
  // Also save game result to history (for future streak calculations)
  saveGameResult(result);
  
  return newStats;
};

// Get game history from localStorage
export const getGameHistory = (): GameResult[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as GameResult[];
  } catch (error) {
    console.error('Error reading game history:', error);
    return [];
  }
};

// Save a game result to history
const saveGameResult = (result: GameResult): void => {
  try {
    const history = getGameHistory();
    
    // Remove any existing result for the same puzzle/date to avoid duplicates
    const filtered = history.filter(
      game => game.puzzleId !== result.puzzleId || game.date !== result.date
    );
    
    // Add new result and keep only last 100 games
    const newHistory = [...filtered, result].slice(-100);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error saving game result:', error);
  }
};

// Calculate derived statistics
export const getCalculatedStats = (stats: UserStats) => {
  const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
  const averageStars = stats.gamesWon > 0 ? stats.totalStars / stats.gamesWon : 0;
  const perfectRate = stats.gamesPlayed > 0 ? (stats.perfectDays / stats.gamesPlayed) * 100 : 0;
  
  // Find most and least used hints
  const hintEntries = Object.entries(stats.hintsUsed) as [HintType, number][];
  const mostUsedHint = hintEntries.reduce((max, current) => 
    current[1] > max[1] ? current : max, hintEntries[0]
  );
  const leastUsedHint = hintEntries.reduce((min, current) => 
    current[1] < min[1] ? current : min, hintEntries[0]
  );
  
  return {
    winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
    averageStars: Math.round(averageStars * 10) / 10,
    perfectRate: Math.round(perfectRate * 10) / 10,
    mostUsedHint: mostUsedHint[0],
    leastUsedHint: leastUsedHint[0],
    totalHintsUsed: hintEntries.reduce((sum, [, count]) => sum + count, 0)
  };
};

// Clear all data (for testing/reset)
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}; 