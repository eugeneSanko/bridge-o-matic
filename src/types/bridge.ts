export interface Currency {
  symbol?: string;
  name: string;
  image?: string | null;
  network?: string | null;
  available?: boolean;
  min?: string;
  max?: string;
  color?: string;
  coin?: string;
  tag?: string | null;
  priority?: number;
  code?: string;
  logo?: string;
  recv?: number;
  send?: number;
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
  createBridgeTransaction: () => Promise<{ orderId: string, debugInfo?: any } | null>;
  availableCurrencies: Currency[];
  isLoadingCurrencies: boolean;
  refreshCurrencies: () => Promise<void>;
  lastPriceData: PriceResponse | null;
  amountError: string | null;
  formatNumberWithCommas: (value: string | number) => string;
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
      rate?: string;
      usd?: number;
      btc?: number;
    };
    to: {
      amount: string;
      currency: string;
      max: string;
      min: string;
      network: string;
      rate?: string;
      usd?: number;
      btc?: number;
    };
    rate?: string;
    errors?: string[];
  };
  timestamp: number;
  expiresAt: number;
}

export interface OrderResponse {
  orderId: string;
  orderToken?: string;
  debugInfo?: any;
}

export interface ApiOrderResponse {
  code: number | string;
  msg: string;
  data: {
    id: string;
    token: string;
    type: string;
    status: string;
    time: {
      reg: number;
      start: number | null;
      finish: number | null;
      update: number;
      expiration: number;
      left: number;
    };
    from: {
      code: string;
      coin: string;
      network: string;
      name: string;
      amount: string;
      address: string;
    };
    to: {
      code: string;
      coin: string;
      network: string;
      name: string;
      amount: string;
      address: string;
    };
  } | null;
}

/**
 * Timer configuration for the bridge process
 */
export interface TimerConfig {
  /** Duration in milliseconds for which a quote is valid */
  QUOTE_VALIDITY_MS: number;
  /** Update frequency for the timer in milliseconds */
  TIMER_UPDATE_INTERVAL_MS: number;
  /** Minimum time between recalculations in milliseconds */
  RECALCULATION_THROTTLE_MS: number;
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
