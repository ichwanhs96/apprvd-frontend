import React from 'react';
import FolderCard from './FolderCard';

interface Folder {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
}

interface FolderListProps {
  folders: Folder[];
  onFolderClick?: (folderId: string) => void;
  onDrop?: (fileId: string, folderId: string) => void;
}

export default function FolderList({ folders, onFolderClick, onDrop }: FolderListProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 flex-wrap">
      {folders.map((folder) => (
        <FolderCard 
          key={folder.id} 
          id={folder.id}
          name={folder.name}
          updatedAt={folder.updated_at}
          parentId={folder.parent_id}
          onClick={() => onFolderClick?.(folder.id)}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
} 