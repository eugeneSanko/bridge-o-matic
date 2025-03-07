
/**
 * Service for fetching price data from Binance API
 */

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

interface MarketData {
  price: number;
  priceChange: {
    '24h': number;
  };
  volume: number;
  marketCap?: number;
  lastUpdated: Date;
}

/**
 * Fetches the current price for a given symbol from Binance
 */
export async function fetchPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    const data: BinanceTickerResponse = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching Binance price:', error);
    return null;
  }
}

/**
 * Fetches the 24hr price change percentage for a given symbol
 */
export async function fetch24hChange(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    const data = await response.json();
    return parseFloat(data.priceChangePercent);
  } catch (error) {
    console.error('Error fetching Binance 24h change:', error);
    return null;
  }
}

/**
 * Fetches combined market data for a trading pair
 * @param symbol The trading pair (e.g., "BTCUSDT")
 * @returns An object containing price and other market data
 */
export async function fetchMarketData(symbol: string): Promise<MarketData | null> {
  try {
    // Fetch 24h ticker data which includes price, volume, and price change
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      price: parseFloat(data.lastPrice),
      priceChange: {
        '24h': parseFloat(data.priceChangePercent)
      },
      volume: parseFloat(data.volume),
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}
