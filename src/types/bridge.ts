
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
  createBridgeTransaction: () => Promise<OrderResponse | null>;
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
  code?: number;
  msg?: string;
  data?: {
    id: string;
    token: string;
    type: string;
    status: string;
    from?: {
      address: string;
      tag?: string | null;
      tagName?: string | null;
      addressAlt?: string | null;
    };
    to?: {
      address: string;
    };
    time?: {
      expiration: number;
    };
  };
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
      tag?: string | null;
      tagName?: string | null;
      addressAlt?: string | null;
      reqConfirmations?: number;
      maxConfirmations?: number;
      tx?: {
        id: string;
        amount: string;
        fee: string;
        ccyfee: string;
        timeReg: number;
        timeBlock: number;
        confirmations: string;
      };
    };
    to: {
      code: string;
      coin: string;
      network: string;
      name: string;
      amount: string;
      address: string;
      tag?: string | null;
      tagName?: string | null;
      tx?: {
        id: string;
        amount: string;
        fee: string;
        ccyfee: string;
        timeReg: number;
        timeBlock: number;
        confirmations: string;
      };
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

// Add a new type for CompletedTransaction that includes raw_api_response
export interface CompletedTransaction {
  amount: number;
  client_metadata: any;
  created_at: string;
  deposit_address: string;
  destination_address: string;
  ff_order_id: string;
  ff_order_token: string;
  from_currency: string;
  id: string;
  status: string;
  to_currency: string;
  raw_api_response?: ApiOrderResponse['data'];
}
