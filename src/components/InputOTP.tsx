import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface InputOTPProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

export const InputOTP: React.FC<InputOTPProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  className
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (focusedIndex !== null && inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '');

    if (digit.length > 1) {
      // Handle paste operation
      const newValue = digit.slice(0, length).padEnd(length, '');
      onChange(newValue);
      setFocusedIndex(length - 1);
      return;
    }

    // Update the value at the specific index
    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('');

    onChange(updatedValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input and clear it
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        setFocusedIndex(index - 1);
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      setFocusedIndex(index + 1);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    const newValue = pasteData.slice(0, length).padEnd(length, '');
    onChange(newValue);
    setFocusedIndex(Math.min(pasteData.length - 1, length - 1));
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-xl font-mono border-2 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            focusedIndex === index
              ? "border-blue-500 ring-2 ring-blue-500"
              : "border-gray-300",
            value[index] ? "bg-blue-50 border-blue-500" : "bg-white"
          )}
          maxLength={1}
        />
      ))}
    </div>
  );
};
