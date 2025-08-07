# Movemoji - Daily Movie Quiz Game Requirements

## Overview
Movemoji is a daily quiz game where users guess movie titles based on emoji-only plot summaries. Inspired by Wordle, the game emphasizes daily engagement and social sharing while rewarding efficiency with higher scores.

**🚀 CURRENT STATUS: MVP DEPLOYED TO PRODUCTION**
- **Live URL**: https://movemoji.vercel.app
- **Repository**: https://github.com/adsigel/movemoji
- **Auto-deployment**: Vercel deploys automatically from GitHub main branch

## Core Concept
- **One puzzle per day**: Each day features a single movie puzzle ✅ **IMPLEMENTED**
- **Emoji-only plots**: Movie plots are expressed entirely through emoji sequences ✅ **IMPLEMENTED**
- **Hint system**: Users can request hints to help with difficult puzzles ✅ **IMPLEMENTED**
- **Scoring system**: Fewer hints and guesses = higher points ✅ **IMPLEMENTED**
- **Social sharing**: Results can be shared to encourage viral growth ✅ **IMPLEMENTED**

## Key Features

### Daily Puzzle ✅ **IMPLEMENTED**
- One movie puzzle released each day
- Puzzle cycles through 20 hardcoded movies using date-based rotation
- **Testing feature**: URL parameter `?puzzle=1` through `?puzzle=20` for testing specific puzzles
- Automatic puzzle selection based on days since epoch

### Gameplay Mechanics ✅ **IMPLEMENTED**
- Users view an emoji sequence representing a movie plot
- **Guess input**: Free text with TMDb-powered auto-suggest ✅ **IMPLEMENTED**
  - Auto-suggest triggers after 2+ characters
  - Shows movie titles with years: "Jurassic Park (1993)"
  - Smart year removal when submitting guesses
  - Debounced API calls (300ms) for performance
  - Handles special cases like "Wall-E" variations
- **Hint system**: 5 hint types available ✅ **IMPLEMENTED**
  - Actor #1 (🎭)
  - Actor #2 (🎭) 
  - Year (📆)
  - Director (🎥)
  - Tagline (🏷️) - displayed in separate centered row
- **Smart guess matching**: Handles punctuation, articles, and international characters ✅ **IMPLEMENTED**

### Data Sources ✅ **IMPLEMENTED**
- **Movie metadata**: TMDb API integration with Read Access Token
- **Emoji plots**: 20 hardcoded movies with manually created emoji sequences
- **Auto-suggest**: TMDb search API with relevance scoring and popularity sorting
- **Hint information**: Stored locally in puzzle data structure

### Social Features ✅ **IMPLEMENTED**
- **Native mobile sharing**: Uses device share sheet on mobile
- **Clipboard fallback**: Custom toast notification on desktop
- **Share format**:
  ```
  Movemoji #123
  
  🚢❄️💎👫💀
  
  ⭐⭐⭐🎭📆
  
  Play at movemoji.vercel.app
  ```

## Technical Implementation ✅ **COMPLETED**

### Platform & User Experience
- **Mobile-first web app** - React + TypeScript + Vite ✅ **IMPLEMENTED**
- **Anonymous play** - no account required ✅ **IMPLEMENTED**
- **Responsive design** with subtle background and modern UI ✅ **IMPLEMENTED**
- **Custom toast notifications** for better UX ✅ **IMPLEMENTED**
- **Accessible design** with proper contrast and button states ✅ **IMPLEMENTED**

### Tech Stack ✅ **IMPLEMENTED**
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Inline CSS (switched from Tailwind for deployment compatibility)
- **API**: TMDb Read Access Token for movie search
- **Deployment**: Vercel with automatic GitHub integration
- **Storage**: Browser localStorage (planned for future implementation)

### Data Management ✅ **IMPLEMENTED**
- TMDb API integration with smart search strategies
- Hardcoded puzzle data in TypeScript modules
- Daily puzzle delivery using date-based selection
- URL-based puzzle testing system

## Scoring Algorithm ✅ **IMPLEMENTED**

### Star Rating System (Option 3 - Selected)
**Visual scoring with stars for guesses and specific emojis for hint types:**

#### Scoring Rules:
- **5 stars maximum**: Start with ⭐⭐⭐⭐⭐
- **Subtract one star per incorrect guess**
- **Game ends after 5 incorrect guesses** (shows 💔)
- **Hints use specific emojis** (don't affect star count):
  - Actor hints: 🎭 (both Actor #1 and Actor #2)
  - Year hints: 📆  
  - Director hints: 🎥
  - Tagline hints: 🏷️

#### Example Results:
- Perfect solve: `⭐⭐⭐⭐⭐` (first guess, no hints)
- First guess with 2 hints: `⭐⭐⭐⭐⭐🎭📆`
- Third guess with 4 hints: `⭐⭐⭐🎭📆🎥🏷️`
- Failed after 5 guesses: `💔` (game over)

## Hint System Details ✅ **IMPLEMENTED**

### Hint Mechanics
- **5 hint types available**: Actor #1 (🎭), Actor #2 (🎭), Year (📆), Director (🎥), Tagline (🏷️)
- **One-at-a-time reveal**: User selects which specific hint type to reveal
- **User choice**: Player decides which hint would be most helpful
- **No limit on hints**: Can use all 5 if needed
- **Strategic element**: Choosing the right hint order becomes part of the game

### Hint Selection Interface ✅ **IMPLEMENTED**
- **Unused hint buttons**: Show emoji + text (e.g., "🎭 Actor #1", "📆 Year")
- **Consistent button shapes**: Fixed height prevents layout shifts
- **Tagline special layout**: Full-width button centered below other hints
- **Revealed hints**: Show actual information with darker, readable text
- **Visual feedback**: Different styling for revealed vs. available hints

## Current Puzzle Library ✅ **IMPLEMENTED**
**20 Movies with Emoji Plots:**
1. Speed - 🚍💣
2. Psycho - 👱🚿👩🔪👣
3. Poltergeist - 🏠👩📺💥🌀💡🔆💡👵🛀👩👿💫🌀💡💥🚫🚘🏥
4. Inception - 🇯🇵😴➡️😴💰✈️😴😴😴➡️😴➡️😴☔️🚄🚓☔️😴🔫➡️😴❄️😴🔫🏢🔙😴➡️👫😳
5. The Three Amigos - 🇲🇽🌵⛪️😄😀😃🐎🎤😚🌳🎤🔥🏕👀✈️🐎🎉🎂👨🔫🔫🔫💃
6. The Shawshank Redemption - 👦🏢😐😬😏📝📚🎧🔨🔦💩😅💰👴🔫⛵️🌅
7. Ferris Bueller's Day Off - 😰😩😉🚗🙋🏙🍸🎨⚾️🎤🎉🚗💥👟😎
8. Back to the Future - ⏰⏰🎸😀👴⏱🚙⌛️⏳😀👦🚙💩🎸😘🌩⏳⌛️😊
9. You've Got Mail - 👦👧💻📚🌹💞
10. Big - 👦🖥🎠👳💤👨🌠🎹🤖👨‍❤️‍💋‍👨🎮👳👦
11. Ace Ventura: Pet Detective - 😀🔍🐶🚙🏈🐬⁉️👩🔀👨😖🐬🔍😉
12. Wall-E - 🌏🤖🌱😍🚀🌌💑🌎
13. The Wizard of Oz - 🌪🏠👧🌽🦁🤖🛣🐒😈💦👠🏠
14. Pulp Fiction - 👨🏻👨🏿🍔🔫💼👨🏻👩💃😵💉😳⌚️🚗💥🤐🗡🚗🔫🐺👦👧💰
15. Forrest Gump - 🚍👦🏃🏈👨👨🏿🇻🇳🏓🍤🏃👧💀
16. The Matrix - 👦☎️👨🏿💊🖥🌏🤖🔫🔫🚁🔫🔫
17. The Usual Suspects - 🚢🔥🔙👮😜😒😡😯👻🔥🔫📠☕️💥👣😏
18. Ghostbusters - 📚👻👵🏻😏🤓😳👩🏻🎻👻👩🏻➡️🐶🌩👻🔫😏👩🏻💏
19. Mrs. Doubtfire - 👨‍👩‍👧‍👦🐐🐴🎂🎉💔👨➡️👵🏻❤️👧👧👦
20. Se7en - 👮🏻👮🏿🍝💀🔪💀🛏😖🔪💀💊💀🚔📦🔫💀💀

## User Statistics (Anonymous/Local Storage) 📋 **PLANNED**
- **Current streak**: Consecutive days played and solved
- **Longest streak**: Best streak achieved
- **Games played**: Total puzzles attempted
- **Win rate**: Percentage of puzzles solved
- **Perfect days**: Days solved with 1 guess, no hints (⭐⭐⭐⭐⭐)
- **Average stars**: Mean star rating when successful
- **Hint usage analytics**: Track which hint types are used most/least frequently

## Questions Resolved ✅

### Gameplay Details
1. **Guess mechanics**: ✅ **IMPLEMENTED** - Free text with TMDb auto-suggest
   - Auto-suggest triggers after 2+ characters
   - Handles alternate titles and international variations
   - Case-insensitive matching with smart punctuation handling

2. **Hint system**: ✅ **IMPLEMENTED**
   - 5 hints available: Actor #1, Actor #2, Year, Director, Tagline
   - Revealed one at a time, user chooses order
   - No penalty for hints (separate from star scoring)

3. **Scoring system**: ✅ **IMPLEMENTED** - Star Rating System (Option 3)
   - Visual star display with hint emojis
   - Time to solve not tracked (focus on efficiency over speed)

### User Management
4. **User accounts**: ✅ **DECIDED** - Anonymous play with localStorage
   - Stats will persist until browser cache cleared
   - No account creation required for MVP

### Content Management
5. **Puzzle creation**: ✅ **IMPLEMENTED** - 20 hardcoded puzzles for MVP
   - Sufficient for initial validation and testing
   - CMS can be built later for scalable content management

### Technical Platform
6. **Platform**: ✅ **IMPLEMENTED** - Mobile-first web app
   - React + TypeScript + Vite
   - Deployed on Vercel with automatic GitHub integration
   - PWA features planned for future

7. **Movie database**: ✅ **IMPLEMENTED** - TMDb API
   - Auto-suggest with popularity sorting and relevance scoring
   - Handles remakes and variations with year display

### Social Features
8. **Sharing mechanism**: ✅ **IMPLEMENTED**
   - Includes emoji plot, star/hint results, and game URL
   - Native mobile share sheet with clipboard fallback
   - Custom toast notifications for better UX

## Completed Tasks ✅

### Core Game Development
- [x] Implement star rating scoring system
- [x] Create hint system with 5 hint types
- [x] Build daily puzzle rotation system
- [x] Create 20 hardcoded emoji movie puzzles
- [x] Implement free-text guessing with auto-suggest
- [x] Integrate TMDb API for movie search
- [x] Handle edge cases (punctuation, international titles, Wall-E)
- [x] Add URL-based puzzle testing (?puzzle=1-20)

### User Interface & Experience
- [x] Design mobile-first responsive layout
- [x] Implement custom toast notifications
- [x] Create consistent hint button layouts
- [x] Add subtle background and modern styling
- [x] Optimize tagline hint display (full-width, centered)
- [x] Implement smart auto-suggest behavior (no auto-submit)

### Technical Infrastructure
- [x] Set up React + TypeScript + Vite project
- [x] Configure Vercel deployment with GitHub integration
- [x] Implement TMDb API integration with error handling
- [x] Add debounced search with relevance scoring
- [x] Create comprehensive game logic utilities
- [x] Handle browser compatibility and mobile sharing

### Social Features
- [x] Build sharing mechanism with native mobile support
- [x] Design share text format with emoji plots
- [x] Implement clipboard fallback for desktop
- [x] Add custom toast notifications for share feedback

## Remaining Work 📋

### High Priority
- [ ] **Local Storage Implementation**: User statistics and progress tracking
  - Current streak, longest streak, games played
  - Win rate, perfect days, average stars
  - Hint usage analytics
- [ ] **PWA Features**: App-like experience on mobile
  - Service worker for offline capability
  - App manifest for "Add to Home Screen"
  - Caching strategy for better performance

### Medium Priority  
- [ ] **Enhanced Analytics**: Track puzzle difficulty and user engagement
- [ ] **Accessibility Improvements**: Screen reader support, keyboard navigation
- [ ] **Performance Optimization**: Lazy loading, image optimization
- [ ] **Error Handling**: Better user feedback for API failures

### Future Enhancements
- [ ] **Content Management System**: Admin interface for adding new puzzles
- [ ] **Advanced Statistics**: Detailed analytics dashboard
- [ ] **Themed Puzzles**: Special events, genre-specific puzzles
- [ ] **Leaderboards**: Optional social features
- [ ] **Multi-language Support**: International expansion

## Technical Architecture ✅ **IMPLEMENTED**

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Inline CSS** for reliable styling across environments
- **TMDb API** for movie data and auto-suggest

### File Structure
```
src/
├── components/          # React components (currently minimal)
├── data/
│   └── puzzles.ts      # 20 hardcoded movie puzzles
├── services/
│   └── tmdb.ts         # TMDb API integration
├── types/
│   └── game.ts         # TypeScript interfaces
├── utils/
│   ├── dateUtils.ts    # Daily puzzle selection
│   └── gameLogic.ts    # Scoring and game mechanics
├── App.tsx             # Main game component
├── App.css             # Custom styles
└── index.css           # Global styles
```

### Deployment
- **Vercel** hosting with automatic GitHub deployments
- **Environment**: Production-ready with proper error handling
- **Domain**: movemoji.vercel.app (custom domain available)

## Success Metrics 📊

### Current Status
- **✅ Functional MVP**: Complete playable game
- **✅ Mobile Optimized**: Responsive design working on all devices  
- **✅ Social Sharing**: Native mobile share + clipboard fallback
- **✅ Daily Puzzles**: 20 movies with automatic rotation
- **✅ Smart Auto-suggest**: TMDb integration with relevance scoring

### Next Milestones
- **User Retention**: Implement localStorage for statistics tracking
- **Performance**: Add PWA features for app-like experience
- **Content**: Expand puzzle library beyond initial 20 movies
- **Analytics**: Track user engagement and puzzle difficulty

---

**🎬 Ready for daily players! The core game experience is complete and deployed. Focus areas for continued development: user statistics, PWA features, and content expansion.** 