// src/constants/gameModeConfig.js

/**
 * Game Mode Configuration
 * Defines all 3 game modes with their specific rules and features
 */

export const GAME_MODES = {
  INSURANCE: {
    id: 6,
    name: 'Insurance Mode',
    label: 'Insurance',
    description: '4 patterns with insurance protection',
    
    // Pattern configuration
    totalPatterns: 4,
    patterns: [
      { code: 'AU', label: 'Mooning', dots: ['up', 'up', 'up'], enabled: true, type: 'up' },
      { code: 'SU', label: 'Out of Gas', dots: ['down', 'up', 'up'], enabled: true, type: 'up' },
      { code: 'AD', label: 'Dumping', dots: ['down', 'down', 'down'], enabled: true, type: 'down' },
      { code: 'SD', label: 'Lucky Bounce', dots: ['down', 'down', 'up'], enabled: true, type: 'down' },
    ],
    
    // Token configuration
    tokens: ['FEFE', 'GMCHIP'],
    acceptBothTokens: true,
    defaultToken: 'GMCHIP',
    
    // Insurance features
    hasInsurance: true,
    insuranceOptions: [
      {
        section: 'Section 1',
        cost: 0.20, // 20% of bet amount
        payoutDeduction: 0.30 // 30% deduction from payout
      },
      {
        section: 'Section 2',
        cost: 0.30, // 30% of bet amount
        payoutDeduction: 0.30 // 30% deduction from payout (after section 1)
      }
    ],
    
    // Game rules - WHEN TIE
    tieRule: 'loss', // Without insurance: player loses
    tieWithInsurance: 'refund50', // With insurance: player gets back 50% of bet amount
    
    // Payout rules
    payoutMultiplier: 1.0, // Base multiplier
    payoutRules: 'insurance', // Use insurance-based calculation
    
    // Special features
    features: ['insuranceBadges', 'insuranceNotifications'],
    
    // UI Configuration
    ui: {
      showInsuranceBadges: true,
      showBattlePass: false,
      gridLayout: '1x4', // 1 row, 4 columns
    }
  },

  BATTLE: {
    id: 7,
    name: 'Battle Mode',
    label: 'Battle',
    description: '8 patterns, GMCHIP only, Battle Pass rewards',
    
    // Pattern configuration (8 patterns)
    totalPatterns: 8,
    patterns: [
      // Row 1: UP patterns
      { code: 'AU', label: 'Mooning', dots: ['up', 'up', 'up'], enabled: true, type: 'up' },
      { code: 'SU', label: 'Out of Gas', dots: ['down', 'up', 'up'], enabled: true, type: 'up' },
      { code: 'MU', label: 'Rollercoaster', dots: ['up', 'down', 'up'], enabled: true, type: 'up' },
      { code: 'QU', label: 'Comeback', dots: ['up', 'up', 'down'], enabled: true, type: 'up' },
      
      // Row 2: DOWN patterns
      { code: 'AD', label: 'Dumping', dots: ['down', 'down', 'down'], enabled: true, type: 'down' },
      { code: 'SD', label: 'Lucky Bounce', dots: ['down', 'down', 'up'], enabled: true, type: 'down' },
      { code: 'MD', label: 'Fake Out', dots: ['down', 'up', 'down'], enabled: true, type: 'down' },
      { code: 'QD', label: 'The Trap', dots: ['up', 'down', 'down'], enabled: true, type: 'down' },
    ],
    
    // Token configuration
    tokens: ['GMCHIP'],
    acceptBothTokens: false,
    defaultToken: 'GMCHIP',
    
    // Insurance features
    hasInsurance: false,
    
    // Game rules
    tieRule: 'loss', // Player loses on TIE
    
    // Payout rules
    payoutMultiplier: 1.0, // GMCHIP wins GMCHIP
    payoutRules: 'standard',
    
    // Battle Pass features
    features: ['battlePass', 'leaderboard'],
    battlePass: {
      types: ['Daily', 'Weekly', 'Monthly'],
      target: 3000, // Win 3000 GMCHIP before closing time
      closingTime: '05:00', // 5:00 AM
      rewards: {
        daily: 500, // 500 GMCHIP
        weekly: 5000,
        monthly: 50000
      },
      rewardPool: 100000, // 100,000 FEFE reward pool
      purchaseToken: 'FEFE'
    },
    
    // UI Configuration
    ui: {
      showInsuranceBadges: false,
      showBattlePass: true,
      gridLayout: '2x4', // 2 rows, 4 columns
    }
  },

  EXTREME: {
    id: 8,
    name: 'Extreme Mode',
    label: 'Extreme',
    description: '8 patterns, high risk, no insurance',
    
    // Pattern configuration (8 patterns)
    totalPatterns: 8,
    patterns: [
      // Row 1: UP patterns
      { code: 'AU', label: 'Mooning', dots: ['up', 'up', 'up'], enabled: true, type: 'up' },
      { code: 'SU', label: 'Out of Gas', dots: ['down', 'up', 'up'], enabled: true, type: 'up' },
      { code: 'MU', label: 'Rollercoaster', dots: ['up', 'down', 'up'], enabled: true, type: 'up' },
      { code: 'QU', label: 'Comeback', dots: ['up', 'up', 'down'], enabled: true, type: 'up' },
      
      // Row 2: DOWN patterns
      { code: 'AD', label: 'Dumping', dots: ['down', 'down', 'down'], enabled: true, type: 'down' },
      { code: 'SD', label: 'Lucky Bounce', dots: ['down', 'down', 'up'], enabled: true, type: 'down' },
      { code: 'MD', label: 'Fake Out', dots: ['down', 'up', 'down'], enabled: true, type: 'down' },
      { code: 'QD', label: 'The Trap', dots: ['up', 'down', 'down'], enabled: true, type: 'down' },
    ],
    
    // Token configuration
    tokens: ['FEFE', 'GMCHIP'],
    acceptBothTokens: true,
    defaultToken: 'FEFE',
    
    // Insurance features
    hasInsurance: false,
    
    // Game rules
    tieRule: 'loss', // Player loses on TIE
    
    // Payout rules
    payoutMultiplier: 1.0, // Standard 1:1 with cross-token rewards
    payoutRules: 'crossToken', // Bet FEFE win FEFE, Bet GMCHIP win FEFE
    
    // Special features
    features: [],
    
    // UI Configuration
    ui: {
      showInsuranceBadges: false,
      showBattlePass: false,
      gridLayout: '2x4', // 2 rows, 4 columns
    }
  }
};

/**
 * Helper function to get game mode by ID
 */
export const getGameModeById = (gameId) => {
  return Object.values(GAME_MODES).find(mode => mode.id === gameId) || GAME_MODES.INSURANCE;
};

/**
 * Helper function to get game mode by name
 */
export const getGameModeByName = (name) => {
  return GAME_MODES[name.toUpperCase()] || GAME_MODES.INSURANCE;
};

/**
 * Get all available game modes as array
 */
export const getAllGameModes = () => {
  return Object.values(GAME_MODES);
};

/**
 * Check if a game mode has a specific feature
 */
export const hasModeFeature = (gameMode, feature) => {
  return gameMode.features && gameMode.features.includes(feature);
};

export default GAME_MODES;
