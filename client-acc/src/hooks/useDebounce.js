/**
 * useDebounce – Returns a debounced version of the provided value.
 *
 * @param {*}      value  - The value to debounce
 * @param {number} delay  - Delay in ms (default 300)
 * @returns {*}           - The debounced value
 */
import { useState, useEffect } from "react";

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
