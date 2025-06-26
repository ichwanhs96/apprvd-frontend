import { auth } from '@/lib/firebase';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const idToken = await user.getIdToken();
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Drive API functions
export const driveApi = {
  // Get all folders and files (optionally in a specific folder)
  getDrive: (folderId?: string) => {
    // Only add folderId to URL if it's not empty
    const url = folderId && folderId.trim() !== '' ? `/drive?folderId=${folderId}` : '/drive';
    return apiCall(url);
  },
  
  // Get documents shared with the current user
  getSharedDocuments: () => {
    return apiCall('/drive/shared');
  },
  
  // Create a new folder
  createFolder: (name: string, parentId?: string) => 
    apiCall('/drive/folder', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    }),
  
  // Create a new document
  createDocument: (content: string, name?: string, language?: string, version?: string, folderId?: string) =>
    apiCall('/drive/document', {
      method: 'POST',
      body: JSON.stringify({ content, name, language, version, folderId }),
    }),

  // Move a document to a different folder
  moveDocument: (documentId: string, folderId?: string) =>
    apiCall('/drive/document/move', {
      method: 'PUT',
      body: JSON.stringify({ documentId, folderId }),
    }),
}; 