
/**
 * Formats a numeric string:
 * - Removes trailing zeros after decimal point
 * - If whole number, removes decimal point completely
 * - Limits decimal places to 6 digits maximum
 * 
 * @param value The numeric string to format
 * @returns Formatted string
 */
export function formatNumberString(value: string | undefined | null): string {
  if (!value) return "0";
  
  // Try to parse as number to handle scientific notation if present
  let num: number;
  try {
    num = parseFloat(value);
    
    // Check if it's a whole number
    if (Number.isInteger(num)) {
      return num.toString();
    }
    
    // Format with max 6 decimal places
    const formatted = num.toFixed(6);
    
    // Remove trailing zeros
    return formatted.replace(/\.?0+$/, "");
  } catch (e) {
    // If parsing fails, return original value
    return value;
  }
}
