
// Map FF.io API status to step index
export const getActiveStepIndex = (status: string): number => {
  if (!status) return 0;

  // Normalize status to lowercase for consistency
  const lowerStatus = status.toLowerCase();
  console.log(
    "Processing status in getActiveStepIndex:",
    status,
    "Lowercased:",
    lowerStatus
  );

  // Define direct mappings from FF.io API statuses
  const apiStatusMap: Record<string, number> = {
    // FF.io API status codes (original case)
    NEW: 0, // Awaiting deposit
    PENDING: 1, // Transaction received, pending confirmation
    EXCHANGE: 1, // Transaction confirmed, exchange in progress
    WITHDRAW: 2, // Sending funds
    DONE: 3, // Order completed
    EXPIRED: 0, // Order expired
    EMERGENCY: 3, // Emergency, customer choice required
  };

  // Our app-specific status codes (lowercase)
  const appStatusMap: Record<string, number> = {
    new: 0,
    pending: 0,
    processing: 1,
    exchanging: 1,
    sending: 2,
    completed: 3,
    expired: 0,
    refunding: 1,
    refunded: 3,
    failed: 3,
    emergency: 3,
    unknown: 0,
    done: 3, // Added lowercase "done" mapping
  };

  // First check if it's a direct FF.io API status (case-sensitive)
  if (status in apiStatusMap) {
    const index = apiStatusMap[status];
    console.log(`Found status "${status}" in API map, index:`, index);
    return index;
  }

  // Then check if it's our app status (case-insensitive)
  if (lowerStatus in appStatusMap) {
    const index = appStatusMap[lowerStatus];
    console.log(`Found status "${lowerStatus}" in app map, index:`, index);
    return index;
  }

  console.log(`Status "${status}" not found in any map, defaulting to 0`);
  return 0;
};

// Returns appropriate visual status indicators
export const getStatusType = (status: string): string => {
  if (!status) return "";

  console.log("Processing status in getStatusType:", status);

  // First check uppercase FF.io API statuses
  if (status === "DONE") return "completed";
  if (status === "EMERGENCY") return "failed";
  if (status === "EXPIRED") return "expired";

  // Then check lowercase app statuses
  const lowerStatus = status.toLowerCase();

  if (["done", "completed"].includes(lowerStatus)) {
    return "completed";
  } else if (["failed", "emergency"].includes(lowerStatus)) {
    return "failed";
  } else if (["expired"].includes(lowerStatus)) {
    return "expired";
  } else if (["refunded"].includes(lowerStatus)) {
    return "refunded";
  }

  return "";
};

// Normalize status on mount and when it changes
export const normalizeStatus = (currentStatus?: string): string => {
  // Use a consistent status format for our component
  let statusToUse = currentStatus?.toLowerCase() || "pending";

  // Handle API status codes (uppercase)
  if (currentStatus === "DONE") statusToUse = "completed";
  if (currentStatus === "EXPIRED") statusToUse = "expired";
  if (currentStatus === "EMERGENCY") statusToUse = "failed";

  console.log(`Normalized status: ${currentStatus} -> ${statusToUse}`);
  return statusToUse;
};
