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
  
  // Bitcoin and Bitcoin-based networks
  if (normalizedNetwork === "BTC" || normalizedNetwork === "BTCLN") {
    return `https://mempool.space/tx/${txId}`;
  }
  if (normalizedNetwork === "BCH") return `https://blockchair.com/bitcoin-cash/transaction/${txId}`;
  if (normalizedNetwork === "LTC") return `https://blockchair.com/litecoin/transaction/${txId}`;
  if (normalizedNetwork === "DOGE") return `https://blockchair.com/dogecoin/transaction/${txId}`;
  if (normalizedNetwork === "DASH") return `https://blockchair.com/dash/transaction/${txId}`;
  if (normalizedNetwork === "ZEC") return `https://blockchair.com/zcash/transaction/${txId}`;
  
  // Ethereum and EVM-compatible networks
  if (normalizedNetwork === "ETH") return `https://etherscan.io/tx/${txId}`;
  if (normalizedNetwork.includes("ARBITRUM")) return `https://arbiscan.io/tx/${txId}`;
  if (normalizedNetwork.includes("MATIC") || normalizedNetwork.includes("POLYGON") || normalizedNetwork === "POL") {
    return `https://polygonscan.com/tx/${txId}`;
  }
  if (normalizedNetwork.includes("ZKSYNC")) return `https://explorer.zksync.io/tx/${txId}`;
  if (normalizedNetwork.includes("OP") || normalizedNetwork.includes("OPTIMISM")) {
    return `https://optimistic.etherscan.io/tx/${txId}`;
  }
  if (normalizedNetwork.includes("BASE")) return `https://basescan.org/tx/${txId}`;
  if (normalizedNetwork === "FTM") return `https://ftmscan.com/tx/${txId}`;
  if (normalizedNetwork === "AVAXC" || normalizedNetwork === "AVAX") {
    return `https://snowtrace.io/tx/${txId}`;
  }
  if (normalizedNetwork === "ETC") return `https://blockscout.com/etc/mainnet/tx/${txId}`;
  
  // BSC
  if (normalizedNetwork === "BNB" || normalizedNetwork.includes("BSC") || normalizedNetwork.includes("OPBNB")) {
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
  
  // Cosmos ecosystem
  if (normalizedNetwork === "ATOM" || normalizedNetwork.includes("COSMOS")) {
    return `https://www.mintscan.io/cosmos/txs/${txId}`;
  }
  
  // Other popular blockchains
  if (normalizedNetwork === "DOT" || normalizedNetwork.includes("POLKADOT")) {
    return `https://polkadot.subscan.io/extrinsic/${txId}`;
  }
  if (normalizedNetwork === "XRP") return `https://xrpscan.com/tx/${txId}`;
  if (normalizedNetwork === "XLM") return `https://stellar.expert/explorer/public/tx/${txId}`;
  if (normalizedNetwork === "XMR") return `https://www.exploremonero.com/transaction/${txId}`;
  if (normalizedNetwork === "XTZ") return `https://tzstats.com/${txId}`;
  if (normalizedNetwork === "EOS") return `https://bloks.io/transaction/${txId}`;
  if (normalizedNetwork === "VET") return `https://explore.vechain.org/transactions/${txId}`;
  if (normalizedNetwork === "TON") return `https://tonscan.org/tx/${txId}`;
  if (normalizedNetwork === "SUI") return `https://explorer.sui.io/txblock/${txId}`;
  if (normalizedNetwork === "APT") return `https://explorer.aptoslabs.com/txn/${txId}`;
  if (normalizedNetwork === "KCC") return `https://explorer.kcc.io/tx/${txId}`;
  
  // Handle tokens based on their network suffix
  if (normalizedNetwork.includes("ETH")) return `https://etherscan.io/tx/${txId}`;
  if (normalizedNetwork.includes("BSC")) return `https://bscscan.com/tx/${txId}`;
  if (normalizedNetwork.includes("TRC")) return `https://tronscan.org/#/transaction/${txId}`;
  if (normalizedNetwork.includes("SOL")) return `https://solscan.io/tx/${txId}`;
  if (normalizedNetwork.includes("MATIC")) return `https://polygonscan.com/tx/${txId}`;
  if (normalizedNetwork.includes("ARBITRUM")) return `https://arbiscan.io/tx/${txId}`;
  
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
    "TRX": "TRON",
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
    "KCC": "KuCoin Chain"
  };
  
  // Check for direct match
  if (networkNames[normalizedNetwork]) {
    return networkNames[normalizedNetwork];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(networkNames)) {
    if (normalizedNetwork.includes(key)) {
      return value;
    }
  }
  
  return normalizedNetwork; // Return the original if no match
}
