'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import FolderList from '@/components/FolderList';
import FileList from '@/components/FileList';
import withAuth from '@/components/withAuth';
import { getCurrentUser, signOut } from '@/lib/firebase';

// Mock data for files and folders
const mockFolders = [
  { name: 'Contracts', id: 'folder-1' },
  { name: 'Legal Docs', id: 'folder-2' },
  { name: 'Shared', id: 'folder-3' },
];
const mockFiles = [
  { name: 'NDA_Acme.pdf', id: 'file-1', type: 'pdf', modified: '2024-06-01' },
  { name: 'Service_Agreement.docx', id: 'file-2', type: 'docx', modified: '2024-05-28' },
  { name: 'Contract_Template.xlsx', id: 'file-3', type: 'xlsx', modified: '2024-05-20' },
];

function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  // Filter logic
  const searchLower = search.toLowerCase();
  const filteredFolders = mockFolders.filter(folder => folder.name.toLowerCase().includes(searchLower));
  const filteredFiles = mockFiles.filter(file => file.name.toLowerCase().includes(searchLower));

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar: hidden on mobile, toggled with hamburger */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col md:ml-0">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
          search={search}
          onSearch={setSearch}
          onClearSearch={() => setSearch('')}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto text-black dark:text-white">
          <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">Welcome to Apprvd Drive</h1>
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">Folders</h2>
            <FolderList folders={filteredFolders} />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">Files</h2>
            <FileList files={filteredFiles} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default withAuth(HomePage);
