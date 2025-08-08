import * as amplitude from '@amplitude/analytics-browser';
import type { HintType } from '../types/game';

// Use environment variable with correct source-specific API key as fallback
const AMPLITUDE_API_KEY = process.env.VITE_AMPLITUDE_API_KEY || process.env.AMPLITUDE_API_KEY || '325dfb50ecaaacbc7314d3dacd3ceec7';

export const initAnalytics = () => {
  if (AMPLITUDE_API_KEY) {
    amplitude.init(AMPLITUDE_API_KEY, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: false,
        fileDownloads: false,
      },
    });
    console.log('Amplitude analytics initialized');
  } else {
    console.warn('Amplitude API key not found. Analytics disabled.');
  }
};

// Game Events
export const trackGameStart = (puzzleId: number, puzzleNumber: number) => {
  amplitude.track('Game Started', {
    puzzle_id: puzzleId,
    puzzle_number: puzzleNumber,
    timestamp: new Date().toISOString(),
  });
};

export const trackGuess = (puzzleId: number, guessNumber: number, isCorrect: boolean, guessText: string) => {
  amplitude.track('Guess Made', {
    puzzle_id: puzzleId,
    guess_number: guessNumber,
    is_correct: isCorrect,
    guess_length: guessText.length,
    timestamp: new Date().toISOString(),
  });
};

export const trackHintUsed = (puzzleId: number, hintType: HintType, hintsUsedSoFar: number) => {
  amplitude.track('Hint Used', {
    puzzle_id: puzzleId,
    hint_type: hintType,
    hints_used_so_far: hintsUsedSoFar,
    timestamp: new Date().toISOString(),
  });
};

export const trackGameComplete = (
  puzzleId: number, 
  won: boolean, 
  stars: number, 
  totalGuesses: number, 
  hintsUsed: HintType[]
) => {
  amplitude.track('Game Completed', {
    puzzle_id: puzzleId,
    won,
    stars,
    total_guesses: totalGuesses,
    hints_used: hintsUsed,
    hints_count: hintsUsed.length,
    is_perfect: won && stars === 5 && hintsUsed.length === 0,
    timestamp: new Date().toISOString(),
  });
};

export const trackShare = (puzzleId: number, shareMethod: 'native' | 'clipboard' | 'prompt') => {
  amplitude.track('Results Shared', {
    puzzle_id: puzzleId,
    share_method: shareMethod,
    timestamp: new Date().toISOString(),
  });
};

// UI Events
export const trackModalOpen = (modalType: 'help' | 'stats' | 'donate') => {
  amplitude.track('Modal Opened', {
    modal_type: modalType,
    timestamp: new Date().toISOString(),
  });
};

export const trackDonationClick = (tier: 'coffee' | 'snacks' | 'ticket') => {
  amplitude.track('Donation Clicked', {
    tier,
    timestamp: new Date().toISOString(),
  });
};

export const trackAutoSuggestUsed = (puzzleId: number, selectedTitle: string, wasCorrect: boolean) => {
  amplitude.track('Auto Suggest Used', {
    puzzle_id: puzzleId,
    selected_title: selectedTitle,
    was_correct: wasCorrect,
    timestamp: new Date().toISOString(),
  });
};

// User Behavior
export const trackDailyReturn = (daysSinceLastVisit: number, totalGamesPlayed: number) => {
  amplitude.track('Daily Return', {
    days_since_last_visit: daysSinceLastVisit,
    total_games_played: totalGamesPlayed,
    timestamp: new Date().toISOString(),
  });
};

export const trackStreakAchieved = (streakLength: number) => {
  amplitude.track('Streak Achieved', {
    streak_length: streakLength,
    timestamp: new Date().toISOString(),
  });
}; 