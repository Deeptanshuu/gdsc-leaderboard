import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

// Animates from the previously shown value to `value`, so live score bumps tick up
// instead of jumping. Starts from `from` on first render.
export function useCountUp(value, { duration = 1.2, delay = 0, from = 0 } = {}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : from);
  const current = useRef(reduceMotion ? value : from);

  useEffect(() => {
    if (reduceMotion) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      delay,
      ease: 'easeOut',
      onUpdate: (latest) => {
        current.current = latest;
        setDisplay(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value, duration, delay, reduceMotion]);

  return display;
}
