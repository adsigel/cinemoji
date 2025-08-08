import * as amplitude from '@amplitude/analytics-browser';
import type { HintType } from '../types/game';

// Initialize Amplitude (reads from VITE_AMPLITUDE_API_KEY environment variable)
// Force rebuild for environment variable pickup
const AMPLITUDE_API_KEY = process.env.VITE_AMPLITUDE_API_KEY || 'YOUR_AMPLITUDE_API_KEY';

export const initAnalytics = () => {
  // Temporary debug - remove after testing
  console.log('Amplitude API Key loaded:', AMPLITUDE_API_KEY ? 'YES' : 'NO');
  console.log('Key starts with:', AMPLITUDE_API_KEY?.substring(0, 10) + '...');
  
  if (AMPLITUDE_API_KEY && AMPLITUDE_API_KEY !== 'YOUR_AMPLITUDE_API_KEY') {
    amplitude.init(AMPLITUDE_API_KEY, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: false,
        fileDownloads: false,
      },
    });
    console.log('Amplitude initialized successfully');
  } else {
    console.warn('Amplitude API key not found. Analytics disabled.');
  }
};

// Game Events
export const trackGameStart = (puzzleId: number, puzzleNumber: number) => {
  console.log('Tracking Game Started event:', { puzzleId, puzzleNumber });
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