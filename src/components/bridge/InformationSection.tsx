
export const InformationSection = () => (
  <div className="col-span-8 glass-card p-6 rounded-xl">
    <h3 className="text-lg font-medium mb-4">Information</h3>
    <div className="space-y-4 text-sm text-gray-400">
      <p>
        Your transaction is being processed. The exchange partner will send your coins as soon as your transfer receives the required number of confirmations from the blockchain network.
      </p>
      <p>
        Note that the exchange rate is fixed only after your deposit is confirmed. If the market rate changes by more than 5% before your deposit is confirmed, you may be asked to accept the new rate or receive a refund.
      </p>
      <p>
        For Bitcoin transactions, we typically need 1-3 confirmations which can take 10-30 minutes depending on network congestion. Other networks may have different confirmation times.
      </p>
      <p>
        Deposit addresses are valid for 30 minutes. If you don't complete your deposit within that timeframe, the transaction will expire and you'll need to create a new one.
      </p>
    </div>
  </div>
);
