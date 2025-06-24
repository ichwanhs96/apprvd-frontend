import React from 'react';
import FolderCard from './FolderCard';

interface Folder {
  id: string;
  name: string;
}

interface FolderListProps {
  folders: Folder[];
}

export default function FolderList({ folders }: FolderListProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 flex-wrap">
      {folders.map((folder) => (
        <FolderCard key={folder.id} name={folder.name} />
      ))}
    </div>
  );
} 