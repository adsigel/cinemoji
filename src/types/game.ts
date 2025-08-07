export interface Puzzle {
  id: number;
  movie_title: string;
  emoji_plot: string;
  tmdb_id?: number;
  hints: {
    actor1: string;
    actor2: string;
    year: string;
    director: string;
    tagline: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  notes?: string;
}

export interface GameState {
  currentPuzzle: Puzzle | null;
  guesses: string[];
  revealedHints: HintType[];
  isComplete: boolean;
  isWon: boolean;
  stars: number;
  gameDate: string;
}

export type HintType = 'actor1' | 'actor2' | 'year' | 'director' | 'tagline';

export interface HintInfo {
  type: HintType;
  emoji: string;
  label: string;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  perfectDays: number;
  averageStars: number;
  hintUsage: Record<HintType, number>;
}

export interface ShareData {
  puzzleNumber: number;
  emojiPlot: string;
  stars: number;
  hintsUsed: HintType[];
  url: string;
} 