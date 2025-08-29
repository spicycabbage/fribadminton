# 🏸 Badminton Tournament Scorer

A mobile-first Progressive Web App (PWA) for scoring doubles badminton tournaments. Built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features

### 🎯 Tournament Management
- **8-Player Doubles System** - Complete tournament logic with 7 rounds
- **Smart Team Matchups** - Automatic pairing system ensuring each player partners with every other player once
- **Real-time Scoring** - Live score updates with comprehensive validation
- **Score Editing** - Edit completed matches without disrupting tournament flow

### 📱 Mobile-Optimized PWA
- **iPhone 16 Pro Optimized** - Perfect display on latest mobile devices
- **Responsive Design** - Scales beautifully across all screen sizes using relative percentages
- **Offline Capable** - PWA functionality for tournament scoring without internet
- **Add to Home Screen** - Install as native app experience

### 🎮 User Experience
- **Intuitive Interface** - Three-tab system (Players/Matches/Rank)
- **Auto-Advance Logic** - Automatically proceeds to next round when complete
- **Visual Feedback** - Color-coded round buttons and match completion indicators
- **Smart Autocomplete** - Predefined player names for quick registration

### 🏆 Tournament Features
- **Live Rankings** - Real-time standings with detailed score breakdowns
- **Tournament Finalization** - Lock scores when tournament is complete
- **Access Code System** - Secure tournament joining (default: "111")
- **Score Validation** - Ensures proper badminton scoring (21-point system)

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with mobile-first approach
- **PWA**: next-pwa for offline functionality
- **Icons**: Heroicons for consistent UI
- **Performance**: Optimized with useCallback, useMemo, and requestAnimationFrame

## 🛠 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/badminton-tournament-scorer.git
cd badminton-tournament-scorer

# Install dependencies
npm install

# Run development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## 🎯 Game Logic

### Tournament Structure
- **8 Players** form teams for **7 rounds**
- Each player **partners with every other player exactly once**
- Each player **plays against every other player multiple times**
- **Highest total score wins** the tournament

### Scoring Rules
- **21-point system** - One team must reach exactly 21 points
- **Score validation** - No negative scores or scores above 21
- **Real-time calculation** - Automatic ranking updates after each match

## 📱 PWA Features

- **Offline Support** - Continue tournaments without internet
- **Install Prompt** - Add to home screen for native app feel
- **Fast Loading** - Optimized for mobile performance
- **Responsive Icons** - Multiple sizes for different devices

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:
```env
# Add any environment variables here
NEXT_PUBLIC_APP_NAME="Badminton Tournament Scorer"
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm run start
```

## 🏗 Architecture

### Waterfall Programming Style
- **Maximum code reuse** for easy maintenance
- **Modular components** with clear separation of concerns
- **Performance optimizations** throughout the codebase

### Key Components
- `TournamentHeader` - Displays date and access code
- `MatchesTab` - Score entry and match management
- `PlayersTab` - Player registration and editing
- `RankTab` - Live rankings and tournament summary

### Game Logic
- `gameLogic.ts` - Core tournament rules and calculations
- **Type-safe interfaces** for Tournament, Match, and Player data
- **Comprehensive validation** for all user inputs

## 🎨 Design System

### Mobile-First Approach
- **Relative percentages** for responsive scaling
- **Uniform button heights** (56px) for consistency
- **Touch-friendly targets** optimized for mobile interaction
- **Professional color scheme** with clear visual hierarchy

### UI Consistency
- **Color-coded elements** - Black (current), Green (completed), Red (pending)
- **Consistent spacing** using Tailwind's design system
- **Professional typography** with proper contrast ratios

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the game logic in `src/lib/gameLogic.ts`

---

**Built with ❤️ for badminton enthusiasts**