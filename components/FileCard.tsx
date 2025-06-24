import React from 'react';

interface FileCardProps {
  name: string;
  type: string;
  modified: string;
}

export default function FileCard({ name, type, modified }: FileCardProps) {
  return (
    <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="mr-4">
        {type === 'pdf' && (
          <svg width="32" height="32" fill="#88DF95" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/></svg>
        )}
        {type === 'docx' && (
          <svg width="32" height="32" fill="#88DF95" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/></svg>
        )}
        {type === 'xlsx' && (
          <svg width="32" height="32" fill="#88DF95" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/></svg>
        )}
      </div>
      <div>
        <div className="text-black dark:text-white font-medium">{name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-300">Last modified: {modified}</div>
      </div>
    </div>
  );
} 