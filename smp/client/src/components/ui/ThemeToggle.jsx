import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.06] dark:bg-zinc-900/80 backdrop-blur-xl text-zinc-900 dark:text-white shadow-2xl shadow-black/30 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{ scale: isDark ? 0 : 1, opacity: isDark ? 0 : 1, rotate: isDark ? -90 : 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="absolute"
        >
          <Sun size={20} className="text-amber-400" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{ scale: isDark ? 1 : 0, opacity: isDark ? 1 : 0, rotate: isDark ? 0 : 90 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="absolute"
        >
          <Moon size={20} className="text-violet-400" />
        </motion.div>
      </div>
    </button>
  );
}
