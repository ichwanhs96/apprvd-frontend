'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  currentUser: any;
}

interface SharedUser {
  id: string;
  email: string;
  access: 'view' | 'edit';
  sharedAt: string;
  sharedBy: string;
}

export default function ShareModal({ isOpen, onClose, documentId, documentName, currentUser }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<'view' | 'edit'>('view');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  // Fetch current shared users
  const fetchSharedUsers = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/document/${documentId}/share`);
      setSharedUsers(response.shares);
    } catch (error) {
      console.error('Failed to fetch shared users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Share document
  const handleShare = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setSharing(true);
      setError('');
      
      await apiCall(`/document/${documentId}/share`, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          access
        })
      });

      // Refresh shared users list
      await fetchSharedUsers();
      setEmail('');
      setAccess('view');
    } catch (error: any) {
      setError(error.message || 'Failed to share document');
    } finally {
      setSharing(false);
    }
  };

  // Remove access
  const handleRemoveAccess = async (userEmail: string) => {
    try {
      await apiCall(`/document/${documentId}/share`, {
        method: 'DELETE',
        body: JSON.stringify({ email: userEmail })
      });

      // Refresh shared users list
      await fetchSharedUsers();
    } catch (error) {
      console.error('Failed to remove access:', error);
    }
  };

  // Update access level
  const handleUpdateAccess = async (userEmail: string, newAccess: 'view' | 'edit') => {
    try {
      await apiCall(`/document/${documentId}/share`, {
        method: 'PUT',
        body: JSON.stringify({ email: userEmail, access: newAccess })
      });

      // Refresh shared users list
      await fetchSharedUsers();
    } catch (error) {
      console.error('Failed to update access:', error);
    }
  };

  // Fetch shared users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSharedUsers();
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-black dark:text-white">Share Document</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Document info */}
          <div className="mb-6">
            <h3 className="font-medium text-black dark:text-white mb-2">Document</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" fill="#88DF95" viewBox="0 0 24 24">
                  <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                </svg>
                <span className="text-black dark:text-white font-medium">{documentName}</span>
              </div>
            </div>
          </div>

          {/* Share form */}
          <div className="mb-6">
            <h3 className="font-medium text-black dark:text-white mb-3">Share with people</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#88DF95]"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => setAccess('view')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    access === 'view'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                      : 'bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="inline mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button
                  onClick={() => setAccess('edit')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    access === 'edit'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                      : 'bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="inline mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                onClick={handleShare}
                disabled={sharing || !email.trim()}
                className="w-full bg-[#88DF95] hover:bg-[#7ACF87] disabled:bg-gray-300 text-black font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>

          {/* Shared users list */}
          <div>
            <h3 className="font-medium text-black dark:text-white mb-3">People with access</h3>
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">Loading...</div>
            ) : sharedUsers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No one has access yet</div>
            ) : (
              <div className="space-y-2">
                {sharedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="text-black dark:text-white font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.access === 'edit' ? 'Can edit' : 'Can view'} • Shared {new Date(user.sharedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.access}
                        onChange={(e) => handleUpdateAccess(user.email, e.target.value as 'view' | 'edit')}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-black dark:text-white"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>
                      <button
                        onClick={() => handleRemoveAccess(user.email)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 