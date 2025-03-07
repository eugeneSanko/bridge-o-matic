export interface Currency {
  symbol: string;
  name: string;
  image: string | null;
  network?: string | null;
  available?: boolean;
  min?: string;
  max?: string;
  color?: string;
  coin?: string;
  tag?: string | null;
  priority?: number;
}

export interface BridgeContextType {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  estimatedReceiveAmount: string;
  destinationAddress: string;
  orderType: 'fixed' | 'float';
  isCalculating: boolean;
  timeRemaining: string | null;
  setFromCurrency: (currency: string) => void;
  setToCurrency: (currency: string) => void;
  setAmount: (amount: string) => void;
  setDestinationAddress: (address: string) => void;
  setOrderType: (type: 'fixed' | 'float') => void;
  calculateReceiveAmount: () => void;
  createBridgeTransaction: () => Promise<{ orderId: string } | null>;
  availableCurrencies: Currency[];
  isLoadingCurrencies: boolean;
  refreshCurrencies: () => Promise<void>;
}

export interface BridgeError extends Error {
  code?: string;
  details?: string;
  statusCode?: number;
  endpoint?: string;
  request?: any;
  response?: any;
}

export interface PriceResponse {
  code: number;
  msg: string;
  data: {
    from: {
      amount: string;
      currency: string;
      max: string;
      min: string;
      network: string;
    };
    to: {
      amount: string;
      currency: string;
      max: string;
      min: string;
      network: string;
    };
    rate: string;
  };
  timestamp: number;
  expiresAt: number;
}

export interface OrderResponse {
  orderId: string;
}

/**
 * Timer configuration for the bridge process
 */
export interface TimerConfig {
  /** Duration in milliseconds for which a quote is valid */
  QUOTE_VALIDITY_MS: number;
  /** Update frequency for the timer in milliseconds */
  TIMER_UPDATE_INTERVAL_MS: number;
}

/**
 * API Authentication test result interface
 */
export interface AuthTestResult {
  success: boolean;
  message: string;
  timestampSeconds?: string;
  timestampMilliseconds?: string;
  results?: Array<{
    format: string;
    statusCode?: number;
    headers?: Record<string, string>;
    data?: any;
    success: boolean;
    error?: string;
  }>;
  error?: string;
}
