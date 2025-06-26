'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import FolderList from '@/components/FolderList';
import FileList from '@/components/FileList';
import Breadcrumb from '@/components/Breadcrumb';
import withAuth from '@/components/withAuth';
import { getCurrentUser, signOut } from '@/lib/firebase';
import { driveApi } from '@/lib/api';

interface Folder {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
}

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
}

interface SharedDocument extends Document {
  access_level: string;
  shared_at: string;
  shared_by_email: string;
  shared_by_name: string;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<Document[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'drive' | 'shared' | 'recent' | 'starred'>('home');

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    loadData();
  }, [currentView, currentFolderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (currentView === 'shared') {
        await loadSharedDocuments();
      } else if (currentView === 'drive') {
        await loadDriveData();
      } else {
        // For home, recent, starred views, load drive data for now
        await loadDriveData();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedDocuments = async () => {
    try {
      console.log('Loading shared documents...');
      const data = await driveApi.getSharedDocuments();
      console.log('Shared documents loaded:', { documents: data.documents?.length });
      setSharedFiles(data.documents || []);
      setFolders([]); // No folders in shared view
      setFiles([]); // Clear regular files
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } catch (error) {
      console.error('Failed to load shared documents:', error);
    }
  };

  const loadDriveData = async () => {
    try {
      console.log('Loading drive data for folderId:', currentFolderId || 'ROOT');
      const data = await driveApi.getDrive(currentFolderId || undefined);
      console.log('Drive data loaded:', { folders: data.folders?.length, files: data.files?.length, currentFolder: data.currentFolder });
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setCurrentFolder(data.currentFolder || null);
      setSharedFiles([]); // Clear shared files
      
      // Build breadcrumbs if we're in a folder
      if (data.currentFolder) {
        await buildBreadcrumbs(data.currentFolder);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error('Failed to load drive data:', error);
    }
  };

  const buildBreadcrumbs = async (folder: Folder) => {
    const breadcrumbItems: BreadcrumbItem[] = [];
    
    // For now, just add the current folder to breadcrumbs
    // We can enhance this later to fetch the full path if needed
    breadcrumbItems.push({
      id: folder.id,
      name: folder.name
    });
    
    setBreadcrumbs(breadcrumbItems);
  };

  const handleViewChange = (view: 'home' | 'drive' | 'shared' | 'recent' | 'starred') => {
    setCurrentView(view);
    setCurrentFolderId(''); // Reset folder navigation when changing views
    setSearch(''); // Clear search when changing views
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const result = await driveApi.createFolder(newFolderName.trim(), currentFolderId || undefined);
      setFolders(prev => [...prev, result.folder]);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      alert('Please enter a document name');
      return;
    }

    try {
      const result = await driveApi.createDocument('', newFileName.trim(), undefined, undefined, currentFolderId || undefined);
      setFiles(prev => [result.document, ...prev]);
      setNewFileName('');
      setShowCreateFile(false);
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file');
    }
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbNavigate = (folderId: string) => {
    console.log('Navigating to folder:', folderId || 'HOME');
    setCurrentFolderId(folderId);
  };

  const handleDrop = async (fileId: string, folderId: string) => {
    try {
      await driveApi.moveDocument(fileId, folderId);
      
      // Remove the file from current view
      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      // Show success message
      console.log('File moved successfully');
    } catch (error) {
      console.error('Failed to move file:', error);
      alert('Failed to move file');
    }
  };

  // Filter logic
  const searchLower = search.toLowerCase();
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchLower)
  );
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchLower)
  );
  const filteredSharedFiles = sharedFiles.filter(file => 
    file.name.toLowerCase().includes(searchLower)
  );

  const getViewTitle = () => {
    switch (currentView) {
      case 'home':
        return 'Welcome to Apprvd Drive';
      case 'drive':
        return currentFolder ? currentFolder.name : 'My Drive';
      case 'shared':
        return 'Shared with me';
      case 'recent':
        return 'Recent Documents';
      case 'starred':
        return 'Starred Documents';
      default:
        return 'Welcome to Apprvd Drive';
    }
  };

  const canCreateItems = currentView === 'drive' || currentView === 'home';

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar: hidden on mobile, toggled with hamburger */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onCreateFolder={canCreateItems ? () => setShowCreateFolder(true) : undefined}
        onCreateFile={canCreateItems ? () => setShowCreateFile(true) : undefined}
        currentView={currentView}
        onViewChange={handleViewChange}
      />
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
          {/* Breadcrumb Navigation */}
          {breadcrumbs.length > 0 && currentView === 'drive' && (
            <Breadcrumb items={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
          )}
          
          <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">
            {getViewTitle()}
          </h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading...</div>
            </div>
          ) : (
            <>
              {/* Show folders only in drive view */}
              {currentView === 'drive' && filteredFolders.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">
                    Folders ({filteredFolders.length})
                  </h2>
                  <FolderList 
                    folders={filteredFolders} 
                    onFolderClick={handleFolderClick}
                    onDrop={handleDrop}
                  />
                </div>
              )}

              {/* Show files based on current view */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">
                  {currentView === 'shared' ? 'Shared Documents' : 'Documents'} 
                  ({currentView === 'shared' ? filteredSharedFiles.length : filteredFiles.length})
                </h2>
                
                {currentView === 'shared' ? (
                  <FileList 
                    files={filteredSharedFiles.map(file => ({
                      ...file,
                      shared_by: file.shared_by_name || file.shared_by_email,
                      access_level: file.access_level
                    }))} 
                    onDrop={handleDrop}
                    showSharedInfo={true}
                  />
                ) : (
                  <FileList 
                    files={filteredFiles} 
                    onDrop={handleDrop}
                    showSharedInfo={false}
                  />
                )}
              </div>

              {/* Empty state */}
              {!loading && 
               ((currentView === 'drive' && filteredFolders.length === 0 && filteredFiles.length === 0) ||
                (currentView === 'shared' && filteredSharedFiles.length === 0) ||
                (currentView !== 'drive' && currentView !== 'shared' && filteredFiles.length === 0)) && (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                    {currentView === 'shared' ? (
                      <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mx-auto">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    ) : (
                      <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mx-auto">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {currentView === 'shared' ? 'No shared documents' : 'No documents yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {currentView === 'shared' 
                      ? 'Documents shared with you will appear here.'
                      : 'Get started by creating your first document.'
                    }
                  </p>
                  {currentView !== 'shared' && canCreateItems && (
                    <button
                      onClick={() => setShowCreateFile(true)}
                      className="bg-[#88DF95] hover:bg-[#7ACF87] text-black font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Create Document
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Create New Folder</h2>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 text-black dark:text-white bg-white dark:bg-gray-700"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-[#88DF95] hover:bg-[#7ACF87] text-black rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {showCreateFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Create New Document</h2>
            <input
              type="text"
              placeholder="Document name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 text-black dark:text-white bg-white dark:bg-gray-700"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateFile(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-[#88DF95] hover:bg-[#7ACF87] text-black rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(HomePage);
