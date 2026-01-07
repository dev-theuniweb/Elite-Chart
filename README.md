# Elitechart - Bitcoin Battle Chart (Real-Time Price Prediction Game)

A sophisticated real-time Bitcoin price chart application with integrated betting functionality, built with React and Vite. Users can predict whether Bitcoin price will go up or down in live trading rounds and win rewards based on their predictions.

Deployed on Vercel under "HENG's projects" team for user testing and demonstration.

---

## 🎨 **THEMING SYSTEM (NEW - October 2025)**

### **Design Tokens Architecture**
This project now uses a **professional design tokens system** for easy theming and reusability!

✅ **Create new themed projects in 15 minutes**  
✅ **Change colors, sizes with CSS variables**  
✅ **No code duplication across projects**  
✅ **Professional, maintainable CSS structure**

### **Quick Start - Create New Project:**
```bash
# 1. Copy project folder
cp -r BBB BBB-YourProject

# 2. Edit ONE file only
# Edit: src/components/BTCChart/styles/theme.css
# Change: --color-up, --color-down, --bg-main

# 3. Deploy!
npm run build
```

### **File Structure:**
```
src/components/BTCChart/styles/
├── index.css   (import hub)
├── theme.css   (🎨 EDIT THIS for new projects)
├── core.css    (desktop styles - don't touch)
└── mobile.css  (responsive styles - don't touch)
```

📚 **Full Documentation:**
- [CSS Refactor Plan](./CSS_REFACTOR_PLAN.md) - Complete implementation guide
- [Theming Guide](./THEMING_GUIDE.md) - How to create new themed projects
- [Quick Reference](./QUICK_REFERENCE.md) - Commands and tokens cheat sheet

---

## 📋 **QUICK SUMMARY**

### ✅ **WHAT WE COMPLETED**
- **Real-time Chart System** with SignalR integration
- **Dynamic Y-axis Scaling** for dramatic price movements  
- **Price Precision** (2 decimal places everywhere)
- **Connection Status Messages** with auto-hide
- **Complete Betting System** with UP/DOWN functionality
- **Trends Display** showing last 5 movements
- **Audio Effects** for engagement
- **Live Deployment** on Vercel

### 🎯 **WHAT'S NEXT (Recorded)**
- **Remove price labels from chart** (you mentioned it's messy)
- **Big changes to trends & betting system** (you indicated major redesign)
- Mobile optimization and performance improvements
- Enhanced features and user testing feedback

### 📊 **PROJECT STATUS**
- **Live Demo**: https://bbb-d5eu83ej2-hengs-projects-f9eafd38.vercel.app
- **Code Repository**: Fully documented and pushed to GitHub
- **Technical Details**: Architecture, dependencies, and configuration recorded
- **Development Notes**: SignalR setup, chart performance, betting logic

---

## ✅ **COMPLETED FEATURES (September 2025)**

### 🎯 **Real-Time Chart System**
- ✅ **Live Bitcoin Price Feed**: SignalR WebSocket connection to `pricehub.ciic.games/pricehub`
- ✅ **Multiple Timeframes**: 1s, 15s, 30s, 1m intervals with dynamic data handling
- ✅ **Dynamic Y-Axis Scaling**: Aggressive scaling for dramatic price movement visualization
- ✅ **Price Precision**: All prices display 2 decimal places (115,372.12 format)
- ✅ **Clean Chart Display**: Removed messy internal price labels for better UX
- ✅ **Fallback Mode**: Automatic simulated data when live connection unavailable

### 🎛️ **Connection Management**
- ✅ **Connection Status Messages**: 
  - "Catching the Bitcoin stream..." (red, connecting)
  - "Connected! Let's ride these waves!" (green, connected)
  - Auto-hide after 2 seconds for clean UX
- ✅ **Robust SignalR Integration**: Handles reconnection and error states
- ✅ **Real-time Data Validation**: Filters and processes BTCUSDT candle data

### 🎰 **Betting System**
- ✅ **UP/DOWN Betting**: Users can bet on price direction
- ✅ **Balance Management**: Virtual currency system with $2000 starting balance
- ✅ **Payout Structure**: 1.975x multiplier (97.5% return + original bet)
- ✅ **Bet Resolution**: Automatic resolution based on 1-minute candle data
- ✅ **Active Bet Tracking**: Visual indicators during betting rounds
- ✅ **Audio Feedback**: Win/lose sound effects for engagement

### 📊 **Trends & History**
- ✅ **Live Trends Display**: Shows last 5 UP/DOWN trends with visual indicators
- ✅ **Betting History**: Complete record with win/loss tracking
- ✅ **Modal Interface**: Tabbed view for trends and betting history
- ✅ **Statistics Dashboard**: Win rates and performance metrics

### 🎨 **User Experience**
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Dark Theme**: Professional trading interface aesthetic
- ✅ **Smooth Animations**: Chart transitions and hover effects
- ✅ **Clean Layout**: Organized betting interface and trend display

### 🚀 **Production Deployment**
- ✅ **Vercel Deployment**: Live demo ready for user testing
- ✅ **Build Optimization**: Vite production build configured
- ✅ **Error Handling**: Fixed MIME type issues for proper deployment
- ✅ **Performance**: Optimized for fast loading and smooth operation

---

## 🛠️ **TECHNOLOGY STACK**

- **Frontend**: React 19.1.0 with modern Hooks
- **Build Tool**: Vite 6.3.5 for development and production
- **Real-time**: Microsoft SignalR 8.0.7 for WebSocket connections
- **Styling**: CSS modules with responsive design
- **Charts**: Custom SVG-based rendering system
- **Audio**: Web Audio API for sound effects
- **Deployment**: Vercel with optimized configuration

---

## 📁 **PROJECT STRUCTURE**

```
src/
├── components/
│   ├── BTCChart.jsx          # Main chart component (2,348 lines)
│   ├── BTCChart.css          # Comprehensive styling (1,143 lines)
│   ├── ui/                   # Reusable UI components
│   │   ├── AudioControls.jsx
│   │   ├── ConnectionStatus.jsx
│   │   ├── PriceDisplay.jsx
│   │   └── ...
├── hooks/
│   ├── useAudio.js           # Audio effects management
│   ├── useChartData.js       # Chart data processing
│   ├── useSignalRConnection.js
│   └── ...
├── constants/
│   └── chartConfig.js        # Chart configuration
├── utils/
│   ├── chartUtils.js         # Chart helper functions
│   ├── mockDataGenerator.js  # Fallback data generation
│   └── performanceUtils.js
└── assets/
    ├── bitcoin.png           # Bitcoin icon
    └── audio/                # Sound effect files
```

---

## 🎯 **NEXT STEPS & PLANNED IMPROVEMENTS**

### 🚧 **HIGH PRIORITY**
- [ ] **Remove Price Labels from Chart**: Clean up internal chart price labels (mentioned by user)
- [ ] **Big Changes to Trends & Betting**: Major system redesign (user indicated)
- [ ] **Performance Optimization**: Reduce chart re-renders for smoother operation
- [ ] **Mobile Optimization**: Improve mobile betting interface and chart interaction

### 🔮 **PLANNED FEATURES**
- [ ] **Enhanced Betting Options**: Multiple bet amounts, different timeframes
- [ ] **Leaderboard System**: User rankings and competition features
- [ ] **Advanced Chart Features**: Technical indicators, volume display
- [ ] **Social Features**: Chat, shared predictions, tournaments
- [ ] **Historical Data**: Extended price history and analysis tools

### 🛡️ **TECHNICAL IMPROVEMENTS**
- [ ] **Error Boundaries**: Better error handling and user feedback
- [ ] **Performance Monitoring**: Real-time performance metrics
- [ ] **Accessibility**: ARIA labels and keyboard navigation
- [ ] **Testing Suite**: Unit and integration tests for reliability
- [ ] **SEO Optimization**: Meta tags and social sharing features

### 🎨 **UI/UX ENHANCEMENTS**
- [ ] **Animation Polish**: Smoother chart transitions and bet feedback
- [ ] **Color Customization**: Theme switching and personalization
- [ ] **Tutorial System**: Onboarding for new users
- [ ] **Advanced Settings**: Chart preferences and betting options

---

## 🚀 **DEVELOPMENT STATUS**

**Current Version**: v1.0 (Production Ready)  
**Last Updated**: September 17, 2025  
**Live Demo**: ✅ Active and tested  
**User Testing**: 🟡 Ready for feedback collection  

### 📋 **IMMEDIATE TODO**
1. **User Testing**: Collect feedback from demo URL
2. **Performance Review**: Monitor chart performance with real users  
3. **Bug Fixes**: Address any issues found during testing
4. **Feature Planning**: Define scope for next major update

---

## 💡 **TECHNICAL NOTES**

### SignalR Configuration
- **Hub URL**: `https://pricehub.ciic.games/pricehub`
- **Data Filter**: BTCUSDT symbol only
- **Reconnection**: Automatic with exponential backoff
- **Fallback**: Simulated data generation when disconnected

### Chart Performance
- **Data Points**: Optimized for 1000+ price points
- **Update Frequency**: Real-time with throttling
- **Memory Management**: Circular buffer for price history
- **Rendering**: SVG with optimized path calculations

### Betting Logic
- **Round Duration**: 60 seconds based on candle timestamps
- **Resolution**: Price comparison (open vs close)
- **Payout**: 1.975x for wins, full loss for incorrect predictions
- **Validation**: Balance checks and duplicate bet prevention

---

## 🎮 How to Play

1. **Wait for Round Start**: Each trading round lasts 60 seconds
2. **Place Your Bet**: Choose UP or DOWN and set your bet amount
3. **Watch the Price**: Monitor real-time Bitcoin price movements
4. **Collect Winnings**: Win 1.975x your bet if you predict correctly

### Betting Rules
- **Minimum Bet**: $1
- **Maximum Bet**: Your current balance
- **One Bet Per Round**: Only one active bet allowed per 60-second round
- **Tie Handling**: Exact same price returns your original bet
- **Payout**: 97.5% profit on winning bets (2.5% house edge)

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BTC-Battle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Live Data Integration

The application connects to a SignalR hub for real-time Bitcoin price data:
- **Primary Source**: Live WebSocket connection to price feed
- **Fallback Mode**: Simulated price data when live connection fails
- **Automatic Reconnection**: Built-in reconnection logic for reliability

## 📊 Data Features

### Price Chart
- Real-time Bitcoin price visualization
- Smooth line chart with price points
- Color-coded price movements (green/red)
- Animated current price indicator

### Round System
- 60-second trading rounds
- Open/close price tracking
- Countdown timer with visual feedback
- Round result calculation and display

### Statistics Tracking
- Price trend history (up/down/same)
- Individual bet performance
- Balance management
- Win/loss statistics

## 🎨 UI/UX Features

- **Dark Theme**: Professional dark interface optimized for trading
- **Responsive Layout**: Works on desktop and mobile devices
- **Real-time Updates**: Smooth animations and live data updates
- **Visual Feedback**: Color-coded indicators for all states
- **Modal Interfaces**: Detailed history and statistics views

## 🧪 Development Features

- **Hot Module Replacement**: Fast development with Vite
- **ESLint Integration**: Code quality and consistency
- **Component Architecture**: Modular and reusable components
- **Error Boundaries**: Robust error handling (structure ready)
- **Testing Setup**: Testing framework configured (structure ready)

## 📈 Future Enhancements

The project structure includes placeholders for:
- Advanced chart features (technical indicators)
- Performance monitoring dashboard
- User authentication and profiles
- Historical data analysis
- Multiple cryptocurrency support
- Advanced betting strategies

## 🚦 Getting Started

Simply run `npm run dev` and navigate to the local development server. The application will automatically connect to live data and you can start placing virtual bets immediately.

---

**Note**: This is a demonstration application using virtual currency. No real money or cryptocurrency is involved in the betting system.
