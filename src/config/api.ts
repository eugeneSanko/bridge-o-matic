
// Mock API integration

export const invokeFunctionWithRetry = async (
  functionName: string,
  options: {
    body?: any;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
) => {
  const { body = {}, maxRetries = 3, retryDelay = 1000 } = options;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock responses based on function name
      if (functionName === 'bridge-order') {
        const { orderId } = body;
        
        if (!orderId) {
          return { error: { message: "Order ID is required" } };
        }

        // Mock successful order data
        return {
          data: {
            id: "1",
            ff_order_id: orderId,
            ff_order_token: "token123",
            from_currency: "BTC",
            to_currency: "ETH",
            amount: 0.05,
            destination_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            status: "completed",
            deposit_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            initial_rate: 17.5,
            created_at: new Date().toISOString(),
            expiration_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          }
        };
      }

      // Default mock error for unknown function
      return { error: { message: "Unknown function" } };
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};
