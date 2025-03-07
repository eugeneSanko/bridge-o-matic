
import { XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="min-h-screen bg-bridge-dark pt-24 px-8 pb-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-card p-8 rounded-xl"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-500/20 rounded-full p-3">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-center mb-2">Error</h2>
        <p className="text-gray-400 text-center mb-6">{error}</p>
        
        <Link
          to="/bridge"
          className="block w-full py-2 px-4 bg-bridge-accent hover:bg-bridge-accent/90 text-white text-center rounded-lg transition-colors"
        >
          Return to Bridge
        </Link>
      </motion.div>
    </div>
  );
};
