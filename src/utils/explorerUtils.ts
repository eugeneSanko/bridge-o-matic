/**
 * Provides utility functions for blockchain explorer URLs
 */

/**
 * Normalizes network codes to a standard format for looking up explorer URLs
 * @param network Network identifier from the API
 * @returns Standardized network code
 */
export function normalizeNetworkCode(network: string): string {
  if (!network) return '';
  
  // Convert to uppercase for consistency
  const upperNetwork = network.toUpperCase();
  
  // Handle common aliases and variations
  if (upperNetwork === 'MATIC' || upperNetwork === 'POL') return 'POLYGON';
  if (upperNetwork === 'AVAXC' || upperNetwork === 'AVAX') return 'AVALANCHE';
  if (upperNetwork === 'BSC') return 'BNB';
  if (upperNetwork === 'ATOM') return 'COSMOS';
  if (upperNetwork === 'XRP') return 'RIPPLE';
  
  return upperNetwork;
}

/**
 * Returns the appropriate blockchain explorer URL for a given transaction ID based on the currency/network
 * @param txId Transaction ID/hash
 * @param network Network or currency code (e.g., "ETH", "ETHBSC", "ADA")
 * @returns URL to the blockchain explorer or null if not supported
 */
export function getExplorerUrl(txId: string, network: string): string | null {
  if (!txId || !network) return null;

  // Normalize the network string
  const normalizedNetwork = network.toUpperCase();
  
  // Extract the base coin and network if in format like "ETHBSC" (ETH on BSC)
  let coin = normalizedNetwork;
  let actualNetwork = normalizedNetwork;
  
  // Check for compound codes like "BTCBSC", "USDTTRC", etc.
  const knownNetworks = ['BSC', 'ETH', 'TRC', 'TRX', 'SOL', 'MATIC', 'ARBITRUM', 'OP', 'ZKSYNC', 'BASE', 'AVAXC', 'AVALANCHE', 'OPBNB'];
  
  for (const net of knownNetworks) {
    if (normalizedNetwork.endsWith(net) && normalizedNetwork !== net) {
      coin = normalizedNetwork.substring(0, normalizedNetwork.length - net.length);
      actualNetwork = net;
      break;
    }
  }
  
  // Handle wrapped tokens (WETH, WBNB, etc.) - use the underlying network
  if (coin.startsWith('W') && (coin === 'WETH' || coin === 'WBNB' || coin === 'WSOL')) {
    coin = coin.substring(1); // Remove the 'W' prefix
  }
  
  // Normalize the network for consistent mapping
  const networkForExplorer = normalizeNetworkCode(actualNetwork);
  
  // Bitcoin and Bitcoin-based networks
  if (networkForExplorer === 'BTC' || networkForExplorer === 'BITCOIN' || normalizedNetwork === 'BTCLN') {
    return `https://mempool.space/tx/${txId}`;
  }
  if (networkForExplorer === 'BCH') return `https://blockchair.com/bitcoin-cash/transaction/${txId}`;
  if (networkForExplorer === 'LTC') return `https://blockchair.com/litecoin/transaction/${txId}`;
  if (networkForExplorer === 'DOGE') return `https://blockchair.com/dogecoin/transaction/${txId}`;
  if (networkForExplorer === 'DASH') return `https://blockchair.com/dash/transaction/${txId}`;
  if (networkForExplorer === 'ZEC') return `https://blockchair.com/zcash/transaction/${txId}`;
  
  // Ethereum and EVM-compatible networks
  if (networkForExplorer === 'ETH' || networkForExplorer === 'ETHEREUM') return `https://etherscan.io/tx/${txId}`;
  if (networkForExplorer === 'ARBITRUM') return `https://arbiscan.io/tx/${txId}`;
  if (networkForExplorer === 'POLYGON' || networkForExplorer === 'MATIC') {
    return `https://polygonscan.com/tx/${txId}`;
  }
  if (networkForExplorer === 'ZKSYNC') return `https://explorer.zksync.io/tx/${txId}`;
  if (networkForExplorer === 'OP' || networkForExplorer === 'OPTIMISM') {
    return `https://optimistic.etherscan.io/tx/${txId}`;
  }
  if (networkForExplorer === 'BASE') return `https://basescan.org/tx/${txId}`;
  if (networkForExplorer === 'FTM') return `https://ftmscan.com/tx/${txId}`;
  if (networkForExplorer === 'AVALANCHE' || networkForExplorer === 'AVAX') {
    return `https://snowtrace.io/tx/${txId}`;
  }
  if (networkForExplorer === 'ETC') return `https://blockscout.com/etc/mainnet/tx/${txId}`;
  
  // BSC
  if (networkForExplorer === 'BNB' || networkForExplorer === 'BINANCE' || networkForExplorer === 'BSC' || networkForExplorer === 'OPBNB') {
    return `https://bscscan.com/tx/${txId}`;
  }
  
  // Solana
  if (networkForExplorer === 'SOL' || networkForExplorer === 'SOLANA') {
    return `https://solscan.io/tx/${txId}`;
  }
  
  // TRON
  if (networkForExplorer === 'TRX' || networkForExplorer === 'TRON') {
    return `https://tronscan.org/#/transaction/${txId}`;
  }
  
  // Cardano
  if (networkForExplorer === 'ADA' || networkForExplorer === 'CARDANO') {
    return `https://cardanoscan.io/transaction/${txId}`;
  }
  
  // Cosmos ecosystem
  if (networkForExplorer === 'COSMOS' || networkForExplorer === 'ATOM') {
    return `https://www.mintscan.io/cosmos/txs/${txId}`;
  }
  
  // Other popular blockchains
  if (networkForExplorer === 'POLKADOT' || networkForExplorer === 'DOT') {
    return `https://polkadot.subscan.io/extrinsic/${txId}`;
  }
  if (networkForExplorer === 'RIPPLE' || networkForExplorer === 'XRP') return `https://xrpscan.com/tx/${txId}`;
  if (networkForExplorer === 'STELLAR' || networkForExplorer === 'XLM') return `https://stellar.expert/explorer/public/tx/${txId}`;
  if (networkForExplorer === 'MONERO' || networkForExplorer === 'XMR') return `https://www.exploremonero.com/transaction/${txId}`;
  if (networkForExplorer === 'TEZOS' || networkForExplorer === 'XTZ') return `https://tzstats.com/${txId}`;
  if (networkForExplorer === 'EOS') return `https://bloks.io/transaction/${txId}`;
  if (networkForExplorer === 'VECHAIN' || networkForExplorer === 'VET') return `https://explore.vechain.org/transactions/${txId}`;
  if (networkForExplorer === 'TON') return `https://tonscan.org/tx/${txId}`;
  if (networkForExplorer === 'SUI') return `https://explorer.sui.io/txblock/${txId}`;
  if (networkForExplorer === 'APTOS' || networkForExplorer === 'APT') return `https://explorer.aptoslabs.com/txn/${txId}`;
  if (networkForExplorer === 'KCC' || networkForExplorer === 'KUCOIN') return `https://explorer.kcc.io/tx/${txId}`;
  
  // If no match is found
  return null;
}

/**
 * Determines if a transaction has a supported explorer URL
 * @param txId Transaction ID/hash
 * @param network Network or currency code
 * @returns Boolean indicating if an explorer URL is available
 */
export function hasExplorerUrl(txId: string, network: string): boolean {
  return getExplorerUrl(txId, network) !== null;
}

/**
 * Gets a human-readable network name for display purposes
 * @param network Network code from the API
 * @returns A formatted network name for display
 */
export function getNetworkName(network: string): string {
  if (!network) return "Unknown Network";
  
  const normalizedNetwork = network.toUpperCase();
  
  // Map of network codes to display names
  const networkNames: Record<string, string> = {
    "ETH": "Ethereum",
    "BSC": "BNB Smart Chain",
    "BNB": "BNB Smart Chain",
    "TRX": "TRON",
    "TRC": "TRON",
    "SOL": "Solana",
    "BTC": "Bitcoin",
    "BTCLN": "Bitcoin Lightning",
    "ADA": "Cardano",
    "ATOM": "Cosmos",
    "AVAXC": "Avalanche",
    "AVAX": "Avalanche",
    "MATIC": "Polygon",
    "POL": "Polygon",
    "ARBITRUM": "Arbitrum",
    "OP": "Optimism",
    "BASE": "Base",
    "ZKSYNC": "zkSync",
    "DOT": "Polkadot",
    "XRP": "Ripple",
    "XLM": "Stellar",
    "XMR": "Monero",
    "XTZ": "Tezos",
    "EOS": "EOS",
    "FTM": "Fantom",
    "VET": "VeChain",
    "TON": "TON",
    "SUI": "Sui",
    "APT": "Aptos",
    "KCC": "KuCoin Chain",
    "OPBNB": "opBNB Chain",
    "S": "Sonic",
    "LN": "Lightning Network"
  };
  
  // Check for direct match
  if (networkNames[normalizedNetwork]) {
    return networkNames[normalizedNetwork];
  }
  
  // Check for embedded network name (like ETHBSC -> BSC)
  for (const [key, value] of Object.entries(networkNames)) {
    if (normalizedNetwork.endsWith(key) && normalizedNetwork !== key) {
      return value;
    }
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(networkNames)) {
    if (normalizedNetwork.includes(key)) {
      return value;
    }
  }
  
  return normalizedNetwork; // Return the original if no match
}

/**
 * Determines if a network is available based on FF.io API data
 * @param networkCode Network code from the API
 * @param sendEnabled Check if sending is enabled
 * @param recvEnabled Check if receiving is enabled
 * @returns Boolean indicating if the network is available
 */
export function isNetworkAvailable(networkCode: string, sendEnabled?: boolean, recvEnabled?: boolean): boolean {
  if (!networkCode) return false;
  
  // Determine availability based on send/recv flags if provided
  if (sendEnabled !== undefined && recvEnabled !== undefined) {
    return sendEnabled === 1 || recvEnabled === 1;
  }
  
  // Networks we know are available
  const availableNetworks = [
    'BTC', 'ETH', 'BSC', 'BNB', 'TRX', 'SOL', 'MATIC', 'POLYGON',
    'AVAX', 'AVAXC', 'XRP', 'ADA', 'DOT', 'LTC', 'DOGE', 'XLM',
    'ARBITRUM', 'OP', 'BASE', 'TON', 'COSMOS', 'ATOM'
  ];
  
  // Networks we know are not available
  const unavailableNetworks = ['S', 'WBNBOPBNB', 'WETHBASE'];
  
  if (unavailableNetworks.includes(networkCode.toUpperCase())) {
    return false;
  }
  
  return availableNetworks.some(net => 
    networkCode.toUpperCase().includes(net)
  );
}
