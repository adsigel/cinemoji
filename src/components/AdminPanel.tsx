import { useState, useEffect, useCallback, useMemo } from 'react';
import { puzzles } from '../data/puzzles';
import type { Puzzle } from '../types/game';

// TMDb API service for movie data
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NDVhNDcyMTM0YWEzYTU1ZDUwZTFhMjg1MjI5YzgwYiIsIm5iZiI6MTc1NDU5NjYwMy44MzcsInN1YiI6IjY4OTUwNGZiZjhmMTI1OGJmOGEzMmVhZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.MVJed1DPk8_ZV7qnkMJYxikdlj-VgmXhnOA7BK7rDt4';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PuzzleSchedule {
  date: string;
  puzzleId: number;
}

interface PuzzlePreview {
  date: string;
  puzzle: Puzzle;
  reason: string;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'stats' | 'schedule' | 'user' | 'preview'>('add');
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
  const [puzzlePreview, setPuzzlePreview] = useState<PuzzlePreview[]>([]);

  const getCustomPuzzles = (): Puzzle[] => {
    try {
      return JSON.parse(localStorage.getItem('cinemoji_custom_puzzles') || '[]');
    } catch {
      return [];
    }
  };

  const allPuzzles = useMemo(() => [...puzzles, ...getCustomPuzzles()], []);
  const sortedPuzzles = useMemo(() => [...allPuzzles].sort((a, b) => a.movie_title.localeCompare(b.movie_title)), [allPuzzles]);

  // Simulate the game's puzzle selection logic for a given date
  const simulatePuzzleSelection = useCallback((date: Date): Puzzle => {
    // Use the same logic as the actual game
    // Create epoch date in local timezone to avoid timezone conversion issues
    // If today (Aug 10) should show Poltergeist, and Aug 9 shows as day 0, then epoch should be Aug 9
    const epoch = new Date(2025, 7, 9); // Month is 0-indexed, so 7 = August, day 9
    epoch.setHours(0, 0, 0, 0); // Set to start of day
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Set to start of day
    
    const daysSinceEpoch = Math.floor((targetDate.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
    const puzzleIndex = Math.abs(daysSinceEpoch) % allPuzzles.length;
    return allPuzzles[puzzleIndex];
  }, [allPuzzles]);

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

  // Generate preview of next 7 days of puzzles
  const generatePuzzlePreview = useCallback(() => {
    const preview: PuzzlePreview[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Check if there's a scheduled puzzle for this date
      const scheduled = puzzleSchedule.find((s: PuzzleSchedule) => s.date === dateString);
      if (scheduled) {
        const puzzle = allPuzzles.find(p => p.id === scheduled.puzzleId);
        if (puzzle) {
          preview.push({
            date: dateString,
            puzzle,
            reason: 'Scheduled'
          });
          continue;
        }
      }
      
      // Simulate what the game logic would select
      const puzzle = simulatePuzzleSelection(date);
      preview.push({
        date: dateString,
        puzzle,
        reason: 'Auto-selected'
      });
    }
    
    setPuzzlePreview(preview);
  }, [puzzleSchedule, allPuzzles, simulatePuzzleSelection]);

  useEffect(() => {
    if (isOpen) {
      loadPuzzleSchedule();
      generatePuzzlePreview();
    }
  }, [isOpen, generatePuzzlePreview]);



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

    alert('Puzzle added successfully!');
  };

  const exportCustomPuzzles = () => {
    try {
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
    } catch (error) {
      console.error('Error exporting puzzles:', error);
      alert('Error exporting puzzles');
    }
  };

  const fetchTMDbData = async (movieTitle: string) => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(movieTitle)}`, {
        headers: {
          'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from TMDb');
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        
        // Fetch detailed movie info including credits
        const detailResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?append_to_response=credits`, {
          headers: {
            'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          
          // Auto-fill the form with TMDb data
          setNewPuzzle((prev: Partial<Puzzle>) => ({
            ...prev,
            hints: {
              ...prev.hints!,
              year: detailData.release_date?.split('-')[0] || '',
              tagline: detailData.tagline || ''
            }
          }));

          // Auto-fill actors if available
          if (detailData.credits?.cast) {
            const cast = detailData.credits.cast.slice(0, 2);
            if (cast[0]) {
              setNewPuzzle((prev: Partial<Puzzle>) => ({
                ...prev,
                hints: {
                  ...prev.hints!,
                  actor1: cast[0].name
                }
              }));
            }
            if (cast[1]) {
              setNewPuzzle((prev: Partial<Puzzle>) => ({
                ...prev,
                hints: {
                  ...prev.hints!,
                  actor2: cast[1].name
                }
              }));
            }
          }

          // Auto-fill director if available
          if (detailData.credits?.crew) {
            const director = detailData.credits.crew.find((person: { name: string; job: string }) => person.job === 'Director');
            if (director) {
              setNewPuzzle((prev: Partial<Puzzle>) => ({
                ...prev,
                hints: {
                  ...prev.hints!,
                  director: director.name
                }
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching TMDb data:', error);
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
    generatePuzzlePreview(); // Refresh preview
  };

  const handleRemoveSchedule = (date: string) => {
    const newSchedule = puzzleSchedule.filter((s: PuzzleSchedule) => s.date !== date);
    savePuzzleSchedule(newSchedule);
    generatePuzzlePreview(); // Refresh preview
  };

  const handleResetStats = () => {
    if (!statsResetDate) {
      alert('Please select a date');
      return;
    }

    if (confirm(`Are you sure you want to reset all user statistics for ${statsResetDate}? This action cannot be undone.`)) {
      try {
        // Get current stats
        const currentStats = JSON.parse(localStorage.getItem('cinemoji_user_stats') || '{}');
        
        // Remove entries for the selected date
        const filteredStats = Object.keys(currentStats).reduce((acc: Record<string, unknown>, key) => {
          if (key !== statsResetDate) {
            acc[key] = currentStats[key];
          }
          return acc;
        }, {});
        
        localStorage.setItem('cinemoji_user_stats', JSON.stringify(filteredStats));
        alert('Statistics reset successfully');
        setStatsResetDate('');
      } catch (error) {
        console.error('Error resetting stats:', error);
        alert('Error resetting statistics');
      }
    }
  };

  const handleResetUser = () => {
    if (confirm(`Are you sure you want to reset user data${userResetId ? ` for user ${userResetId}` : ''}? This action cannot be undone.`)) {
      try {
        if (userResetId) {
          // Reset specific user
          const currentStats = JSON.parse(localStorage.getItem('cinemoji_user_stats') || '{}');
          delete currentStats[userResetId];
          localStorage.setItem('cinemoji_user_stats', JSON.stringify(currentStats));
        } else {
          // Reset current user
          localStorage.removeItem('cinemoji_user_stats');
          localStorage.removeItem('cinemoji_game_history');
          localStorage.removeItem('cinemoji_today_game_state');
        }
        
        alert('User data reset successfully');
        setUserResetId('');
      } catch (error) {
        console.error('Error resetting user:', error);
        alert('Error resetting user data');
      }
    }
  };

  const getPuzzleLastPlayed = (puzzleId: number): string | null => {
    try {
      const history = JSON.parse(localStorage.getItem('cinemoji_puzzle_history') || '[]');
      const entry = history.find((h: { puzzleId: number; date: string }) => h.puzzleId === puzzleId);
      return entry ? entry.date : null;
    } catch {
      return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
            🎬 Cinemoji Admin Panel
          </h2>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb', 
          marginBottom: '2rem',
          gap: '0.5rem'
        }}>
          {[
            { id: 'add', label: 'Add Puzzle' },
            { id: 'schedule', label: 'Schedule Puzzles' },
            { id: 'preview', label: 'Puzzle Preview' },
            { id: 'stats', label: 'Reset Stats' },
            { id: 'user', label: 'Reset User' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'add' | 'stats' | 'schedule' | 'user' | 'preview')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
          {/* Add Puzzle Tab */}
          {activeTab === 'add' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                Add New Puzzle
              </h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Movie Title
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
                      onClick={() => newPuzzle.movie_title && fetchTMDbData(newPuzzle.movie_title)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Fetch TMDb Data
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
                    Emoji Plot
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
                    fontSize: '0.75rem',
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                Schedule Puzzles
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
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
                    Puzzle
                  </label>
                  <select
                    value={selectedPuzzleId}
                    onChange={(e) => setSelectedPuzzleId(e.target.value ? Number(e.target.value) : '')}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
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
                style={{
                  width: '100%',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: (!selectedDate || !selectedPuzzleId) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (selectedDate && selectedPuzzleId) {
                    e.currentTarget.style.backgroundColor = '#6d28d9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDate && selectedPuzzleId) {
                    e.currentTarget.style.backgroundColor = '#7c3aed';
                  }
                }}
              >
                Schedule Puzzle
              </button>

              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                  Current Schedule
                </h4>
                {puzzleSchedule.length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No puzzles scheduled</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {puzzleSchedule.map(schedule => {
                      const puzzle = allPuzzles.find(p => p.id === schedule.puzzleId);
                      return (
                        <div key={schedule.date} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem'
                        }}>
                          <div>
                            <span style={{ fontWeight: '500' }}>{schedule.date}</span>
                            <span style={{ marginLeft: '1rem', color: '#6b7280' }}>
                              {puzzle ? `${puzzle.movie_title} (${puzzle.emoji_plot})` : 'Unknown puzzle'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveSchedule(schedule.date)}
                            style={{
                              color: '#dc2626',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#b91c1c'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#dc2626'}
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

          {/* Puzzle Preview Tab */}
          {activeTab === 'preview' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                Next 7 Days - Puzzle Preview
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                This shows what puzzles the game logic would automatically select for the next 7 days.
                You can override any day by scheduling a specific puzzle in the Schedule tab.
              </p>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {puzzlePreview.map((preview) => (
                  <div key={preview.date} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: preview.reason === 'Scheduled' ? '#f0f9ff' : '#f9fafb',
                    border: preview.reason === 'Scheduled' ? '1px solid #0ea5e9' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {new Date(preview.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                        {preview.puzzle.emoji_plot}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                        {preview.puzzle.movie_title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {preview.puzzle.hints.year} • {preview.puzzle.difficulty}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: preview.reason === 'Scheduled' ? '#0ea5e9' : '#6b7280',
                        color: 'white',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {preview.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={generatePuzzlePreview}
                style={{
                  backgroundColor: '#6366f1',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5855eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                Refresh Preview
              </button>
            </div>
          )}

          {/* Reset Stats Tab */}
          {activeTab === 'stats' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                Reset User Statistics
              </h3>
              
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                      Warning
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                      <p>
                        This will permanently delete all user statistics and game history for the selected date. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
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
                  Select Date to Reset
                </label>
                <input
                  type="date"
                  value={statsResetDate}
                  onChange={(e) => setStatsResetDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <button
                onClick={handleResetStats}
                disabled={!statsResetDate}
                style={{
                  width: '100%',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: !statsResetDate ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (statsResetDate) {
                    e.currentTarget.style.backgroundColor = '#b91c1c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statsResetDate) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }
                }}
              >
                Reset Stats for Selected Date
              </button>
            </div>
          )}

          {/* Reset User Tab */}
          {activeTab === 'user' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                Reset Single User
              </h3>
              
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                      Warning
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                      <p>
                        This will permanently delete all user data for the specified user. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
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
                  User ID (or leave empty to reset current user)
                </label>
                <input
                  type="text"
                  value={userResetId}
                  onChange={(e) => setUserResetId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter user ID or leave empty for current user"
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Leave empty to reset the current user's data
                </p>
              </div>

              <button
                onClick={handleResetUser}
                style={{
                  width: '100%',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
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
