# Movemoji 🎬⭐

A daily movie guessing game where users identify films based on emoji-only plot summaries. Inspired by Wordle, players get 5 guesses and can use strategic hints to help solve each puzzle.

## 🎮 Game Concept

- **Daily Puzzles**: One movie puzzle per day
- **Emoji Plots**: Movie plots expressed entirely in emojis
- **Star Scoring**: 5 stars max, lose one per wrong guess
- **Strategic Hints**: Choose from 5 hint types:
  - 🎬 Actor 1
  - 🎭 Actor 2  
  - 📆 Year
  - 🎥 Director
  - 🏷️ Tagline
- **Social Sharing**: Share results with emoji plots included

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd movemoji
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`
   - The game should load with today's puzzle

## 🛠️ Development Setup

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **API**: TMDb (The Movie Database) for movie metadata
- **Storage**: Browser localStorage for user stats

### Project Structure
```
src/
├── components/          # React components
│   ├── GameBoard.tsx   # Main game interface
│   ├── GuessInput.tsx  # Auto-suggest input field
│   ├── HintPanel.tsx   # Hint buttons and reveals
│   └── ShareModal.tsx  # Results sharing
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useTMDbApi.ts
│   └── useGameState.ts
├── utils/              # Helper functions
│   ├── dateUtils.ts    # Daily puzzle logic
│   ├── gameLogic.ts    # Scoring and validation
│   └── shareUtils.ts   # Generate share text
├── data/
│   └── puzzles.ts      # Movie puzzle data (20 puzzles)
└── types/              # TypeScript definitions
    └── game.ts         # Game interfaces
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Testing Specific Puzzles

For development and testing, you can view any specific puzzle by adding a URL parameter:

- `http://localhost:5174/` - Today's puzzle (normal mode)
- `http://localhost:5174/?puzzle=1` - Test puzzle #1 (Speed - 🚍💣)
- `http://localhost:5174/?puzzle=5` - Test puzzle #5 (The Three Amigos)
- `http://localhost:5174/?puzzle=20` - Test puzzle #20 (Se7en)

This makes it easy to test specific puzzles, difficulty levels, or emoji sequences during development.

### Game Logic

#### Daily Puzzle System
- Puzzles cycle through the 20 available movies
- Based on days since epoch (Jan 1, 2024)
- Automatically switches at midnight

#### Scoring System
- Start with 5 stars: ⭐⭐⭐⭐⭐
- Lose one star per incorrect guess
- Game ends after 5 wrong guesses: 💔
- Hints don't affect star count, but show in results

#### Share Format
```
Movemoji #123 🎬
🚍💣

⭐⭐⭐🎬🏷️

Play at movemoji.com
```

## 🎯 Current Features

### ✅ Completed
- [x] Project setup with React + TypeScript + Tailwind
- [x] 20 initial movie puzzles with emoji plots
- [x] Game type definitions and data structure
- [x] Daily puzzle rotation logic
- [x] Scoring system with star ratings
- [x] Individual actor hints (better game balance)
- [x] Share text generation

### 🚧 In Progress
- [ ] React components and UI
- [ ] TMDb API integration for auto-suggest
- [ ] Local storage for user stats
- [ ] Mobile-responsive design

### 🔮 Planned
- [ ] PWA (Progressive Web App) features
- [ ] Statistics dashboard
- [ ] Hint usage analytics
- [ ] Content Management System for puzzles
- [ ] Domain setup and production deployment

## 🎨 Design Guidelines

### Visual Style
- **Clean & Modern**: Minimal, card-based design
- **Whimsical**: Playful colors and animations
- **Mobile-First**: Optimized for thumb navigation
- **Accessible**: Good contrast and touch targets

### Color Palette
- `movie-purple`: #6366f1 (primary actions)
- `movie-pink`: #ec4899 (accents)
- `movie-yellow`: #f59e0b (highlights)
- `movie-green`: #10b981 (success states)

## 📱 Deployment

### Development/Testing
- **Vercel** (recommended): Automatic deployments from Git
- Connect GitHub repo for instant updates
- Share `movemoji-username.vercel.app` with friends

### Production
- Custom domain setup
- Performance optimization
- Analytics integration

## 🎬 Adding New Puzzles

To add new movie puzzles, update `src/data/puzzles.ts`:

```typescript
{
  id: 21,
  movie_title: "Movie Title",
  emoji_plot: "🎭🎪🎨", // Your creative emoji sequence
  difficulty: "medium",
  hints: {
    actor1: "Lead Actor",
    actor2: "Supporting Actor",
    year: "2020",
    director: "Director Name",
    tagline: "Movie tagline"
  },
  notes: "Optional development notes"
}
```

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes following TypeScript/React best practices
3. Test thoroughly on mobile and desktop
4. Update README if needed
5. Submit pull request

## 📄 License

[License details to be added]

---

**Built with ❤️ for movie lovers everywhere**
