
import { motion } from "framer-motion";

export const BridgeHeader = () => {
  return (
    <div className="mb-8 sm:mb-12 text-center">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-block py-2 px-4 bg-bridge-accent/10 rounded-full mb-4"
      >
        <span className="text-sm font-medium text-bridge-accent">Fast & Secure Bridging</span>
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
      >
        Bridge-O-Matic
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="text-gray-400 text-sm sm:text-base mx-auto max-w-lg"
      >
        The most elegant way to bridge your crypto assets across blockchains with lowest fees and fastest transaction times.
      </motion.p>
    </div>
  );
};
