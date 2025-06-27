'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import withAuth from '@/components/withAuth';
import { getCurrentUser, signOut } from '@/lib/firebase';
import UserDropdown from '@/components/UserDropdown';
import TinyMCEEditor from '@/components/TinyMCEEditor';
import ShareModal from '@/components/ShareModal';
import AISidebar from '@/components/AISidebar';
import { User as FirebaseUser } from 'firebase/auth';

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

interface SharedUser {
  email: string;
  access: string;
}

function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const editorRef = useRef<any>(null);
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documentName, setDocumentName] = useState('Untitled Document');
  const [editorContent, setEditorContent] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userAccessLevel, setUserAccessLevel] = useState<'view' | 'edit'>('edit');
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [isCreatingComment, setIsCreatingComment] = useState(false);

  // Helper function to find text nodes and their positions in TinyMCE
  const findTextNodesAndPositions = (body: HTMLElement, textContent: string) => {
    const textNodes: Array<{ node: Text; startPos: number; endPos: number }> = [];
    let currentPos = 0;
    
    // Recursively traverse all text nodes
    const traverseTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        textNodes.push({
          node: node as Text,
          startPos: currentPos,
          endPos: currentPos + textLength
        });
        currentPos += textLength;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip comment nodes and other non-content elements
        const element = node as Element;
        if (element.classList.contains('mce-comment') || 
            element.classList.contains('mce-comment-body') ||
            element.tagName === 'SCRIPT' ||
            element.tagName === 'STYLE') {
          return;
        }
        
        // Traverse child nodes
        for (let i = 0; i < node.childNodes.length; i++) {
          traverseTextNodes(node.childNodes[i]);
        }
      }
    };
    
    traverseTextNodes(body);
    
    // Verify that our calculated positions match the TinyMCE text content
    const calculatedText = textNodes.reduce((acc, tn) => acc + (tn.node.textContent || ''), '');
    if (calculatedText !== textContent) {
      console.warn('Text node positions do not match TinyMCE text content. This may cause positioning issues.');
      console.log('Calculated text length:', calculatedText.length);
      console.log('TinyMCE text length:', textContent.length);
    }
    
    return textNodes;
  };

  // Helper function to find the correct text nodes for a given position
  const findTextNodesForPosition = (textNodes: Array<{ node: Text; startPos: number; endPos: number }>, position: { start: number; end: number }) => {
    const targetStart = position.start;
    const targetEnd = position.end;
    
    let startNode: Text | null = null;
    let startOffset = 0;
    let endNode: Text | null = null;
    let endOffset = 0;
    
    // Find start node and offset
    for (const textNode of textNodes) {
      if (targetStart >= textNode.startPos && targetStart < textNode.endPos) {
        startNode = textNode.node;
        startOffset = targetStart - textNode.startPos;
        break;
      }
    }
    
    // Find end node and offset
    for (const textNode of textNodes) {
      if (targetEnd > textNode.startPos && targetEnd <= textNode.endPos) {
        endNode = textNode.node;
        endOffset = targetEnd - textNode.startPos;
        break;
      }
    }
    
    // If we couldn't find the nodes, try to find the closest match
    if (!startNode || !endNode) {
      console.warn('Could not find exact text nodes for position:', position);
      
      // Find the closest text node
      const closestNode = textNodes.find(tn => 
        targetStart >= tn.startPos && targetStart < tn.endPos
      );
      
      if (closestNode) {
        startNode = closestNode.node;
        endNode = closestNode.node;
        startOffset = Math.min(targetStart - closestNode.startPos, closestNode.node.textContent?.length || 0);
        endOffset = Math.min(targetEnd - closestNode.startPos, closestNode.node.textContent?.length || 0);
      }
    }
    
    return { startNode, startOffset, endNode, endOffset };
  };

  const scrollToPosition = useCallback((position: { start: number; end: number }) => {
    if (!editorRef.current) {
      console.error('Editor ref not available for scrolling to position');
      return;
    }
    
    try {
      const editor = editorRef.current;
      
      // Get the text content from TinyMCE (same as AI sidebar) - not from DOM body
      const textContent = editor.getContent({ format: 'text' }) || '';
      
      console.log('Scrolling to position:', { position, textContentLength: textContent.length });
      
      if (position.start >= textContent.length || position.end > textContent.length) {
        console.warn('Position out of bounds:', position, 'Text length:', textContent.length);
        return;
      }
      
      // Get the body for DOM operations
      const body = editor.getBody();
      
      // Find the text nodes and their positions in the DOM
      const textNodes = findTextNodesAndPositions(body, textContent);
      
      // Find the text nodes that contain our target position
      const { startNode, startOffset, endNode, endOffset } = findTextNodesForPosition(textNodes, position);
      
      if (!startNode || !endNode) {
        console.error('No suitable text node found for scroll position');
        return;
      }
      
      // Create the range and set selection
      const range = editor.selection.getRng();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      editor.selection.setRng(range);
      
      // Scroll to the selection
      const element = editor.selection.getNode();
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the selection briefly
        const originalBackground = element.style.backgroundColor;
        element.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
          element.style.backgroundColor = originalBackground;
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error scrolling to position:', error);
    }
  }, []);

  const loadDocument = useCallback(async () => {
    try {
      console.log('Loading document with ID:', documentId);
      setLoading(true);
      
      const idToken = await getCurrentUser()?.getIdToken();
      if (!idToken) {
        console.error('No authentication token available');
        throw new Error('No authentication token');
      }

      console.log('Making API request to fetch document...');
      const response = await fetch(`/api/document/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      console.log('API response status:', response.status);
      if (!response.ok) {
        if (response.status === 404) {
          console.error('Document not found');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      console.log('Document data received:', data);
      const foundDocument = data.document;
      
      if (foundDocument) {
        setDocument(foundDocument);
        setEditorContent(foundDocument.content);
        setDocumentName(foundDocument.name);
        setUserAccessLevel(data.userAccessLevel || 'edit');
        console.log('Document loaded successfully:', foundDocument.name);
      } else {
        console.error('Document not found in response');
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [documentId, router]);

  useEffect(() => {
    setUser(getCurrentUser());
    loadDocument();
    
    // Listen for scroll to position events from AI sidebar
    const handleScrollToPosition = (event: CustomEvent) => {
      const position = event.detail;
      if (editorRef.current && position) {
        scrollToPosition(position);
      }
    };

    window.addEventListener('scrollToPosition', handleScrollToPosition as EventListener);
    
    return () => {
      window.removeEventListener('scrollToPosition', handleScrollToPosition as EventListener);
    };
  }, [loadDocument, scrollToPosition]);

  const handleAddComment = (position: { start: number; end: number }, message: string) => {
    console.log('=== handleAddComment called ===');
    console.log('Position:', position);
    console.log('Message:', message);
    
    if (!editorRef.current) {
      console.error('Editor ref not available for adding comment');
      return;
    }
    
    if (userAccessLevel !== 'edit') {
      console.error('User does not have edit access for adding comments');
      return;
    }
    
    // Set loading state
    setIsCreatingComment(true);
    
    try {
      const editor = editorRef.current;
      console.log('Editor instance:', editor);
      console.log('Editor type:', typeof editor);
      console.log('Editor methods:', Object.getOwnPropertyNames(editor));
      console.log('Fire method available:', typeof editor.fire === 'function');
      console.log('Dispatch method available:', typeof editor.dispatch === 'function');
      
      // Get the text content from TinyMCE (same as AI sidebar) - not from DOM body
      const textContent = editor.getContent({ format: 'text' }) || '';
      
      console.log('Adding comment:', { position, message, textContentLength: textContent.length });
      
      if (position.start >= textContent.length || position.end > textContent.length) {
        console.warn('Position out of bounds:', position, 'Text length:', textContent.length);
        return;
      }
      
      // Get the body for DOM operations
      const body = editor.getBody();
      
      // Find the text nodes and their positions in the DOM
      const textNodes = findTextNodesAndPositions(body, textContent);
      
      console.log('Found text nodes:', textNodes.length);
      
      // Find the text nodes that contain our target position
      const { startNode, startOffset, endNode, endOffset } = findTextNodesForPosition(textNodes, position);
      
      if (!startNode || !endNode) {
        console.error('No suitable text node found for comment position');
        if (editor.notificationManager && editor.notificationManager.open) {
          editor.notificationManager.open({
            text: 'Could not find the exact text position for this comment',
            type: 'warning',
            timeout: 5000
          });
        } else {
          console.warn('Could not find the exact text position for this comment');
        }
        return;
      }
      
      // Create the range and set selection
      const range = editor.selection.getRng();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      editor.selection.setRng(range);
      
      // Verify the selection contains the expected text
      const selectedText = editor.selection.getContent({ format: 'text' });
      const expectedText = textContent.substring(position.start, position.end);
      
      console.log('Selection verification:', {
        selected: selectedText,
        expected: expectedText,
        match: selectedText === expectedText
      });
      
      // Use the proper TinyMCE comments API
      const commentData = {
        content: message,
        author: user?.displayName || user?.email || 'AI Review',
        authorName: user?.displayName || user?.email || 'AI Review',
        authorAvatar: user?.photoURL || '',
        createdAt: new Date().toISOString()
      };

      console.log('Attempting to create comment with data:', commentData);

      // Method: Trigger custom TinyMCE event for AI comment creation
      try {
        // Get the selected text from the position
        const selectedText = textContent.substring(position.start, position.end);
        
        if (!selectedText) {
          throw new Error('No text selected for comment');
        }

        console.log('Selected text for comment:', selectedText);

        // Trigger the custom mceAiComment event with the suggestion data
        const validSuggestions = [{
          target_text: selectedText,
          suggestion: message
        }];

        console.log('About to fire mceAiComment event with suggestions:', validSuggestions);
        
        // Use TinyMCE's proper event firing method
        const result = editor.fire('mceAiComment', { suggestions: validSuggestions });
        console.log('mceAiComment event fired via TinyMCE, result:', result);
        
        // Also try dispatching a custom event on the editor body as backup
        console.log('Also dispatching custom event on editor body...');
        const customEvent = new CustomEvent('mceAiComment', {
          detail: { suggestions: validSuggestions },
          bubbles: true
        });
        editor.getBody().dispatchEvent(customEvent);
        console.log('Custom event dispatched on editor body');

      } catch (interactionError) {
        console.log('AI comment event failed:', interactionError);
        
        // Fallback to manual creation if event fails
        console.log('Falling back to manual comment creation...');
        try {
          const selectedText = editor.selection.getContent();
          console.log('Selected text for comment:', selectedText);
          
          if (selectedText) {
            // Create a comment span
            const commentSpan = editor.getDoc().createElement('span');
            commentSpan.className = 'mce-comment';
            commentSpan.setAttribute('data-mce-comment', JSON.stringify(commentData));
            commentSpan.style.backgroundColor = '#fff3cd';
            commentSpan.style.border = '1px solid #ffeaa7';
            commentSpan.style.borderRadius = '3px';
            commentSpan.style.padding = '2px 4px';
            commentSpan.textContent = selectedText;
            
            // Replace the selection
            editor.selection.setContent(commentSpan.outerHTML);
            console.log('Manual comment element created as fallback');
          }
        } catch (manualError) {
          console.log('Manual creation also failed:', manualError);
        }
      }

      // Show a notification (with fallback)
      if (editor.notificationManager && editor.notificationManager.open) {
        editor.notificationManager.open({
          text: 'AI comment added successfully',
          type: 'success',
          timeout: 3000
        });
      } else {
        // Fallback: use browser alert or console log
        console.log('AI comment added successfully');
        // Optionally show a browser alert
        // alert('AI comment added successfully');
      }
      
    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Show error notification (with fallback)
      if (editorRef.current && editorRef.current.notificationManager && editorRef.current.notificationManager.open) {
        editorRef.current.notificationManager.open({
          text: 'Failed to add comment: ' + (error as Error).message,
          type: 'error',
          timeout: 5000
        });
      } else {
        // Fallback: use browser alert or console log
        console.error('Failed to add comment:', (error as Error).message);
        // Optionally show a browser alert
        // alert('Failed to add comment: ' + (error as Error).message);
      }
    } finally {
      // Always clear loading state when done
      setIsCreatingComment(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleStatusUpdate = async (newStatus: 'DRAFT' | 'REVIEW' | 'FINAL') => {
    if (!document) return;
    
    try {
      setSaving(true);
      const idToken = await getCurrentUser()?.getIdToken();
      if (!idToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/document/${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editorContent,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document status');
      }

      const data = await response.json();
      setDocument(data.document);
      setDocumentName(data.document.name);
      
      // Update user access level if document is now FINAL
      if (newStatus === 'FINAL') {
        setUserAccessLevel('view');
      }
      
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update document status');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!document) return;
    
    try {
      setSaving(true);
      const idToken = await getCurrentUser()?.getIdToken();
      if (!idToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/document/${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editorContent,
          status: document.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const data = await response.json();
      setDocument(data.document);
      setDocumentName(data.document.name);
      
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSave = async () => {
    console.log('Auto-save triggered:', { 
      hasDocument: !!document, 
      userAccessLevel, 
      documentStatus: document?.status,
      canEdit: userAccessLevel === 'edit' && document?.status !== 'FINAL'
    });
    
    if (!document || userAccessLevel !== 'edit') {
      console.log('Auto-save blocked: No document or no edit access');
      return;
    }
    
    if (document.status === 'FINAL') {
      console.log('Auto-save blocked: Document is FINAL');
      return;
    }
    
    try {
      const idToken = await getCurrentUser()?.getIdToken();
      if (!idToken) {
        throw new Error('No authentication token');
      }

      console.log('Sending auto-save request to:', `/api/document/${documentId}`);
      
      const response = await fetch(`/api/document/${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editorContent,
          status: document.status,
        }),
      });

      console.log('Auto-save response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auto-save response error:', errorText);
        throw new Error(`Failed to auto-save document: ${response.status} ${errorText}`);
      }

      console.log('Auto-save successful');

    } catch (error) {
      console.error('Failed to auto-save document:', error);
    }
  };

  const handleAutoSaveComplete = (timestamp: Date) => {
    setLastAutoSave(timestamp);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAutoSaveTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get the next status for the status update button
  const getNextStatus = () => {
    if (document?.status === 'DRAFT') return 'REVIEW';
    if (document?.status === 'REVIEW') return 'FINAL';
    return 'DRAFT'; // fallback
  };

  // Get the button text based on current status
  const getStatusButtonText = () => {
    if (document?.status === 'DRAFT') return 'Mark for Review';
    if (document?.status === 'REVIEW') return 'Finalize Document';
    return 'Change Status'; // fallback
  };

  // Check if user can edit (considering both access level and document status)
  const canEdit = userAccessLevel === 'edit' && document?.status !== 'FINAL';

  // Fetch shared users
  const fetchSharedUsers = useCallback(async () => {
    if (!user || !documentId) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/document/${documentId}/users`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSharedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch shared users:', error);
    }
  }, [user, documentId]);

  // Fetch document and shared users
  useEffect(() => {
    if (user && documentId) {
      loadDocument();
      fetchSharedUsers();
    }
  }, [user, documentId, loadDocument, fetchSharedUsers]);

  const handleContentChange = (content: string) => {
    if (canEdit) {
      setEditorContent(content);
    }
  };

  // Test function for debugging comment functionality
  const testAddComment = useCallback(() => {
    if (!editorRef.current) {
      console.error('Editor not available');
      return;
    }
    
    const editor = editorRef.current;
    const textContent = editor.getContent({ format: 'text' }) || '';
    
    console.log('Testing comment functionality...');
    console.log('Text content length:', textContent.length);
    console.log('First 100 characters:', textContent.substring(0, 100));
    
    // Test with the first 20 characters
    const testPosition = { start: 0, end: Math.min(20, textContent.length) };
    const testMessage = 'This is a test comment from AI Review';
    
    console.log('Test position:', testPosition);
    console.log('Test message:', testMessage);
    
    handleAddComment(testPosition, testMessage);
  }, [handleAddComment]);

  // Expose test function to window for debugging
  useEffect(() => {
    (window as any).testAddComment = testAddComment;
    return () => {
      delete (window as any).testAddComment;
    };
  }, [testAddComment]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-black dark:text-white">
            Loading document... {documentId}
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-black dark:text-white">
            Document not found: {documentId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Back button and document info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-white"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-black dark:text-white truncate max-w-md">
                {documentName}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last edited: {formatDate(document.updated_at)} • Status: {document.status}
                {saving && <span className="ml-2 text-blue-500">• Saving...</span>}
                {lastAutoSave && <span className="ml-2 text-green-500">• Auto-saved at {formatAutoSaveTime(lastAutoSave)}</span>}
              </div>
            </div>
          </div>

          {/* Right side - User and action buttons */}
          <div className="flex items-center space-x-3">
            {/* Manual Save Button - Only show for edit access */}
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}

            {/* Status Update Button - Only show for edit access and not FINAL status */}
            {userAccessLevel === 'edit' && document?.status !== 'FINAL' && (
              <div className="relative">
                <button
                  onClick={() => handleStatusUpdate(getNextStatus())}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors text-sm"
                >
                  {getStatusButtonText()}
                </button>
              </div>
            )}

            {/* Share Button - Only show for edit access */}
            {userAccessLevel === 'edit' && (
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
              >
                Share
              </button>
            )}

            {/* User Dropdown */}
            <UserDropdown user={user} onLogout={handleLogout} size="md" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 pt-16 transition-all duration-300 ${aiSidebarOpen ? 'mr-96' : ''}`}>
        <div className="h-full flex flex-col">
          {/* TinyMCE Editor */}
          <div className="flex-1 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
                <TinyMCEEditor
                  value={editorContent}
                  onChange={handleContentChange}
                  onSave={handleAutoSave}
                  onAutoSave={handleAutoSaveComplete}
                  disabled={saving || !canEdit}
                  documentId={documentId}
                  sharedUsers={sharedUsers}
                  userAccessLevel={canEdit ? 'edit' : 'view'}
                  ref={editorRef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Sidebar */}
      <AISidebar
        documentId={documentId}
        documentContent={editorContent}
        documentName={documentName}
        isOpen={aiSidebarOpen}
        onToggle={() => setAiSidebarOpen(!aiSidebarOpen)}
        onAddComment={handleAddComment}
        editorRef={editorRef}
        isCreatingComment={isCreatingComment}
        userAccessLevel={canEdit ? 'edit' : 'view'}
      />

      {/* Share Modal */}
      {document && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          documentId={documentId}
          documentName={document.name}
          currentUser={user}
        />
      )}
    </div>
  );
}

export default withAuth(DocumentPage); 