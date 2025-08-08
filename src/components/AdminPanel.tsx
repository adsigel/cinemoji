import { useState, useEffect } from 'react';
import { puzzles } from '../data/puzzles';
import type { Puzzle } from '../types/game';

// TMDb API service for movie data
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NDVhNDcyMTM0YWEzYTU1ZDUwZTFhMjg1MjI5YzgwYiIsIm5iZiI6MTc1NDU5NjYwMy44MzcsInN1YiI6IjY4OTUwNGZiZjhmMTI1OGJmOGEzMmVhZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.MVJed1DPk8_ZV7qnkMJYxikdlj-VgmXhnOA7BK7rDt4';

interface TMDbMovie {
  id: number;
  title: string;
  release_date: string;
  tagline: string;
  credits?: {
    cast: Array<{ name: string; order: number }>;
    crew: Array<{ name: string; job: string }>;
  };
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PuzzleSchedule {
  date: string;
  puzzleId: number;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'stats' | 'schedule' | 'user'>('add');
  const [newPuzzle, setNewPuzzle] = useState<Partial<Puzzle>>({
    movie_title: '',
    emoji_plot: '',
    difficulty: 'medium',
    hints: {
      actor1: '',
      actor2: '',
      year: '',
      director: '',
      tagline: ''
    }
  });
  const [puzzleSchedule, setPuzzleSchedule] = useState<PuzzleSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<number | ''>('');
  const [statsResetDate, setStatsResetDate] = useState('');
  const [userResetId, setUserResetId] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPuzzleSchedule();
    }
  }, [isOpen]);

  const loadPuzzleSchedule = () => {
    try {
      const stored = localStorage.getItem('cinemoji_puzzle_schedule');
      if (stored) {
        setPuzzleSchedule(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading puzzle schedule:', error);
    }
  };

  const savePuzzleSchedule = (schedule: PuzzleSchedule[]) => {
    try {
      localStorage.setItem('cinemoji_puzzle_schedule', JSON.stringify(schedule));
      setPuzzleSchedule(schedule);
    } catch (error) {
      console.error('Error saving puzzle schedule:', error);
    }
  };

  const handleAddPuzzle = () => {
    if (!newPuzzle.movie_title || !newPuzzle.emoji_plot) {
      alert('Please fill in movie title and emoji plot');
      return;
    }

    const puzzle: Puzzle = {
      id: Math.max(...puzzles.map(p => p.id)) + 1,
      movie_title: newPuzzle.movie_title!,
      emoji_plot: newPuzzle.emoji_plot!,
      difficulty: newPuzzle.difficulty || 'medium',
      hints: {
        actor1: newPuzzle.hints?.actor1 || '',
        actor2: newPuzzle.hints?.actor2 || '',
        year: newPuzzle.hints?.year || '',
        director: newPuzzle.hints?.director || '',
        tagline: newPuzzle.hints?.tagline || ''
      }
    };

    // In a real app, this would save to a database
    // For now, we'll store in localStorage as a temporary solution
    const customPuzzles = JSON.parse(localStorage.getItem('cinemoji_custom_puzzles') || '[]');
    customPuzzles.push(puzzle);
    localStorage.setItem('cinemoji_custom_puzzles', JSON.stringify(customPuzzles));

    // Reset form
    setNewPuzzle({
      movie_title: '',
      emoji_plot: '',
      difficulty: 'medium',
      hints: {
        actor1: '',
        actor2: '',
        year: '',
        director: '',
        tagline: ''
      }
    });

    alert('Puzzle added successfully! (Note: This is stored locally for demo purposes)');
  };

  const exportCustomPuzzles = () => {
    const customPuzzles = JSON.parse(localStorage.getItem('cinemoji_custom_puzzles') || '[]');
    if (customPuzzles.length === 0) {
      alert('No custom puzzles to export');
      return;
    }

    const dataStr = JSON.stringify(customPuzzles, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cinemoji_custom_puzzles.json';
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`Exported ${customPuzzles.length} custom puzzles to cinemoji_custom_puzzles.json`);
  };

  const fetchTMDbData = async (movieTitle: string) => {
    if (!movieTitle.trim()) {
      alert('Please enter a movie title first');
      return;
    }

    try {
      // Search for the movie
      const searchResponse = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(movieTitle)}&include_adult=false&language=en-US&page=1`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to search for movie');
      }

      const searchData = await searchResponse.json();
      if (!searchData.results || searchData.results.length === 0) {
        alert('No movie found with that title');
        return;
      }

      const movie = searchData.results[0]; // Get the first (most relevant) result

      // Get detailed movie info including credits
      const detailResponse = await fetch(
        `${TMDB_BASE_URL}/movie/${movie.id}?append_to_response=credits&language=en-US`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!detailResponse.ok) {
        throw new Error('Failed to get movie details');
      }

      const movieData: TMDbMovie = await detailResponse.json();

      // Extract cast and crew
      const cast = movieData.credits?.cast || [];
      const crew = movieData.credits?.crew || [];
      
      const director = crew.find(person => person.job === 'Director')?.name || '';
      const actor1 = cast[0]?.name || '';
      const actor2 = cast[1]?.name || '';
      const year = movieData.release_date ? new Date(movieData.release_date).getFullYear().toString() : '';
      const tagline = movieData.tagline || '';

      // Update the form
      setNewPuzzle(prev => ({
        ...prev,
        movie_title: movieData.title,
        hints: {
          actor1,
          actor2,
          year,
          director,
          tagline
        }
      }));

      alert(`Auto-filled data for "${movieData.title}" (${year})`);
    } catch (error) {
      console.error('Error fetching TMDb data:', error);
      alert('Failed to fetch movie data. Please check the title and try again.');
    }
  };

  const handleSchedulePuzzle = () => {
    if (!selectedDate || !selectedPuzzleId) {
      alert('Please select both date and puzzle');
      return;
    }

    const newSchedule = [...puzzleSchedule];
    const existingIndex = newSchedule.findIndex(s => s.date === selectedDate);
    
    if (existingIndex >= 0) {
      newSchedule[existingIndex] = { date: selectedDate, puzzleId: selectedPuzzleId as number };
    } else {
      newSchedule.push({ date: selectedDate, puzzleId: selectedPuzzleId as number });
    }

    savePuzzleSchedule(newSchedule);
    setSelectedDate('');
    setSelectedPuzzleId('');
    alert('Puzzle scheduled successfully!');
  };

  const handleRemoveSchedule = (date: string) => {
    const newSchedule = puzzleSchedule.filter(s => s.date !== date);
    savePuzzleSchedule(newSchedule);
  };

  const handleResetStats = () => {
    if (!statsResetDate) {
      alert('Please select a date');
      return;
    }

    if (confirm(`Are you sure you want to reset all user stats for ${statsResetDate}? This cannot be undone.`)) {
      // Clear all localStorage data for that date
      const keysToRemove = [
        'cinemoji_user_stats',
        'cinemoji_game_history',
        'cinemoji_puzzle_history'
      ];

      keysToRemove.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            // Filter out entries for the selected date
            if (Array.isArray(data)) {
              const filtered = data.filter((item: any) => item.date !== statsResetDate);
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        } catch (error) {
          console.error(`Error resetting stats for ${key}:`, error);
        }
      });

      alert('Stats reset successfully!');
      setStatsResetDate('');
    }
  };

  const handleResetUser = () => {
    if (!userResetId) {
      alert('Please enter a user ID');
      return;
    }

    if (confirm(`Are you sure you want to reset all stats for user ${userResetId}? This cannot be undone.`)) {
      // Clear all localStorage data for this user
      const keysToRemove = [
        'cinemoji_user_stats',
        'cinemoji_game_history',
        'cinemoji_puzzle_history',
        'cinemoji_today_game_state'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`Error resetting user data for ${key}:`, error);
        }
      });

      alert('User data reset successfully!');
      setUserResetId('');
    }
  };

  const getCustomPuzzles = (): Puzzle[] => {
    try {
      return JSON.parse(localStorage.getItem('cinemoji_custom_puzzles') || '[]');
    } catch {
      return [];
    }
  };

  const getPuzzleLastPlayed = (puzzleId: number): string | null => {
    try {
      const history = JSON.parse(localStorage.getItem('cinemoji_puzzle_history') || '[]');
      const entry = history.find((entry: any) => entry.puzzleId === puzzleId);
      return entry ? entry.date : null;
    } catch {
      return null;
    }
  };

  const allPuzzles = [...puzzles, ...getCustomPuzzles()];
  
  // Sort puzzles: unplayed first, then by last played date (oldest first)
  const sortedPuzzles = allPuzzles.sort((a, b) => {
    const aLastPlayed = getPuzzleLastPlayed(a.id);
    const bLastPlayed = getPuzzleLastPlayed(b.id);
    
    // If both are unplayed, sort by ID
    if (!aLastPlayed && !bLastPlayed) {
      return a.id - b.id;
    }
    
    // If only one is unplayed, put unplayed first
    if (!aLastPlayed) return -1;
    if (!bLastPlayed) return 1;
    
    // Both have been played, sort by date (oldest first)
    return new Date(aLastPlayed).getTime() - new Date(bLastPlayed).getTime();
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[95vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">🎬 Cinemoji Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'add' 
                ? 'border-b-2 border-purple-500 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Puzzle
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'schedule' 
                ? 'border-b-2 border-purple-500 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Schedule Puzzles
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'stats' 
                ? 'border-b-2 border-purple-500 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reset Stats
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'user' 
                ? 'border-b-2 border-purple-500 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reset User
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(95vh-140px)]">
          {/* Add Puzzle Tab */}
          {activeTab === 'add' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Add New Puzzle</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Movie Title *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPuzzle.movie_title}
                      onChange={(e) => setNewPuzzle({...newPuzzle, movie_title: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., The Matrix"
                    />
                    <button
                      type="button"
                      onClick={() => fetchTMDbData(newPuzzle.movie_title || '')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      title="Auto-fill from TMDb"
                    >
                      🎬 TMDb
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={newPuzzle.difficulty}
                    onChange={(e) => setNewPuzzle({...newPuzzle, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji Plot *
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.emoji_plot}
                    onChange={(e) => setNewPuzzle({...newPuzzle, emoji_plot: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 👦☎️👨🏿💊🖥🌏🤖🔫🔫🚁🔫🔫"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use emojis to represent the movie plot. Be creative!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actor 1
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.actor1}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, actor1: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Keanu Reeves"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actor 2
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.actor2}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, actor2: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Laurence Fishburne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.year}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, year: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 1999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Director
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.director}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, director: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Lana Wachowski"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.tagline}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, tagline: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Reality is a thing of the past."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddPuzzle}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Add Puzzle
                </button>
                <button
                  onClick={exportCustomPuzzles}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Export Custom Puzzles
                </button>
              </div>
            </div>
          )}

          {/* Schedule Puzzles Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Schedule Puzzles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puzzle
                  </label>
                  <select
                    value={selectedPuzzleId}
                    onChange={(e) => setSelectedPuzzleId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a puzzle...</option>
                    {sortedPuzzles.map(puzzle => {
                      const lastPlayed = getPuzzleLastPlayed(puzzle.id);
                      const status = lastPlayed ? `Last played: ${lastPlayed}` : 'Unplayed';
                      return (
                        <option key={puzzle.id} value={puzzle.id}>
                          {puzzle.movie_title} ({puzzle.emoji_plot}) - {status}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSchedulePuzzle}
                disabled={!selectedDate || !selectedPuzzleId}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Schedule Puzzle
              </button>

              <div className="mt-8">
                <h4 className="text-lg font-medium mb-4">Current Schedule</h4>
                {puzzleSchedule.length === 0 ? (
                  <p className="text-gray-500">No puzzles scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {puzzleSchedule.map(schedule => {
                      const puzzle = allPuzzles.find(p => p.id === schedule.puzzleId);
                      return (
                        <div key={schedule.date} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div>
                            <span className="font-medium">{schedule.date}</span>
                            <span className="ml-4 text-gray-600">
                              {puzzle ? `${puzzle.movie_title} (${puzzle.emoji_plot})` : 'Unknown puzzle'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveSchedule(schedule.date)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Reset User Statistics</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This will permanently delete all user statistics and game history for the selected date. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date to Reset
                </label>
                <input
                  type="date"
                  value={statsResetDate}
                  onChange={(e) => setStatsResetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleResetStats}
                disabled={!statsResetDate}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Reset Stats for Selected Date
              </button>
            </div>
          )}

          {/* Reset User Tab */}
          {activeTab === 'user' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Reset Single User</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This will permanently delete all user data for the specified user. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID (or leave empty to reset current user)
                </label>
                <input
                  type="text"
                  value={userResetId}
                  onChange={(e) => setUserResetId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter user ID or leave empty for current user"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to reset the current user's data
                </p>
              </div>

              <button
                onClick={handleResetUser}
                disabled={!userResetId}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Reset User Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
