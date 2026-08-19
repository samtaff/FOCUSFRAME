import React, { useState, useEffect, useRef } from 'react';

interface PreciseNumberInputProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  className?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  'aria-label'?: string;
}

export const PreciseNumberInput: React.FC<PreciseNumberInputProps> = ({
  id,
  value,
  onChange,
  className = '',
  min,
  max,
  placeholder,
  'aria-label': ariaLabel,
}) => {
  const [localText, setLocalText] = useState<string>(() => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    // Format nicely without trailing zeros (e.g. 20.5 or 20)
    return String(Math.round(value * 100) / 100);
  });
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from props when NOT focused by the user (e.g. canvas drag, preset button)
  useEffect(() => {
    if (!isFocused) {
      if (isNaN(value) || value === null || value === undefined) {
        setLocalText('0');
      } else {
        const rounded = Math.round(value * 100) / 100;
        setLocalText(String(rounded));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow user to type numbers, comma, dot, minus sign freely
    // Filter out invalid characters but keep commas, dots, minuses, digits
    const cleaned = raw.replace(/[^0-9.,-]/g, '');
    setLocalText(cleaned);

    // Convert comma to dot for parsing
    const normalized = cleaned.replace(',', '.');
    
    // Only propagate if it is a complete valid number (not just "-" or "." or empty)
    if (normalized !== '' && normalized !== '-' && normalized !== '.' && !normalized.endsWith('.')) {
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed) && isFinite(parsed)) {
        let finalVal = parsed;
        if (min !== undefined && finalVal < min) finalVal = min;
        if (max !== undefined && finalVal > max) finalVal = max;
        onChange(finalVal);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const normalized = localText.replace(',', '.');
    let parsed = parseFloat(normalized);
    if (isNaN(parsed) || !isFinite(parsed)) {
      parsed = value ?? 0;
    }
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    
    const rounded = Math.round(parsed * 100) / 100;
    setLocalText(String(rounded));
    onChange(rounded);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const normalized = localText.replace(',', '.');
      const current = parseFloat(normalized) || 0;
      const next = Math.round((current + step) * 100) / 100;
      setLocalText(String(next));
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const normalized = localText.replace(',', '.');
      const current = parseFloat(normalized) || 0;
      const next = Math.round((current - step) * 100) / 100;
      setLocalText(String(next));
      onChange(next);
    }
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      value={localText}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  );
};
