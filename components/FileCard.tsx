import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FileCardProps {
  id: string;
  name: string;
  content: string;
  status: string;
  updatedAt: string;
  language?: string;
  version?: string;
  sharedBy?: string;
  accessLevel?: string;
  showSharedInfo?: boolean;
  onDragStart?: (e: React.DragEvent, fileId: string) => void;
  onDrop?: (fileId: string, folderId: string) => void;
}

export default function FileCard({ 
  id, 
  name, 
  content, 
  status, 
  updatedAt, 
  language, 
  version, 
  sharedBy,
  accessLevel,
  showSharedInfo = false,
  onDragStart,
  onDrop
}: FileCardProps) {
  const router = useRouter();
  
  // Format the date
  const formattedDate = new Date(updatedAt).toLocaleDateString();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e, id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const folderId = e.currentTarget.getAttribute('data-folder-id');
    if (folderId && onDrop) {
      onDrop(id, folderId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if user is dragging
    if (e.defaultPrevented) return;
    
    // Let the Link component handle navigation
    // The click handler is mainly for debugging
  };

  const getAccessLevelColor = (level?: string) => {
    switch (level) {
      case 'edit':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'view':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <Link href={`/document/${id}`} className="block">
      <div 
        className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
        draggable
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <div className="mr-4">
          <svg width="32" height="32" fill="#88DF95" viewBox="0 0 24 24">
            <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-black dark:text-white font-medium truncate">{name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Status: {status} • {formattedDate}
          </div>
          {showSharedInfo && sharedBy && (
            <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">
              <span className="mr-2">Shared by: {sharedBy}</span>
              {accessLevel && (
                <span className={`px-1 py-0.5 rounded text-xs font-medium ${getAccessLevelColor(accessLevel)}`}>
                  {accessLevel}
                </span>
              )}
            </div>
          )}
          {(language || version) && (
            <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">
              {language && <span className="mr-2">Lang: {language}</span>}
              {version && <span>v{version}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 