
import { useState, useEffect } from "react";

export function useDeepLink() {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const handleDeepLink = () => {
      setDeepLink(window.location.href);
    };

    window.addEventListener('load', handleDeepLink);
    window.addEventListener('hashchange', handleDeepLink);

    return () => {
      window.removeEventListener('load', handleDeepLink);
      window.removeEventListener('hashchange', handleDeepLink);
    };
  }, []);

  const addLog = (log: string) => {
    setLogs((prevLogs) => [...prevLogs, log]);
  };

  return {
    deepLink,
    logs,
    addLog
  };
}
