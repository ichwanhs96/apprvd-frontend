import React from 'react';
import FileCard from './FileCard';

interface Document {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
  language?: string;
  version?: string;
  status: string;
  folder_id?: string;
  shared_by?: string;
  access_level?: string;
}

interface FileListProps {
  files: Document[];
  onDragStart?: (e: React.DragEvent, fileId: string) => void;
  onDrop?: (fileId: string, folderId: string) => void;
  showSharedInfo?: boolean;
}

export default function FileList({ files, onDragStart, onDrop, showSharedInfo = false }: FileListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {files.map((file) => (
        <FileCard 
          key={file.id} 
          id={file.id}
          name={file.name}
          content={file.content}
          status={file.status}
          updatedAt={file.updated_at}
          language={file.language}
          version={file.version}
          sharedBy={file.shared_by}
          accessLevel={file.access_level}
          showSharedInfo={showSharedInfo}
          onDragStart={onDragStart}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
} 