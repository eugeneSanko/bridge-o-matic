
import { useState, useEffect, useCallback } from "react";

export function useDeepLink() {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Simulate receiving a deep link after some delay
    const timeout = setTimeout(() => {
      // Random chance to simulate a deep link (would be triggered by external wallet in real app)
      if (Math.random() > 0.5) {
        // Simulate a successful deep link return
        const mockDeepLink = "bridge-o-matic://bridge?status=success&txId=0x123456789abcdef";
        setDeepLink(mockDeepLink);
        addLog(`Received deep link: ${mockDeepLink}`);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  }, []);

  return { deepLink, logs, addLog };
}
