import { useState, useEffect, useCallback } from 'react'
import { getTodaysPuzzle, getPuzzleNumber } from './utils/dateUtils'
import { isCorrectGuess, calculateStars, HINT_INFO, formatShareText } from './utils/gameLogic'
import { searchMovies, debounce, type MovieSuggestion } from './services/tmdb'
import type { Puzzle, HintType } from './types/game'
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

  useEffect(() => {
    const todaysPuzzle = getTodaysPuzzle()
    setPuzzle(todaysPuzzle)
  }, [])

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

  const handleGuess = (guessText?: string, originalTitle?: string) => {
    // Use originalTitle if provided (from suggestion click), otherwise use guessText or guess
    const finalGuess = originalTitle || guessText || guess
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
    setGuess(suggestion.displayTitle)
    setShowSuggestions(false)
    // Don't auto-submit, let user click Guess button
  }

  const handleHint = (hintType: HintType) => {
    if (!revealedHints.includes(hintType)) {
      setRevealedHints([...revealedHints, hintType])
    }
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

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareText)
      alert('Results copied to clipboard! 📋')
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '28rem', margin: '0 auto', padding: '1rem' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#6366f1', marginBottom: '0.5rem' }}>
            Movemoji #{getPuzzleNumber()}
          </h1>
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
                onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
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
                onClick={() => handleGuess()}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {(Object.keys(HINT_INFO) as HintType[]).map((hintType) => {
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
