import React, { useState } from 'react';

interface FolderCardProps {
  id: string;
  name: string;
  updatedAt: string;
  parentId?: string;
  onClick?: () => void;
  onDrop?: (fileId: string, folderId: string) => void;
}

export default function FolderCard({ id, name, updatedAt, parentId, onClick, onDrop }: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Format the date
  const formattedDate = new Date(updatedAt).toLocaleDateString();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const fileId = e.dataTransfer.getData('text/plain');
    if (fileId && onDrop) {
      onDrop(fileId, id);
    }
  };

  return (
    <div 
      className={`w-40 h-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer ${
        isDragOver ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
      }`}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <svg width="40" height="40" fill="#88DF95" viewBox="0 0 24 24">
        <path d="M10 4H2v16h20V6H12l-2-2z"/>
      </svg>
      <span className="mt-2 text-black dark:text-white font-medium text-center px-2 truncate w-full">{name}</span>
      <span className="text-xs text-gray-500 dark:text-gray-300 mt-1">{formattedDate}</span>
    </div>
  );
} 