import { useState, useEffect, useCallback } from 'react'
import { getTodaysPuzzle, getPuzzleNumber, getTodayDateString } from './utils/dateUtils'
import { isCorrectGuess, calculateStars, HINT_INFO, formatShareText } from './utils/gameLogic'
import { searchMovies, debounce, type MovieSuggestion } from './services/tmdb'
import { recordGameResult, getUserStats, getCalculatedStats, getGameHistory } from './utils/localStorage'
import type { Puzzle, HintType, UserStats, GameResult } from './types/game'
import './App.css'

function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [guess, setGuess] = useState('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [revealedHints, setRevealedHints] = useState<HintType[]>([])
  const [isWon, setIsWon] = useState(false)
  const [isLost, setIsLost] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [gameRecorded, setGameRecorded] = useState(false)
  
  // Modal states
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showDonateModal, setShowDonateModal] = useState(false)

  useEffect(() => {
    const todaysPuzzle = getTodaysPuzzle()
    setPuzzle(todaysPuzzle)
    
    // Load user stats
    const stats = getUserStats()
    setUserStats(stats)
  }, [])

  // Record game result when game ends
  useEffect(() => {
    if ((isWon || isLost) && puzzle && !gameRecorded) {
      const gameResult: GameResult = {
        puzzleId: puzzle.id,
        date: getTodayDateString(),
        completed: isWon,
        stars: isWon ? calculateStars(guesses.length) : 0,
        hintsUsed: revealedHints,
        attempts: guesses.length
      }
      
      const newStats = recordGameResult(gameResult)
      setUserStats(newStats)
      setGameRecorded(true)
    }
  }, [isWon, isLost, puzzle, guesses.length, revealedHints, gameRecorded])

  // Debounced TMDb search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2 || isWon || isLost) {
        setSuggestions([])
        setShowSuggestions(false)
        setIsLoadingSuggestions(false)
        return
      }

      setIsLoadingSuggestions(true)
      try {
        const results = await searchMovies(query)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300),
    [isWon, isLost]
  )

  // Auto-suggest functionality with TMDb
  useEffect(() => {
    debouncedSearch(guess)
  }, [guess, debouncedSearch])

  const stars = calculateStars(guesses.length + 1)
  const maxGuesses = 5

  // Helper function to remove year from movie title
  const removeYear = (title: string): string => {
    return title.replace(/\s*\(\d{4}\)\s*$/, '').trim()
  }

  const handleGuess = (guessText?: string, originalTitle?: string) => {
    // Use originalTitle if provided (from suggestion click), otherwise use guessText or guess
    let finalGuess = originalTitle || guessText || guess
    
    // Remove year from guess if it exists
    finalGuess = removeYear(finalGuess)
    
    if (!puzzle || !finalGuess.trim() || isWon || isLost) return

    const newGuesses = [...guesses, finalGuess.trim()]
    setGuesses(newGuesses)

    if (isCorrectGuess(finalGuess, puzzle.movie_title)) {
      setIsWon(true)
      setShowShare(true)
    } else if (newGuesses.length >= maxGuesses) {
      setIsLost(true)
      setShowShare(true)
    }

    setGuess('')
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: MovieSuggestion) => {
    // Set the display title (with year) in the input field
    setGuess(suggestion.displayTitle)
    setShowSuggestions(false)
    // Don't auto-submit, let user click Guess button
  }

  const handleHint = (hintType: HintType) => {
    if (!revealedHints.includes(hintType)) {
      setRevealedHints([...revealedHints, hintType])
    }
  }

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleShare = async () => {
    if (!puzzle) return
    
    const shareText = formatShareText(
      getPuzzleNumber(),
      puzzle.emoji_plot,
      isWon ? stars : 0,
      revealedHints,
      'movemoji.vercel.app'
    )

    // Try native share first on mobile, then clipboard as fallback
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ 
          title: `Movemoji #${getPuzzleNumber()}`,
          text: shareText 
        })
        return
      } catch (shareErr) {
        // If user cancels share dialog, fall through to clipboard
        if (shareErr instanceof Error && shareErr.name === 'AbortError') {
          console.log('User cancelled share')
          return
        }
      }
    }

    // Fallback to clipboard with custom toast
    try {
      await navigator.clipboard.writeText(shareText)
      showToastMessage('Results copied to clipboard! 📋')
    } catch (err) {
      // Final fallback to showing the text
      prompt('Copy this text to share:', shareText)
    }
  }

  const renderStars = () => {
    if (isLost) return <span style={{ fontSize: '1.5rem' }}>💔</span>
    
    const starCount = isWon ? calculateStars(guesses.length) : stars
    const starEmojis = '⭐'.repeat(Math.max(0, starCount))
    const hintEmojis = revealedHints.map(hint => HINT_INFO[hint].emoji).join('')
    
    return (
      <span style={{ fontSize: '1.5rem' }}>
        {starEmojis}{hintEmojis}
      </span>
    )
  }

  // Modal component
  const Modal = ({ isOpen, onClose, title, children }: {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
  }) => {
    if (!isOpen) return null

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
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '32rem',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151',
              margin: 0
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          
          {/* Modal Content */}
          <div style={{ padding: '1.5rem' }}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Stats Modal Content
  const StatsModalContent = () => {
    if (!userStats || userStats.gamesPlayed === 0) {
      return (
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>Play your first game to see statistics!</p>
        </div>
      )
    }

    const calculatedStats = getCalculatedStats(userStats)
    const gameHistory = getGameHistory()
    
    // Calculate current win streak
    const calculateWinStreak = () => {
      if (gameHistory.length === 0) return 0
      
      // Sort by date descending (most recent first)
      const sortedGames = gameHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      let streak = 0
      for (const game of sortedGames) {
        if (game.completed) {
          streak++
        } else {
          break
        }
      }
      return streak
    }
    
    const currentStreak = calculateWinStreak()

    return (
      <div>
        {/* Main stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>
              {userStats.gamesPlayed}
            </div>
            <div style={{ color: '#6b7280' }}>Games Played</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {calculatedStats.winRate}%
            </div>
            <div style={{ color: '#6b7280' }}>Win Rate</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {calculatedStats.averageStars}⭐
            </div>
            <div style={{ color: '#6b7280' }}>Average Stars</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              {currentStreak}
            </div>
            <div style={{ color: '#6b7280' }}>Current Streak</div>
          </div>
        </div>
        
        {/* Additional stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {userStats.perfectDays}
            </div>
            <div style={{ color: '#6b7280' }}>Perfect Games</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#06b6d4' }}>
              {calculatedStats.totalHintsUsed}
            </div>
            <div style={{ color: '#6b7280' }}>Total Hints Used</div>
          </div>
        </div>
        
        {/* Hint usage histogram */}
        {calculatedStats.totalHintsUsed > 0 && (
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
              Hint Usage Breakdown
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(Object.entries(userStats.hintsUsed) as [HintType, number][])
                .sort((a, b) => b[1] - a[1])
                .filter(([, count]) => count > 0)
                .map(([hintType, count]) => {
                  const hintInfo = HINT_INFO[hintType]
                  const percentage = (count / calculatedStats.totalHintsUsed) * 100
                  return (
                    <div key={hintType} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '6rem' }}>
                        <span style={{ fontSize: '1rem' }}>{hintInfo.emoji}</span>
                        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>{hintInfo.label}</span>
                      </div>
                      <div style={{ flex: 1, backgroundColor: '#e5e7eb', borderRadius: '0.5rem', height: '0.75rem', position: 'relative' }}>
                        <div style={{ 
                          backgroundColor: '#6366f1', 
                          height: '100%', 
                          borderRadius: '0.5rem',
                          width: `${percentage}%`,
                          minWidth: percentage > 0 ? '0.25rem' : '0'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280', minWidth: '2.5rem', textAlign: 'right', fontWeight: '500' }}>
                        {count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ maxWidth: '28rem', margin: '0 auto', padding: '1rem' }}>Loading puzzle...</div>
      </div>
    )
  }

  // Separate tagline from other hints for layout
  const regularHints = (Object.keys(HINT_INFO) as HintType[]).filter(hint => hint !== 'tagline')
  const taglineHint = 'tagline' as HintType

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div style={{ maxWidth: '28rem', margin: '0 auto', padding: '1rem' }}>
        {/* Modals */}
        <Modal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="📊 Your Statistics">
          <StatsModalContent />
        </Modal>
        
        <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="❓ How to Play">
          <div>
            <p style={{ marginBottom: '1rem' }}>Welcome to Movemoji! Guess the movie from emoji clues.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong>🎯 Goal:</strong> Guess the movie title in 5 tries or less
              </div>
              <div>
                <strong>⭐ Scoring:</strong> Fewer guesses = more stars (max 5⭐)
              </div>
              <div>
                <strong>💡 Hints:</strong> Use hints to help, but they'll appear in your score
              </div>
              <div>
                <strong>🔄 Daily:</strong> New puzzle every day at midnight
              </div>
              <div>
                <strong>📱 Share:</strong> Share your results without spoiling the answer
              </div>
            </div>
          </div>
        </Modal>
        
        <Modal isOpen={showDonateModal} onClose={() => setShowDonateModal(false)} title="💚 Support Movemoji">
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem' }}>Enjoying Movemoji? Help keep it running!</p>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Your support helps cover hosting costs and keeps the game ad-free.
            </p>
            <button style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              ☕ Buy us a coffee
            </button>
          </div>
        </Modal>

        {/* Custom Toast Notification */}
        {showToast && (
          <div style={{
            position: 'fixed',
            top: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontWeight: '500',
            fontSize: '0.9rem'
          }}>
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ width: '4rem' }}></div> {/* Spacer for centering */}
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#6366f1', margin: 0 }}>
              Movemoji #{getPuzzleNumber()}
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowHelpModal(true)}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                title="How to play"
              >
                ❓
              </button>
              <button
                onClick={() => setShowStatsModal(true)}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                title="Your statistics"
              >
                📊
              </button>
              <button
                onClick={() => setShowDonateModal(true)}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                title="Support the game"
              >
                💚
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            {renderStars()}
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {guesses.length}/{maxGuesses} guesses
            </span>
          </div>
        </header>

        {/* Emoji Plot Display */}
        <div style={{ 
          fontSize: '2.5rem', 
          textAlign: 'center', 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '2px solid #f3f4f6',
          marginBottom: '1.5rem',
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, emoji',
          lineHeight: '1.2',
          letterSpacing: '0.1em'
        }}>
          {puzzle.emoji_plot}
        </div>

        {/* Game Status */}
        {isWon && (
          <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.75rem' }}>
            <p style={{ color: '#166534', fontWeight: '600' }}>🎉 Correct! The movie was:</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#14532d' }}>{puzzle.movie_title}</p>
          </div>
        )}

        {isLost && (
          <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.75rem' }}>
            <p style={{ color: '#dc2626', fontWeight: '600' }}>💔 Game Over! The movie was:</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#991b1b' }}>{puzzle.movie_title}</p>
          </div>
        )}

        {/* Guess Input */}
        {!isWon && !isLost && (
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // When user presses Enter, use the original title if it's a suggestion
                    const matchingSuggestion = suggestions.find(s => s.displayTitle === guess)
                    handleGuess(guess, matchingSuggestion?.originalTitle)
                  }
                }}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                placeholder="Enter your guess..."
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  fontSize: '1.125rem', 
                  border: '2px solid #d1d5db', 
                  borderRadius: '0.75rem',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              />
              <button
                onClick={() => {
                  // When user clicks Guess, use the original title if it's a suggestion
                  const matchingSuggestion = suggestions.find(s => s.displayTitle === guess)
                  handleGuess(guess, matchingSuggestion?.originalTitle)
                }}
                disabled={!guess.trim()}
                style={{ 
                  padding: '1rem 1.5rem', 
                  backgroundColor: guess.trim() ? '#6366f1' : '#d1d5db', 
                  color: 'white', 
                  borderRadius: '0.75rem', 
                  fontWeight: '600',
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: guess.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap'
                }}
              >
                Guess
              </button>
            </div>
            
            {/* TMDb Auto-suggestions */}
            {(showSuggestions || isLoadingSuggestions) && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                backgroundColor: 'white', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                marginTop: '0.25rem'
              }}>
                {isLoadingSuggestions && (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                    Searching movies...
                  </div>
                )}
                {!isLoadingSuggestions && suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      textAlign: 'left', 
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {suggestion.displayTitle}
                  </button>
                ))}
                {!isLoadingSuggestions && suggestions.length === 0 && guess.length >= 2 && (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                    No movies found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Previous Guesses */}
        {guesses.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Previous Guesses:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {guesses.map((g, i) => (
                <div key={i} style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  {i + 1}. {g}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hint Buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Hints:</h3>
          
          {/* Regular hints in 2x2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {regularHints.map((hintType) => {
              const hintInfo = HINT_INFO[hintType]
              const isRevealed = revealedHints.includes(hintType)
              const hintText = isRevealed ? puzzle.hints[hintType] : hintInfo.label
              
              return (
                <button
                  key={hintType}
                  onClick={() => handleHint(hintType)}
                  disabled={isRevealed}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-start', 
                    gap: '0.5rem', 
                    padding: '0.75rem', 
                    backgroundColor: isRevealed ? '#f3f4f6' : 'white', 
                    border: `2px solid ${isRevealed ? '#d1d5db' : '#e5e7eb'}`, 
                    borderRadius: '0.75rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    cursor: isRevealed ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    minHeight: '3rem',
                    boxShadow: isRevealed ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{hintInfo.emoji}</span>
                  <span style={{ 
                    color: isRevealed ? '#4b5563' : '#374151',
                    lineHeight: '1.3',
                    wordBreak: 'break-word'
                  }}>
                    {hintText}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tagline button - matches combined width of buttons above */}
          <div>
            {(() => {
              const hintInfo = HINT_INFO[taglineHint]
              const isRevealed = revealedHints.includes(taglineHint)
              const hintText = isRevealed ? puzzle.hints[taglineHint] : hintInfo.label
              
              return (
                <button
                  onClick={() => handleHint(taglineHint)}
                  disabled={isRevealed}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-start', 
                    gap: '0.5rem', 
                    padding: '0.75rem', 
                    backgroundColor: isRevealed ? '#f3f4f6' : 'white', 
                    border: `2px solid ${isRevealed ? '#d1d5db' : '#e5e7eb'}`, 
                    borderRadius: '0.75rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    cursor: isRevealed ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    minHeight: '3rem',
                    boxShadow: isRevealed ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                    width: '100%'
                  }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{hintInfo.emoji}</span>
                  <span style={{ 
                    color: isRevealed ? '#4b5563' : '#374151',
                    lineHeight: '1.3',
                    wordBreak: 'break-word'
                  }}>
                    {hintText}
                  </span>
                </button>
              )
            })()}
          </div>
        </div>

        {/* Share Button */}
        {showShare && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleShare}
              style={{ 
                padding: '0.75rem 2rem', 
                backgroundColor: '#10b981', 
                color: 'white', 
                borderRadius: '0.75rem', 
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Share Results 📋
            </button>
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', marginTop: '2rem' }}>
          <p>A daily movie guessing game 🎬</p>
          <p>
            Test specific puzzles with{' '}
            <code style={{ backgroundColor: 'white', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>?puzzle=1</code> through{' '}
            <code style={{ backgroundColor: 'white', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>?puzzle=20</code>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
