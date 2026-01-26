// src/components/BTCChartWrapper.jsx
import React, { useState } from 'react';
import BTCChart from './BTCChart';

/**
 * BTCChartWrapper - Parent component that manages lifted state
 * This matches the architecture used by the team member's implementation
 */
const BTCChartWrapper = ({
  memberId="2924",
  bearerToken="N7BsSCVhbpNpwYgq9aNHMFoFopprzvrBEmOEXYW1tuYSaYOZf_1VtLnFnHzyiW-HVX57880j4jZ03-VT3M761Tn4n55vqhwqf6q4e56N19p15qTgseMQElKSw-E3LVZp8acPrnuFYBu4ttAO5VCyNMiYm5ykTFYV8iiNfurD5_nx-kiFQ2HitbrxkMZ5G5_kmkF3uRZUpAfYt0NgHoHrOlPh4e-_a2Eyffr5qvJ3xQMie0SUTkT4Q5FnCtjeTMWE",
  passBalance // Team member passes {Point01: value, Symbol: 'string', PaintAs: 'string'}
}) => {
  const [state, setState] = useState({
    memberId: memberId, // Use prop or default
    betAmount: '',
    selectedTrend: null,
  });

  /**
   * Handle order creation - integrated with backend API
   * @param {Object} orderRequest - Order details from BTCChart
   */
  // const handleCreateOrder = async (orderRequest) => {
  //   console.log('📝 [ORDER] Creating order:', orderRequest);
  //   
  //   try {
  //     // Prepare order data for backend API
  //     const orderData = {
  //       MemberID: state.memberId,
  //       GameID: 6, // Insurance Mode
  //       BetNumber: state.selectedTrend, // AU, SU, MU, QU, AD, SD, MD, QD
  //       BetAmount: parseFloat(state.betAmount),
  //       Currency: '',
  //       Symbol: 'BTCUSDT',
  //       DrawType: 1,
  //       InsuranceID: 0, // No insurance by default
  //       ...orderRequest // Allow overrides from BTCChart
  //     };
  //
  //     console.log('🚀 [ORDER] Sending to API:', orderData);
  //
  //     // TODO: Replace with actual API call
  //     // const response = await DataSource.shared.postGameTransaction(orderData);
  //     
  //     // Simulated API response for demo
  //     const response = await new Promise((resolve) => {
  //       setTimeout(() => {
  //         resolve({
  //           success: true,
  //           Message: 'Order placed successfully!',
  //           OrderID: `ORD-${Date.now()}`,
  //           Amount: orderData.BetAmount,
  //           Trend: orderData.BetNumber
  //         });
  //       }, 500);
  //     });
  //
  //     if (response.success) {
  //       console.log('✅ [ORDER] Success:', response);
  //       alert(`Order placed! ${response.Message}`);
  //       
  //       // Reset bet selection after successful order
  //       setState(prev => ({
  //         ...prev,
  //         betAmount: '',
  //         selectedTrend: null
  //       }));
  //
  //       // TODO: Start polling for result
  //       // fetchTransactionUntilResult();
  //     }
  //   } catch (error) {
  //     console.error('❌ [ORDER] Failed:', error);
  //     console.error('❌ [ORDER] Failed:', error);
  //     alert(`Order failed: ${error.message}`);
  //   }
  // };

  /**
   * Handle input changes from BTCChart
   */
  const handleInputChange = (value, name) => {
    setState(prev => ({
      ...prev,
      [name]: value
    }));
    console.log(`📝 [STATE] Updated ${name}:`, value);
  };

  return (
    <BTCChart
      memberId={state.memberId}
      bearerToken={bearerToken}
      passBalance={passBalance}
      betAmount={state.betAmount}
      selectedTrend={state.selectedTrend}
      setBetAmount={(val) => handleInputChange(val, 'betAmount')}
      setSelectedTrend={(val) => handleInputChange(val, 'selectedTrend')}
    />
  );
};

export default BTCChartWrapper;
