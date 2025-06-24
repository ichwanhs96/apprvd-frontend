import React from 'react';
import FileCard from './FileCard';

interface File {
  id: string;
  name: string;
  type: string;
  modified: string;
}

interface FileListProps {
  files: File[];
}

export default function FileList({ files }: FileListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} name={file.name} type={file.type} modified={file.modified} />
      ))}
    </div>
  );
} 