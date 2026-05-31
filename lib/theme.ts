'use client';

/**
 * Returns the currently active theme: 'light' or 'dark'.
 */
export const getTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

/**
 * Sets the active theme by updating document classes and localStorage,
 * then dispatches a 'theme-change' custom event.
 */
export const setTheme = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new Event('theme-change'));
};
