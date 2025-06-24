import React from 'react';

interface FolderCardProps {
  name: string;
}

export default function FolderCard({ name }: FolderCardProps) {
  return (
    <div className="w-40 h-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer">
      <svg width="40" height="40" fill="#88DF95" viewBox="0 0 24 24"><path d="M10 4H2v16h20V6H12l-2-2z"/></svg>
      <span className="mt-2 text-black dark:text-white font-medium">{name}</span>
    </div>
  );
} 