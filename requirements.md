# Movemoji - Daily Movie Quiz Game Requirements

## Overview
Movemoji is a daily quiz game where users guess movie titles based on emoji-only plot summaries. Inspired by Wordle, the game emphasizes daily engagement and social sharing while rewarding efficiency with higher scores.

## Core Concept
- **One puzzle per day**: Each day features a single movie puzzle
- **Emoji-only plots**: Movie plots are expressed entirely through emoji sequences
- **Hint system**: Users can request hints to help with difficult puzzles
- **Scoring system**: Fewer hints and guesses = higher points
- **Social sharing**: Results can be shared to encourage viral growth

## Key Features

### Daily Puzzle
- One movie puzzle released each day
- Puzzle remains available for 24 hours
- New puzzle automatically becomes available at midnight (timezone TBD)

### Gameplay Mechanics
- Users view an emoji sequence representing a movie plot
- **Guess input**: Free text with auto-suggest from movie database
  - Example: typing "Forr" suggests "Forrest Gump", "Finding Forrester"
  - Auto-complete helps with exact titles and reduces frustration
- Hint system available with multiple hint types:
  - Starring actors
  - Year of release
  - Director
  - Movie tagline
- Scoring based on efficiency (fewer hints/guesses = higher score)

### Data Sources
- **Movie metadata**: TMDb (The Movie Database) API - free and comprehensive
- **Emoji plots**: Manually created and curated via content management system
- **Hint information**: Pulled from TMDb (actors, year, director, tagline)

### Social Features
- Share results functionality for viral growth
- Results sharing should not spoil the puzzle for others

## Technical Requirements

### Platform & User Experience
- **Mobile-first web app** - responsive design optimized for mobile
- **Anonymous play** - no account required
- **Local storage** for user statistics and streaks
  - Browser localStorage to track: streaks, completion rate, perfect days %
  - Data persists across sessions on same device/browser
- Clean, intuitive interface
- Fast loading times

### Data Management
- TMDb API integration for movie metadata and auto-suggest
- **Initial puzzle storage**: Hardcoded emoji plots for MVP (scalable content solution later)
- Local storage for user progress and statistics
- Daily puzzle delivery system

## Scoring Algorithm Options

### Option 1: Simple Efficiency Score
- Track: Number of guesses + Number of hints used
- Display: "Solved in X guesses with Y hints"
- Share format: "Movemoji #123 🎬 2 guesses, 1 hint"
- **Pros**: Simple, clear, Wordle-like
- **Cons**: Less gamification, no point accumulation

### Option 2: Points with Penalties
- Start with base points (e.g., 100)
- Subtract points for each wrong guess (-10 points)
- Subtract points for each hint (-15 points)
- Bonus for no hints (+25 points)
- **Pros**: More engaging, allows leaderboards
- **Cons**: More complex, potential for negative scores

### Option 3: Star Rating System ✅ **SELECTED**
**Visual scoring with stars for guesses and specific emojis for hint types:**

#### Scoring Rules:
- **5 stars maximum**: Start with ⭐⭐⭐⭐⭐
- **Subtract one star per incorrect guess**
- **Game ends after 5 incorrect guesses** (no stars left)
- **Hints use specific emojis** (don't affect star count):
  - Actor hints: 🎬
  - Year hints: 📆  
  - Director hints: 🎥
  - Tagline hints: 🏷️

#### Example Results:
- Perfect solve: `⭐⭐⭐⭐⭐` (first guess, no hints)
- First guess with 2 hints: `⭐⭐⭐⭐⭐🎬📆`
- Third guess with 4 hints: `⭐⭐⭐🎬📆🎥🏷️`
- Failed after 5 guesses: `💔` (game over)

#### Share Format:
```
Movemoji #123 🎬
🚢❄️💎👫💀

⭐⭐⭐🎬🏷️

Play at movemoji.com
```

**Pros**: Visual, tells a story, great for social sharing, clear failure state
**Cons**: Limited to 5 attempts max

## Hint System Details

### Hint Mechanics
- **4 hint types available**: Actors (🎬), Year (📆), Director (🎥), Tagline (🏷️)
- **One-at-a-time reveal**: User selects which specific hint type to reveal
- **User choice**: Player decides which hint would be most helpful
- **No limit on hints**: Can use all 4 if needed
- **Strategic element**: Choosing the right hint order becomes part of the game

### Hint Selection Interface
- **Unused hint buttons**: Show emoji + text (e.g., "🎬 Actors", "📆 Year")
- Once revealed, hint shows actual information and emoji is added to score
- Revealed hints remain visible for the rest of the game
- Unrevealed hints stay as selectable options

## User Statistics (Anonymous/Local Storage)
- **Current streak**: Consecutive days played and solved
- **Longest streak**: Best streak achieved
- **Games played**: Total puzzles attempted
- **Win rate**: Percentage of puzzles solved
- **Perfect days**: Days solved with 1 guess, no hints (⭐⭐⭐⭐⭐)
- **Average stars**: Mean star rating when successful
- **Hint usage analytics**: Track which hint types are used most/least frequently
  - Most popular hint type
  - Least popular hint type
  - Average hints per successful game
- **Favorite genres**: Based on solved movies (if we track genres)

## Questions for Further Specification

### Gameplay Details
1. **Guess mechanics**: ✅ **DECIDED** - Free text with auto-suggest
   - How many characters before auto-suggest kicks in? (2-3 characters?)
   - Should we accept alternate titles/international titles?
   - Case-sensitive matching?

2. **Hint system**:
   - How many hints should be available per puzzle? (All 4: actors, year, director, tagline?)
   - Should hints be revealed one at a time or all available at once?
   - Should there be a cost/penalty for using hints?

3. **Scoring system**: 
   - Which of the three options above do you prefer?
   - Should we track time to solve?

### User Management
4. **User accounts**: ✅ **DECIDED** - Anonymous play with localStorage
   - How long should stats persist? (Until browser cache cleared?)
   - Should we offer optional account creation for cloud sync?

### Content Management
5. **Puzzle creation**: ✅ **DECIDED** - Start with hardcoded puzzles for MVP
   - Begin with 30-50 hardcoded movie puzzles to validate concept
   - CMS can be built later for scalable content management
   - Focus on game mechanics and user experience first

6. **Movie selection**:
   - What criteria for movie selection? (popularity, age rating, genre diversity?)
   - Should there be themed weeks/months?
   - How to handle international vs. domestic films?

### Technical Platform
7. **Platform**: ✅ **DECIDED** - Mobile-first web app
   - Progressive Web App (PWA) for app-like experience?
   - Offline capability for already-loaded puzzles?

8. **Movie database**: ✅ **DECIDED** - TMDb API
   - What metadata fields are most important for auto-suggest?
   - How to handle multiple versions of same movie (remakes, sequels)?

### Social Features
9. **Sharing mechanism**:
   - What format should shared results take?
   - Should it show the emoji plot or just score/stats?
   - Integration with specific social platforms?

### Monetization & Growth
10. **Business model**:
    - Free to play with ads?
    - Premium features?
    - Merchandise opportunities?

11. **Analytics**:
    - What metrics are important to track?
    - User engagement patterns?
    - Puzzle difficulty analytics?

## Next Steps
- [x] Finalize scoring system approach
- [x] Define hint system mechanics  
- [ ] Create initial set of hardcoded emoji movie puzzles (30-50 movies)
- [ ] Create UI/UX mockups for mobile-first design
- [ ] Research TMDb API integration requirements
- [ ] Plan technical architecture (frontend framework, hosting)
- [ ] Build sharing mechanism with emoji plot inclusion
- [ ] Design and implement anonymous user statistics tracking 