
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface OrderTypeSelectorProps {
  value: 'fixed' | 'float';
  onChange: (value: 'fixed' | 'float') => void;
}

export const OrderTypeSelector = ({ value, onChange }: OrderTypeSelectorProps) => {
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-2">Order Type</label>
      <div className="grid grid-cols-2 gap-4">
        <OrderTypeOption
          type="fixed"
          title="Fixed Rate"
          description="Lock current exchange rate"
          isSelected={value === 'fixed'}
          onClick={() => onChange('fixed')}
        />
        <OrderTypeOption
          type="float"
          title="Float Rate"
          description="Use rate at exchange time"
          isSelected={value === 'float'}
          onClick={() => onChange('float')}
        />
      </div>
    </div>
  );
};

interface OrderTypeOptionProps {
  type: 'fixed' | 'float';
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const OrderTypeOption = ({ type, title, description, isSelected, onClick }: OrderTypeOptionProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-4 rounded-lg border ${
        isSelected 
          ? 'border-bridge-accent bg-bridge-accent/10'
          : 'border-white/5 bg-gray-800/50 hover:border-white/10'
      } transition-all text-left h-full`}
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium">{title}</h3>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-bridge-accent rounded-full p-1"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </motion.button>
  );
};
