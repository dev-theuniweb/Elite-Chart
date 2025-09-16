# BTC Battle - Real-Time Bitcoin Price Prediction Game

A real-time Bitcoin price chart application with integrated betting functionality, built with React and Vite. Users can predict whether Bitcoin price will go up or down in 60-second trading rounds and win rewards based on their predictions.

## 🚀 Features

### Real-Time Data
- **Live Bitcoin Price Feed**: Uses SignalR WebSocket connection for real-time price updates
- **Fallback Mode**: Automatic fallback to simulated data when live connection is unavailable
- **Connection Status**: Visual indicators showing connection state and data source

### Interactive Chart
- **Smooth Animations**: Animated SVG chart with smooth price movement visualization
- **Price Indicators**: Real-time price labels with directional color coding
- **Trend Analysis**: Visual trend indicators showing up/down/same price movements
- **Responsive Design**: Adapts to different screen sizes and devices

### Betting System
- **60-Second Rounds**: Predict price direction for the next minute
- **Virtual Balance**: Start with $2000 virtual currency
- **Payout System**: 1.975x multiplier for winning bets (2.5% house edge)
- **Risk Management**: Betting amount validation and balance tracking
- **Active Bet Tracking**: Visual indicators for placed bets during rounds

### History & Analytics
- **Price Trends History**: Track of recent price movement trends
- **Betting History**: Complete record of all placed bets and outcomes
- **Performance Statistics**: Win/loss ratios and total winnings tracking
- **Modal Interface**: Detailed history view with tabbed navigation

## 🛠️ Technology Stack

- **Frontend**: React 19.1.0 with Hooks
- **Build Tool**: Vite 6.3.5 for fast development and building
- **Real-time Data**: Microsoft SignalR 8.0.7 for WebSocket connections
- **Styling**: CSS modules with responsive design
- **Charts**: Custom SVG-based charting system
- **State Management**: React useState and useRef hooks

## 📁 Project Structure

```
src/
├── components/
│   ├── BTCChart.jsx          # Main chart component with betting logic
│   ├── BTCChart.css          # Chart styling and responsive design
│   ├── ui/                   # Reusable UI components
│   │   ├── ConnectionStatus.jsx    # Connection status indicator
│   │   ├── CountdownTimer.jsx      # Round countdown timer
│   │   ├── LoadingSpinner.jsx      # Loading animations
│   │   └── PriceDisplay.jsx        # Price formatting component
├── hooks/                    # Custom React hooks (structure ready)
├── utils/                    # Utility functions (structure ready)
├── constants/                # Configuration constants (structure ready)
└── assets/                   # Images and static resources
```

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
