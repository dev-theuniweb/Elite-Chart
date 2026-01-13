# Architecture Update - Lifted State Pattern

## Overview
Refactored BTCChart to support **lifted state architecture** matching the team member's implementation while maintaining backward compatibility with the original SignalR game engine approach.

## Changes Made

### 1. **New Component Structure**

```
App.jsx
  └── BTCChartWrapper.jsx (NEW - Parent component with lifted state)
        └── BTCChart.jsx (Refactored - Now accepts props)
```

### 2. **BTCChart.jsx - Prop-Based Architecture**

#### **New Props:**
```jsx
const BTCChart = ({ 
  memberId,           // Member ID from parent
  handleCreateOrder,  // Order creation handler from parent
  betAmount,          // Controlled by parent
  setBetAmount,       // Setter from parent
  selectedTrend,      // Controlled by parent
  setSelectedTrend    // Setter from parent
})
```

#### **State Management:**
- `betAmount` and `selectedTrend` are now **controlled by parent** via props
- Removed local state for these values
- Parent controls all betting input state

### 3. **BTCChartWrapper.jsx - New Parent Component**

**Responsibilities:**
- Manages lifted state for `betAmount` and `selectedTrend`
- Provides `handleCreateOrder` function for backend integration
- Handles API communication (currently simulated)
- Passes controlled state down to BTCChart

**Key Features:**
```jsx
const handleCreateOrder = async (orderRequest) => {
  // Prepare data for backend API
  const orderData = {
    MemberID: state.memberId,
    GameID: 6,
    BetNumber: state.selectedTrend,
    BetAmount: parseFloat(state.betAmount),
    // ... other fields
  };
  
  // TODO: Call actual backend API
  // const response = await DataSource.shared.postGameTransaction(orderData);
};
```

### 4. **Dual Architecture Support**

BTCChart now supports **both architectures**:

#### **A. Lifted State (New - Team Member's Approach)**
- Parent provides `memberId` prop
- Parent provides `handleCreateOrder` callback
- Betting state controlled by parent
- Member auth UI hidden (managed by parent)

#### **B. Game Engine SignalR (Original)**
- No `memberId` prop provided
- Shows member auth UI in BTCChart
- Local SignalR connection to game engine
- Self-contained betting state

**createOrder function logic:**
```jsx
const createOrder = async (betNumber) => {
  // If parent provided handleCreateOrder, use it
  if (handleCreateOrder && typeof handleCreateOrder === 'function') {
    console.log('📤 [LIFTED STATE] Using parent handleCreateOrder');
    await handleCreateOrder(orderRequest);
    return;
  }

  // Otherwise, use game engine connection
  if (!gameEngineConnectionRef.current || !isGameEngineConnected) {
    alert("⚠️ Not connected to game engine");
    return;
  }
  
  await gameEngineConnectionRef.current.invoke("CreateOrder", orderRequest);
};
```

## Benefits

### ✅ **Better Integration**
- Easier to integrate with existing backend systems
- Parent component controls API calls
- Centralized state management

### ✅ **Reusability**
- BTCChart becomes a presentational component
- Can be reused in different contexts
- Props make behavior configurable

### ✅ **Backward Compatibility**
- Original SignalR approach still works
- No breaking changes to existing functionality
- Gradual migration path

### ✅ **Testability**
- Easier to test with mocked props
- Parent component can mock API calls
- Cleaner separation of concerns

## Usage Examples

### **Lifted State Architecture (Recommended)**
```jsx
// App.jsx or parent component
import BTCChartWrapper from './components/BTCChartWrapper';

function App() {
  return <BTCChartWrapper />;
}
```

### **Direct Usage (For Custom Integration)**
```jsx
import BTCChart from './components/BTCChart';

function CustomParent() {
  const [betAmount, setBetAmount] = useState('');
  const [selectedTrend, setSelectedTrend] = useState(null);
  
  const handleOrder = async (orderRequest) => {
    // Your custom backend integration
    await myAPI.createOrder(orderRequest);
  };
  
  return (
    <BTCChart
      memberId="user-123"
      betAmount={betAmount}
      setBetAmount={setBetAmount}
      selectedTrend={selectedTrend}
      setSelectedTrend={setSelectedTrend}
      handleCreateOrder={handleOrder}
    />
  );
}
```

### **Original SignalR Architecture (Still Supported)**
```jsx
import BTCChart from './components/BTCChart';

function App() {
  // No props needed - uses internal state and SignalR
  return <BTCChart />;
}
```

## Next Steps

1. **Backend Integration**: Update `BTCChartWrapper.jsx` with actual API calls
2. **Member Authentication**: Integrate with your auth system
3. **Transaction Polling**: Implement `fetchTransactionUntilResult()` function
4. **Modal Feedback**: Add success/error modals for better UX

## Files Modified

- ✅ `src/components/BTCChart.jsx` - Refactored to accept props
- ✅ `src/components/BTCChartWrapper.jsx` - New parent component
- ✅ `src/App.jsx` - Updated to use BTCChartWrapper
- ✅ API integration maintained (dynamic trends, min/max amounts)

## API Features Still Active

- ✅ Fetch game config from `/api/v1/game/get/6`
- ✅ Dynamic 8 trends (AU, SU, MU, QU, AD, SD, MD, QD)
- ✅ Dynamic min/max bet amounts
- ✅ PayoutPercent support
- ✅ Fallback to hardcoded trends on API error
