
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (params: any) => void) => void;
    removeListener: (event: string, callback: (params: any) => void) => void;
  };
  phantom?: {
    solana?: {
      isPhantom?: boolean;
      publicKey?: { toString: () => string };
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
      request?: (request: { method: string; params?: any[] }) => Promise<any>;
      isConnected?: boolean;
      connected?: boolean;
    };
    ethereum?: {
      isPhantom?: boolean;
      selectedAddress?: string;
      chainId?: string;
      isConnected?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
    bitcoin?: {
      isPhantom?: boolean;
      isConnected?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
    polygon?: {
      isPhantom?: boolean;
      selectedAddress?: string;
      chainId?: string;
      isConnected?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
  };
  DexHunter?: {
    init: (config: {
      orderTypes: ("SWAP" | "LIMIT")[];
      colors: {
        background: string;
        containers: string;
        subText: string;
        mainText: string;
        buttonText: string;
        accent: string;
      };
      theme: "dark" | "light";
      width: string;
      partnerCode: string;
      partnerName: string;
      displayType: "FULL" | "MINIMAL";
    }) => void;
    cleanup?: () => void;
  };
}
