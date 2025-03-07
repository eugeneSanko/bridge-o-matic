
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What is crypto bridging?",
    answer: "Crypto bridging enables the transfer of digital assets from one blockchain to another. It allows users to move their tokens between different networks while maintaining the value and properties of the original asset."
  },
  {
    question: "How long does bridging take?",
    answer: "Bridging times vary depending on the source and destination blockchains. Typically, the process takes between 5-30 minutes, but can be longer during periods of network congestion."
  },
  {
    question: "What are the fees for bridging?",
    answer: "Fees consist of network gas fees for both the source and destination blockchains, plus a small service fee. The exact amount varies depending on the networks involved and current gas prices."
  },
  {
    question: "Is bridging safe?",
    answer: "We implement industry-standard security practices and audited smart contracts. However, as with any blockchain transaction, there are inherent risks. We recommend using small test transactions first."
  }
];

export const FAQSection = () => {
  return (
    <div className="glass-card rounded-lg p-6 sm:p-8 mb-8 sm:mb-12">
      <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <button
        className="w-full text-left flex justify-between items-center focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-sm text-gray-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
