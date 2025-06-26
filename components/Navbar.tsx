import React, { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import UserDropdown from './UserDropdown';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onMenuClick?: () => void;
  search: string;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
}

export default function Navbar({ user, onLogout, onMenuClick, search, onSearch, onClearSearch }: NavbarProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // On mount, check localStorage or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-8 py-4 border-b bg-white dark:bg-gray-900 gap-2 md:gap-0">
      <div className="flex items-center w-full md:w-auto">
        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden mr-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <svg width="28" height="28" fill="none" stroke="#000" strokeWidth="2.5" viewBox="0 0 24 24" className="dark:stroke-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Logo (hidden on desktop, visible on mobile if needed) */}
        <div className="md:hidden bg-[#88DF95] rounded-md p-2 mr-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#88DF95"/>
            <path d="M10 17L15 22L22 12" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="md:hidden text-2xl font-semibold text-black dark:text-white">Apprvd</span>
      </div>
      {/* Search and controls: stacked on mobile, inline on desktop */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center w-full md:w-auto gap-2 md:gap-2">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={handleInput}
            placeholder="Search files or folders..."
            className="w-full pl-10 pr-10 py-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#88DF95] text-base"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
              onClick={onClearSearch}
              aria-label="Clear search"
              tabIndex={-1}
              type="button"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {/* Theme toggle button and avatar */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              // Sun icon
              <svg width="22" height="22" fill="none" stroke="#facc15" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              // Moon icon
              <svg width="22" height="22" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
              </svg>
            )}
          </button>
          <NotificationDropdown user={user} />
          <UserDropdown user={user} onLogout={onLogout} size="lg" />
        </div>
      </div>
    </header>
  );
} 