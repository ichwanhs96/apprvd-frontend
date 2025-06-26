'use client';

import { useState } from 'react';

interface UserDropdownProps {
  user: any;
  onLogout: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserDropdown({ user, onLogout, size = 'md' }: UserDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const avatarSize = sizeClasses[size];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center focus:outline-none"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className={`${avatarSize} rounded-full`}
          />
        ) : (
          <div className={`${avatarSize} bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center`}>
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </span>
          </div>
        )}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md shadow-lg z-10">
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-black dark:text-white hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 