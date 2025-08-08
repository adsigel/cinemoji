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
  gamesPlayed: number;
  gamesWon: number;
  totalStars: number;
  hintsUsed: { [key in HintType]: number };
  perfectDays: number; // 5-star wins with no hints
  lastPlayed?: string; // ISO date string for streak calculation
  firstPlayed?: string; // ISO date string for account age
}

export interface GameResult {
  puzzleId: number;
  date: string; // ISO date string
  completed: boolean;
  stars: number;
  hintsUsed: HintType[];
  attempts: number;
}

export interface ShareData {
  puzzleNumber: number;
  emojiPlot: string;
  stars: number;
  hintsUsed: HintType[];
  url: string;
}

export interface TodayGameState {
  puzzleId: number;
  date: string;
  guesses: string[];
  revealedHints: HintType[];
  isWon: boolean;
  isLost: boolean;
  gameCompleted: boolean;
} 