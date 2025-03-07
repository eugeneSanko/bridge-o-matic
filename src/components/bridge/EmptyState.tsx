
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const EmptyState = () => {
  return (
    <div className="min-h-screen bg-bridge-dark pt-24 px-8 pb-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-card p-8 rounded-xl text-center"
      >
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">No Order Found</h2>
        <p className="text-gray-400 mb-6">
          We couldn't find any order details with the provided ID. Please check the order ID and try again.
        </p>
        <Link
          to="/bridge"
          className="block w-full py-2 px-4 bg-bridge-accent hover:bg-bridge-accent/90 text-white rounded-lg transition-colors"
        >
          Return to Bridge
        </Link>
      </motion.div>
    </div>
  );
};
