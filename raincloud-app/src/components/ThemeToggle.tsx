'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(saved === 'dark' || (!saved && prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="fixed top-4 right-4"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
