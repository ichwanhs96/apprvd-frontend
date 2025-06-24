import React, { useState } from 'react';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNew = (type: 'folder' | 'file') => {
    setShowDropdown(false);
    alert(`Create new ${type}`);
  };

  return (
    <>
      {/* Overlay for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col py-6 px-4
          transition-transform duration-200
          md:static md:translate-x-0 md:flex
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ maxWidth: 256 }}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-4 right-4 md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
          style={{ zIndex: 51 }}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24" className="dark:stroke-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Logo */}
        <div className="flex items-center mb-10">
          <div className="bg-[#88DF95] rounded-md p-2 mr-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#88DF95"/>
              <path d="M10 17L15 22L22 12" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-2xl font-semibold text-black dark:text-white">Apprvd</span>
        </div>
        {/* New Button */}
        <div className="relative mb-6">
          <button
            className="flex items-center gap-2 w-full bg-[#88DF95] text-black font-semibold py-2 px-4 rounded-md shadow hover:bg-[#7ACF87] dark:hover:bg-[#7ACF87]/80 transition"
            onClick={() => setShowDropdown((v) => !v)}
          >
            <span className="text-xl">+</span>
            <span>New</span>
          </button>
          {showDropdown && (
            <div className="absolute left-0 mt-2 w-full bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md shadow z-10">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30 text-black dark:text-white"
                onClick={() => handleNew('folder')}
              >
                New Folder
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30 text-black dark:text-white"
                onClick={() => handleNew('file')}
              >
                New File
              </button>
            </div>
          )}
        </div>
        <nav className="flex flex-col gap-2">
          <a href="#" className="py-2 px-3 rounded-md text-black dark:text-white font-medium hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30">Home</a>
          <a href="#" className="py-2 px-3 rounded-md text-black dark:text-white font-medium hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30">My Drive</a>
          <a href="#" className="py-2 px-3 rounded-md text-black dark:text-white font-medium hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30">Shared</a>
          <a href="#" className="py-2 px-3 rounded-md text-black dark:text-white font-medium hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30">Recent</a>
          <a href="#" className="py-2 px-3 rounded-md text-black dark:text-white font-medium hover:bg-[#88DF95]/20 dark:hover:bg-[#88DF95]/30">Starred</a>
        </nav>
      </aside>
    </>
  );
} 