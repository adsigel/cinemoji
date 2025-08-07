import { useState, useEffect } from 'react'
import { getTodaysPuzzle, getPuzzleNumber } from './utils/dateUtils'
import { isCorrectGuess, calculateStars, HINT_INFO, formatShareText } from './utils/gameLogic'
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

  useEffect(() => {
    const todaysPuzzle = getTodaysPuzzle()
    setPuzzle(todaysPuzzle)
  }, [])

  const stars = calculateStars(guesses.length + 1)
  const maxGuesses = 5

  const handleGuess = () => {
    if (!puzzle || !guess.trim() || isWon || isLost) return

    const newGuesses = [...guesses, guess.trim()]
    setGuesses(newGuesses)

    if (isCorrectGuess(guess, puzzle.movie_title)) {
      setIsWon(true)
      setShowShare(true)
    } else if (newGuesses.length >= maxGuesses) {
      setIsLost(true)
      setShowShare(true)
    }

    setGuess('')
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

    if (navigator.share) {
      await navigator.share({ text: shareText })
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Results copied to clipboard!')
    }
  }

  const renderStars = () => {
    if (isLost) return <span className="star-display">💔</span>
    
    const starCount = isWon ? calculateStars(guesses.length) : stars
    const starEmojis = '⭐'.repeat(Math.max(0, starCount))
    const hintEmojis = revealedHints.map(hint => HINT_INFO[hint].emoji).join('')
    
    return (
      <span className="star-display">
        {starEmojis}{hintEmojis}
      </span>
    )
  }

  if (!puzzle) {
    return <div className="game-container">Loading puzzle...</div>
  }

  return (
    <div className="game-container">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-movie-purple mb-2">
          Movemoji #{getPuzzleNumber()}
        </h1>
        <div className="flex justify-center items-center gap-4">
          {renderStars()}
          <span className="text-sm text-gray-600">
            {guesses.length}/{maxGuesses} guesses
          </span>
        </div>
      </header>

      {/* Emoji Plot Display */}
      <div className="emoji-display mb-6">
        {puzzle.emoji_plot}
      </div>

      {/* Game Status */}
      {isWon && (
        <div className="text-center mb-4 p-4 bg-green-100 rounded-xl">
          <p className="text-green-800 font-semibold">🎉 Correct! The movie was:</p>
          <p className="text-xl font-bold text-green-900">{puzzle.movie_title}</p>
        </div>
      )}

      {isLost && (
        <div className="text-center mb-4 p-4 bg-red-100 rounded-xl">
          <p className="text-red-800 font-semibold">💔 Game Over! The movie was:</p>
          <p className="text-xl font-bold text-red-900">{puzzle.movie_title}</p>
        </div>
      )}

      {/* Guess Input */}
      {!isWon && !isLost && (
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="Enter your guess..."
              className="game-input flex-1"
            />
            <button
              onClick={handleGuess}
              disabled={!guess.trim()}
              className="px-6 py-4 bg-movie-purple text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guess
            </button>
          </div>
        </div>
      )}

      {/* Previous Guesses */}
      {guesses.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Previous Guesses:</h3>
          <div className="space-y-1">
            {guesses.map((g, i) => (
              <div key={i} className="p-2 bg-gray-100 rounded text-gray-700">
                {i + 1}. {g}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint Buttons */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Hints:</h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(HINT_INFO) as HintType[]).map((hintType) => {
            const hintInfo = HINT_INFO[hintType]
            const isRevealed = revealedHints.includes(hintType)
            
            return (
              <button
                key={hintType}
                onClick={() => handleHint(hintType)}
                disabled={isRevealed}
                className="hint-button"
              >
                <span>{hintInfo.emoji}</span>
                <span>{isRevealed ? puzzle.hints[hintType] : hintInfo.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Share Button */}
      {showShare && (
        <div className="text-center">
          <button
            onClick={handleShare}
            className="px-8 py-3 bg-movie-green text-white rounded-xl font-medium hover:bg-green-700"
          >
            Share Results 📋
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 mt-8">
        <p>A daily movie guessing game 🎬</p>
        <p>
          Test specific puzzles with{' '}
          <code className="bg-gray-100 px-1 rounded">?puzzle=1</code> through{' '}
          <code className="bg-gray-100 px-1 rounded">?puzzle=20</code>
        </p>
      </footer>
    </div>
  )
}

export default App
