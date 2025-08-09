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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 50,
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '72rem',
        height: '95vh',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>🎬 Cinemoji Admin Panel</h2>
          <button
            onClick={onClose}
            style={{
              color: '#6b7280',
              fontSize: '1.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: '500',
              borderBottom: activeTab === 'add' ? '2px solid #7c3aed' : 'none',
              color: activeTab === 'add' ? '#7c3aed' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'add') e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'add') e.currentTarget.style.color = '#6b7280';
            }}
          >
            Add Puzzle
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: '500',
              borderBottom: activeTab === 'schedule' ? '2px solid #7c3aed' : 'none',
              color: activeTab === 'schedule' ? '#7c3aed' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'schedule') e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'schedule') e.currentTarget.style.color = '#6b7280';
            }}
          >
            Schedule Puzzles
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: '500',
              borderBottom: activeTab === 'stats' ? '2px solid #7c3aed' : 'none',
              color: activeTab === 'stats' ? '#7c3aed' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'stats') e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'stats') e.currentTarget.style.color = '#6b7280';
            }}
          >
            Reset Stats
          </button>
          <button
            onClick={() => setActiveTab('user')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: '500',
              borderBottom: activeTab === 'user' ? '2px solid #7c3aed' : 'none',
              color: activeTab === 'user' ? '#7c3aed' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'user') e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'user') e.currentTarget.style.color = '#6b7280';
            }}
          >
            Reset User
          </button>
        </div>

        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          height: 'calc(95vh - 140px)'
        }}>
          {/* Add Puzzle Tab */}
          {activeTab === 'add' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>Add New Puzzle</h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Movie Title *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={newPuzzle.movie_title}
                      onChange={(e) => setNewPuzzle({...newPuzzle, movie_title: e.target.value})}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                      placeholder="e.g., The Matrix"
                    />
                    <button
                      type="button"
                      onClick={() => fetchTMDbData(newPuzzle.movie_title || '')}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                      title="Auto-fill from TMDb"
                    >
                      🎬 TMDb
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Difficulty
                  </label>
                  <select
                    value={newPuzzle.difficulty}
                    onChange={(e) => setNewPuzzle({...newPuzzle, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Emoji Plot *
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.emoji_plot}
                    onChange={(e) => setNewPuzzle({...newPuzzle, emoji_plot: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g., 👦☎️👨🏿💊🖥🌏🤖🔫🔫🚁🔫🔫"
                  />
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    Use emojis to represent the movie plot. Be creative!
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Actor 1
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.actor1}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, actor1: e.target.value}
                    })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g., Keanu Reeves"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Actor 2
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.actor2}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, actor2: e.target.value}
                    })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g., Laurence Fishburne"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Year
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.year}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, year: e.target.value}
                    })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g., 1999"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Director
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.director}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, director: e.target.value}
                    })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g., Lana Wachowski"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={newPuzzle.hints?.tagline}
                    onChange={(e) => setNewPuzzle({
                      ...newPuzzle, 
                      hints: {...newPuzzle.hints!, tagline: e.target.value}
                    })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g., Reality is a thing of the past."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleAddPuzzle}
                  style={{
                    flex: 1,
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                >
                  Add Puzzle
                </button>
                <button
                  onClick={exportCustomPuzzles}
                  style={{
                    flex: 1,
                    backgroundColor: '#4b5563',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
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
