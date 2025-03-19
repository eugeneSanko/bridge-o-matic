
/**
 * Provides utility functions for blockchain explorer URLs
 */

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
  
  // ETH and ETH-based networks
  if (normalizedNetwork === "ETH") return `https://etherscan.io/tx/${txId}`;
  if (normalizedNetwork.includes("ARBITRUM")) return `https://arbiscan.io/tx/${txId}`;
  if (normalizedNetwork.includes("MATIC") || normalizedNetwork.includes("POLYGON")) {
    return `https://polygonscan.com/tx/${txId}`;
  }
  if (normalizedNetwork.includes("ZKSYNC")) return `https://explorer.zksync.io/tx/${txId}`;
  if (normalizedNetwork.includes("OP") || normalizedNetwork.includes("OPTIMISM")) {
    return `https://optimistic.etherscan.io/tx/${txId}`;
  }
  if (normalizedNetwork.includes("BASE")) return `https://basescan.org/tx/${txId}`;
  
  // BTC
  if (normalizedNetwork === "BTC" || normalizedNetwork === "BTCLN") {
    return `https://mempool.space/tx/${txId}`;
  }
  
  // BSC
  if (normalizedNetwork === "BNB" || normalizedNetwork.includes("BSC")) {
    return `https://bscscan.com/tx/${txId}`;
  }
  
  // Solana
  if (normalizedNetwork === "SOL" || normalizedNetwork.includes("SOLANA")) {
    return `https://solscan.io/tx/${txId}`;
  }
  
  // TRON
  if (normalizedNetwork === "TRX" || normalizedNetwork.includes("TRON")) {
    return `https://tronscan.org/#/transaction/${txId}`;
  }
  
  // Cardano
  if (normalizedNetwork === "ADA" || (normalizedNetwork.includes("ADA") && !normalizedNetwork.includes("BSC"))) {
    return `https://cardanoscan.io/transaction/${txId}`;
  }
  
  // Cosmos
  if (normalizedNetwork === "ATOM" || normalizedNetwork.includes("COSMOS")) {
    return `https://www.mintscan.io/cosmos/txs/${txId}`;
  }
  
  // Avalanche
  if (normalizedNetwork === "AVAX" || normalizedNetwork.includes("AVALANCHE")) {
    return `https://snowtrace.io/tx/${txId}`;
  }
  
  // Handle tokens based on their network suffix
  if (normalizedNetwork.includes("ETH")) return `https://etherscan.io/tx/${txId}`;
  if (normalizedNetwork.includes("BSC")) return `https://bscscan.com/tx/${txId}`;
  if (normalizedNetwork.includes("TRC")) return `https://tronscan.org/#/transaction/${txId}`;
  if (normalizedNetwork.includes("SOL")) return `https://solscan.io/tx/${txId}`;
  
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
