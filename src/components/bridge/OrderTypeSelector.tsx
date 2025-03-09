interface OrderTypeSelectorProps {
  value: "fixed" | "float";
  onChange: (value: "fixed" | "float") => void;
}

export const OrderTypeSelector = ({
  value,
  onChange,
}: OrderTypeSelectorProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-300">
        Order Type
      </label>
      <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/30 rounded-lg">
        <button
          className={`py-2 px-3 sm:px-4 rounded text-sm sm:text-base ${
            value === "fixed" ? "bg-primary text-white" : "text-gray-400"
          } font-medium transition-all duration-200 rounded-md`}
          onClick={() => onChange("fixed")}
        >
          Fixed Flow 1%
        </button>
        <button
          className={`py-2 px-3 sm:px-4 rounded text-sm sm:text-base ${
            value === "float" ? "bg-primary text-white" : "text-gray-400"
          } font-medium transition-all duration-200 rounded-md`}
          onClick={() => onChange("float")}
        >
          Float Rate .5%
        </button>
      </div>
    </div>
  );
};
