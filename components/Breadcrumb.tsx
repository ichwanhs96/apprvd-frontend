import React from 'react';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center space-x-2 mb-6 text-sm">
      <button
        onClick={() => onNavigate('')}
        className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
      >
        Home
      </button>
      
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <button
            onClick={() => onNavigate(item.id)}
            className={`transition-colors ${
              index === items.length - 1
                ? 'text-black dark:text-white font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
} 