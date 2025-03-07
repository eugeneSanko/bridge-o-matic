
/**
 * Utility functions for handling crypto symbols and formatting
 */

/**
 * Converts a crypto symbol to a Binance trading pair format
 * @param symbol The cryptocurrency symbol (e.g., "BTC", "ETH")
 * @param base The base currency, defaults to "USDT"
 * @returns Formatted symbol for Binance API
 */
export function formatBinancePair(symbol: string, base: string = 'USDT'): string {
  // Strip any network information (e.g., "ETHBSC" -> "ETH")
  const cleanSymbol = symbol.replace(/BSC|ETH|TRX|BNB|SOL|ARBITRUM|MATIC|BASE|OP$/i, '');
  return `${cleanSymbol}${base}`;
}

/**
 * Maps a bridge currency symbol to a standard cryptocurrency symbol
 * @param symbol The bridge currency symbol (may include network info)
 * @returns Standard cryptocurrency symbol
 */
export function normalizeCurrencySymbol(symbol: string): string {
  // Extract the base currency from symbols like "ETHBSC", "USDTTRC" etc.
  const patterns = [
    { regex: /^(ETH)(?:BSC|ARBITRUM|MATIC|BASE|OP|ZKSYNC)$/i, result: 'ETH' },
    { regex: /^(BTC)(?:BSC|LN)$/i, result: 'BTC' },
    { regex: /^(USDT)(?:TRC|BSC|ETH|SOL|MATIC|ARBITRUM)$/i, result: 'USDT' },
    { regex: /^(USDC)(?:SOL|ETH|BSC|MATIC|ARBITRUM)$/i, result: 'USDC' },
    { regex: /^(BNB)(?:BSC|OPBNB)$/i, result: 'BNB' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(symbol)) {
      return pattern.result;
    }
  }

  // If no pattern matched, return the original symbol
  return symbol;
}

/**
 * Cleans a symbol by removing network information
 * @param symbol The cryptocurrency symbol (e.g., "ETHBSC", "USDTTRC")
 * @returns Cleaned symbol (e.g., "ETH", "USDT")
 */
export function cleanSymbol(symbol: string): string {
  return normalizeCurrencySymbol(symbol);
}

/**
 * Checks if a trading symbol is valid for API requests
 * @param symbol The trading symbol to validate
 * @returns True if the symbol appears valid, false otherwise
 */
export function isValidSymbol(symbol: string): boolean {
  // Simple validation: must be at least 2 characters and contain only letters
  return symbol.length >= 2 && /^[A-Za-z]+$/.test(symbol);
}
