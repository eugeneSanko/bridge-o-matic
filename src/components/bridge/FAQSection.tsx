
export const FAQSection = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-foreground">FAQ</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-300 mb-2">How can I track my order?</h3>
          <p className="text-gray-400">
            In three ways: by email (if you leave your email address), on our website (if your browser accepts cookies) or by viewing the transactions in the blockchain by the links from your order.
          </p>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-300 mb-2">Why can I trust you?</h3>
          <p className="text-gray-400">
            No registration and no need to share your personal details. We don't hold your funds, all exchanges take place instantly in fully automatic mode.
          </p>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-300 mb-2">Do you have hidden fees?</h3>
          <p className="text-gray-400">
            Honesty is our main priority, so we commit to full transparency and make all the fees clear:
          </p>
          <ul className="mt-2 space-y-1 text-gray-400">
            <li className="flex items-center">
              <span className="text-[#0FA0CE] mr-2">•</span>
              1% if you opt for a fixed rate
            </li>
            <li className="flex items-center">
              <span className="text-[#0FA0CE] mr-2">•</span>
              0.5% if you opt for a floating rate
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
