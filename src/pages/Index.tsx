
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-bridge-dark flex flex-col">
      <header className="px-6 py-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
          >
            Bridge-O-Matic
          </motion.div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/bridge" className="text-gray-300 hover:text-white transition-colors">
                  Bridge
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <div className="inline-block py-2 px-4 bg-bridge-accent/10 rounded-full mb-6">
              <span className="text-sm font-medium text-bridge-accent">Seamless Asset Transfers</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Bridge Your Assets Across Chains
            </h1>
            
            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              The simplest way to transfer your crypto assets between blockchains with minimal fees and maximum security.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/bridge"
                className="bg-bridge-accent hover:bg-bridge-accent/90 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-all transform hover:translate-y-[-2px]"
              >
                Start Bridging
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              
              <a
                href="#features"
                className="bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-all"
              >
                Learn More
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-radial from-bridge-accent/20 to-transparent rounded-full blur-3xl opacity-30"></div>
              <div className="relative glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img 
                  src="/placeholder.svg" 
                  alt="Bridge illustration" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bridge-dark/80"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-lg font-medium text-white mb-2">Cross-Chain Freedom</p>
                  <p className="text-sm text-gray-300">Seamlessly move assets between different blockchain networks</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <section id="features" className="py-20 bg-gradient-to-b from-bridge-dark to-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            >
              Why Bridge-O-Matic?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-400 max-w-2xl mx-auto"
            >
              We've designed the most elegant and efficient cross-chain bridge experience
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="glass-card p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-bridge-accent/10 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold mb-6 md:mb-0 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Bridge-O-Matic
            </div>
            <div className="flex space-x-8">
              <Link to="/bridge" className="text-gray-400 hover:text-white transition-colors">
                Bridge
              </Link>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Bridge-O-Matic. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    title: "Lowest Fees",
    description: "Our intelligent routing ensures you always get the most cost-effective transfer between chains.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-bridge-accent">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Fastest Transfers",
    description: "Experience lightning-fast cross-chain transfers with our optimized bridge technology.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-bridge-accent">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Maximum Security",
    description: "Your assets are protected with industry-leading security protocols and continuous monitoring.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-bridge-accent">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

export default Index;
