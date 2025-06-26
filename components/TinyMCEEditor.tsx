'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { getCurrentUser } from '@/lib/firebase';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  onAutoSave?: (timestamp: Date) => void;
  disabled?: boolean;
  documentId: string;
  sharedUsers?: Array<{ email: string; access: string }>;
  userAccessLevel?: 'view' | 'edit';
}

interface Conversation {
  uid: string;
  comments: {
    uid: string;
    author: string | null | undefined;
    content: string;
    createdAt: string;
    modifiedAt: string;
  }[];
}

interface TinyCommentsCallbackRequest {
  conversationUid?: string;
  commentUid?: string;
  content?: string;
  createdAt?: string;
}

interface TinyCommentsFetchRequest {
  conversationUid: string;
}

const TinyMCEEditor = forwardRef<any, TinyMCEEditorProps>(({ 
  value, 
  onChange, 
  onSave, 
  onAutoSave, 
  disabled = false, 
  documentId,
  sharedUsers = [],
  userAccessLevel = 'edit'
}, ref) => {
  const editorRef = useRef<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedContentRef = useRef<string>('');
  const userRetryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Expose editor methods to parent component
  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    getBody: () => editorRef.current?.getBody(),
    getContent: () => editorRef.current?.getContent(),
    setContent: (content: string) => editorRef.current?.setContent(content),
    execCommand: (command: string, showUI?: boolean, value?: any) => editorRef.current?.execCommand(command, showUI, value),
    selection: editorRef.current?.selection,
    fire: (eventName: string, data?: any) => editorRef.current?.dispatch(eventName, data)
  }));

  // Determine if editor should be read-only
  const isReadOnly = disabled || userAccessLevel === 'view';

  // User loading with retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20; // Maximum 10 seconds of retries (20 * 500ms)
    
    const loadUser = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUserLoading(false);
        // Clear any pending retry
        if (userRetryTimeoutRef.current) {
          clearTimeout(userRetryTimeoutRef.current);
        }
      } else {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Failed to load user after maximum retries, falling back to read-only mode');
          setUserLoading(false);
          // Set a minimal user object to allow basic functionality
          setUser({ 
            displayName: 'Guest User',
            email: 'guest@example.com',
            getIdToken: () => Promise.resolve(null)
          });
          return;
        }
        
        // Retry after 500ms if user is not loaded
        userRetryTimeoutRef.current = setTimeout(loadUser, 500);
      }
    };

    loadUser();

    // Cleanup on unmount
    return () => {
      if (userRetryTimeoutRef.current) {
        clearTimeout(userRetryTimeoutRef.current);
      }
    };
  }, []);

  // Debounced auto-save functionality
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only auto-save if content has changed and we have a save function
    if (value !== lastSavedContentRef.current && onSave) {
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSave();
          lastSavedContentRef.current = value;
          // Notify parent of auto-save
          if (onAutoSave) {
            onAutoSave(new Date());
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 3000); // Auto-save 3 seconds after last change
    }

    // Cleanup timeout on component unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [value, onSave, onAutoSave]);

  // Initialize last saved content
  useEffect(() => {
    lastSavedContentRef.current = value;
  }, [value]);

  const currentAuthor = user?.displayName || user?.email;
  const currentAuthorAvatar = user?.photoURL;
  const userAllowedToResolve = currentAuthor;

  const randomString = () => crypto.getRandomValues(new Uint32Array(1))[0].toString(36).substring(2, 14);

  // Tiny Comments functions
  const tinycomments_create = async (
    req: TinyCommentsCallbackRequest, 
    done: (response: any) => void,
    fail: (error: Error) => void
  ) => {
    if (!documentId) {
      return fail(new Error('Create Comment - Document ID is not set'));
    }

    // Check if user is available and has edit access
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_create(req, done, fail);
        }, 1000);
        return;
      }
      console.error('User not available for comment creation');
      return fail(new Error('User authentication required. Please refresh the page and try again.'));
    }

    // Only allow comment creation for edit users
    if (userAccessLevel !== 'edit') {
      return fail(new Error('You only have view access to this document'));
    }

    try {
      const conversationUid = 'annotation-' + randomString();
      const commentUid = 'comment-' + randomString();
      const authorName = currentAuthor || '';
      
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/document/${documentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          content: req.content,
          author: currentAuthor,
          authorName: authorName,
          authorAvatar: currentAuthorAvatar,
          document_id: documentId,
          conversationUid,
          commentUid
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create comment');
      }

      // Handle mentions
      const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
      const mentions = req.content?.match(mentionRegex) || [];
      const mentionedUsers = mentions.map((mention: string) => mention.substring(1));

      if (mentionedUsers.length > 0) {
        // Auto-grant access to mentioned users
        for (const mentionedEmail of mentionedUsers) {
          await autoGrantAccess(mentionedEmail);
        }

        // Send mention notifications
        fetch(`/api/notifications/mentions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            documentId: documentId,
            mentionedUsers: mentionedUsers,
            commentContent: req.content,
            author: currentAuthor,
            conversationUid: conversationUid
          })
        }).catch(error => {
          console.error('Failed to send mention notifications:', error);
        });
      }
      
      done({ 
        conversationUid: conversationUid,
        commentUid: commentUid,
        author: currentAuthor,
        authorName: authorName,
        authorAvatar: currentAuthorAvatar,
        content: req.content,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      fail(new Error('Failed to create comment: ' + (error as Error).message));
    }
  };

  const tinycomments_fetch = async(conversationUids: string[], done: any, fail: any) => {
    if (!documentId) {
      return fail(new Error('Fetch Comment - Document ID is not set'));
    }

    // Check if user is available
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_fetch(conversationUids, done, fail);
        }, 1000);
        return;
      }
      return done({ conversations: {} });
    }

    try {
      const validUids = conversationUids.filter(uid => uid !== '' && uid.indexOf('tmp_') === -1);
      
      if (validUids.length === 0) {
        return done({ conversations: {} });
      }

      const idToken = await user.getIdToken();
      if (!idToken) {
        return done({ conversations: {} });
      }

      const response = await fetch(`/api/document/${documentId}/comments?conversation_uids=${validUids.join(',')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      const conversationsArray = Array.isArray(data) ? data : [];
      
      const fetchedConversations = conversationsArray.reduce((acc: Record<string, Conversation>, item: any) => {
        if (item && item.conversation && item.conversation.uid) {
          acc[item.conversation.uid] = {
            uid: item.conversation.uid,
            comments: Array.isArray(item.conversation.comments) ? item.conversation.comments.map((comment: any) => {
              const authorName = comment.author || '';
              return {
                uid: comment.uid || `comment-${Math.random().toString(36).substring(2, 15)}`,
                author: authorName,
                authorName: authorName,
                authorAvatar: comment.authorAvatar || '',
                content: comment.content || '',
                createdAt: comment.createdAt || new Date().toISOString(),
                modifiedAt: comment.modifiedAt || new Date().toISOString()
              };
            }) : []
          };
        }
        return acc;
      }, {});

      done({ conversations: fetchedConversations });
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Return empty conversations instead of failing
      done({ conversations: {} });
    }
  };
  
  const tinycomments_reply = async (req: any, done: any, fail: any) => {
    const { conversationUid, content, createdAt } = req;
    const authorName = currentAuthor || '';

    // Check if user is available and has edit access
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_reply(req, done, fail);
        }, 1000);
        return;
      }
      return fail(new Error('User not loaded yet'));
    }

    // Only allow comment replies for edit users
    if (userAccessLevel !== 'edit') {
      return fail(new Error('You only have view access to this document'));
    }

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/document/${documentId}/comments/${conversationUid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          content: content, 
          createdAt: createdAt, 
          author: currentAuthor,
          authorName: authorName,
          authorAvatar: currentAuthorAvatar
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reply to comment');
      }

      const data = await response.json();
      const commentUid = data.commentUid;

      // Handle mentions
      const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
      const mentions = content.match(mentionRegex) || [];
      const mentionedUsers = mentions.map((mention: string) => mention.substring(1));

      if (mentionedUsers.length > 0) {
        // Auto-grant access to mentioned users
        for (const mentionedEmail of mentionedUsers) {
          await autoGrantAccess(mentionedEmail);
        }

        // Send mention notifications
        fetch(`/api/notifications/mentions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            documentId: documentId,
            mentionedUsers: mentionedUsers,
            commentContent: content,
            author: currentAuthor,
            conversationUid: conversationUid
          })
        }).catch(error => {
          console.error('Failed to send mention notifications:', error);
        });
      }

      done({
        commentUid: commentUid,
        author: currentAuthor,
        authorName: authorName,
        authorAvatar: currentAuthorAvatar
      });
    } catch (error) {
      console.error('Error replying to comment:', error);
      fail(error);
    }
  };
  
  const tinycomments_delete = async (req: any, done: any) => {
    // Check if user is available
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_delete(req, done);
        }, 1000);
        return;
      }
      return done({ canDelete: false, reason: 'User not loaded yet' });
    }

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        return done({ canDelete: false, reason: 'No authentication token' });
      }

      await fetch(`/api/document/${documentId}/comments/${req.conversationUid}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        method: 'DELETE',
      });
      done({ canDelete: true });
    } catch (error) {
      done({ canDelete: false, reason: 'Failed to delete comment' });
    }
  };
  
  const tinycomments_resolve = async (req: any, done: any) => {
    // Check if user is available
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_resolve(req, done);
        }, 1000);
        return;
      }
      return done({ canResolve: false, reason: 'User not loaded yet' });
    }

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        return done({ canResolve: false, reason: 'No authentication token' });
      }

      await fetch(`/api/document/${documentId}/comments/${req.conversationUid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });
      done({ canResolve: true });
    } catch (error) {
      done({ canResolve: false, reason: 'Failed to resolve comment' });
    }
  };
  
  const tinycomments_delete_comment = async (req: any, done: any) => {
    // Check if user is available
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_delete_comment(req, done);
        }, 1000);
        return;
      }
      return done({ canDelete: false, reason: 'User not loaded yet' });
    }

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        return done({ canDelete: false, reason: 'No authentication token' });
      }

      await fetch(`/api/document/${documentId}/comments/${req.conversationUid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });
      done({ canDelete: true });
    } catch (error) {
      done({ canDelete: false, reason: 'Failed to delete comment' });
    }
  };
  
  const tinycomments_edit_comment = async (req: any, done: any) => {
    // Check if user is available
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_edit_comment(req, done);
        }, 1000);
        return;
      }
      return done({ canEdit: false, reason: 'User not loaded yet' });
    }

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        return done({ canEdit: false, reason: 'No authentication token' });
      }

      await fetch(`/api/document/${documentId}/comments/${req.conversationUid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ content: req.content }),
      });
      done({ canEdit: true });
    } catch (error) {
      done({ canEdit: false, reason: 'Failed to edit comment' });
    }
  };
  
  const tinycomments_delete_all = async (req: any, done: any) => {
    // Check if user is available
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_delete_all(req, done);
        }, 1000);
        return;
      }
      return done({ canDelete: false, reason: 'User not loaded yet' });
    }

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        return done({ canDelete: false, reason: 'No authentication token' });
      }

      // Delete all comments in the conversation
      await fetch(`/api/document/${documentId}/comments/${req.conversationUid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });
      done({ canDelete: true });
    } catch (error) {
      done({ canDelete: false, reason: 'Failed to delete all comments' });
    }
  };
  
  const tinycomments_lookup = async (
    req: TinyCommentsFetchRequest, 
    done: (response: { conversation: Conversation }) => void
  ) => {
    // Check if user is available
    if (!user) {
      if (userLoading) {
        // User is still loading, retry after a short delay
        setTimeout(() => {
          tinycomments_lookup(req, done);
        }, 1000);
        return;
      }
      return done({ conversation: { uid: '', comments: [] } });
    }

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        return done({ conversation: { uid: '', comments: [] } });
      }

      const response = await fetch(`/api/document/${documentId}/comments/${req.conversationUid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comment');
      }

      const data = await response.json();
      const conversation: any = { 
        conversation: {
          uid: data.conversation_uid,
          comments: data.comments
        }
      };
      done(conversation);
    } catch (error) {
      console.error('Error fetching comment:', error);
      done({ conversation: { uid: '', comments: [] } });
    }
  };
  
  const tinycomments_fetch_author_info = (done: any) => done({
    author: currentAuthor,
    authorName: currentAuthor,
    authorAvatar: currentAuthorAvatar || ''
  });

  // Fetch users for mentions
  async function fetchUsers(query: any) {
    try {
      // Check if user is available
      if (!user) {
        if (userLoading) {
          // User is still loading, return empty array for now
          // TinyMCE will retry automatically
          return [];
        }
        return [];
      }

      const idToken = await user.getIdToken();
      if (!idToken) {
        return [];
      }

      const response = await fetch(`/api/document/${documentId}/users`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const users = data.users || [];

      // Handle both string and object query parameters
      const searchTerm = typeof query === 'string' ? query : query?.term;
      
      // Filter by search term if provided
      if (searchTerm) {
        return users.filter((user: any) => 
          user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return users;
    } catch (error) {
      return [];
    }
  }

  // Auto-grant access when mentioning users without access
  const autoGrantAccess = async (mentionedEmail: string) => {
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        return;
      }

      // Check if user already has access
      const response = await fetch(`/api/document/${documentId}/users`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        const hasAccess = users.some((u: any) => u.email === mentionedEmail);
        
        if (!hasAccess) {
          // Grant view access
          await fetch(`/api/document/${documentId}/share`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              email: mentionedEmail,
              access: 'view'
            })
          });
        }
      }
    } catch (error) {
      // Handle error silently in production
    }
  };

  return (
    <>
      {userLoading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading editor...</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Editor
            key={`editor-${user?.email || 'guest'}`}
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            onInit={(evt, editor) => editorRef.current = editor}
            value={value}
            onEditorChange={onChange}
            disabled={isReadOnly}
            init={{
              onboarding: false,
              height: 600,
              menubar: isReadOnly ? 'view help' : 'file edit view insert format tools tc help',
              plugins: isReadOnly 
                ? ['preview', 'fullscreen', 'wordcount', 'tinycomments']
                : [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                    'save', 'tinycomments', 'mentions', 'importword', 'exportword', 'exportpdf'
                  ],
              menu: isReadOnly ? {
                view: { title: 'View', items: 'preview fullscreen | showcomments' },
                help: { title: 'Help', items: 'help' }
              } : {
                file: { title: 'File', items: 'newdocument restoredraft | preview | importword exportword exportpdf | print | deleteallconversations' },
                edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace' },
                view: { title: 'View', items: 'code | visualaid visualchars visualblocks | spellchecker | preview fullscreen | showcomments' },
                insert: { title: 'Insert', items: 'image link media addcomment | charmap emoticons hr | insertdatetime' },
                format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript codeformat | styles blocks fontfamily fontsize align lineheight | forecolor backcolor | language | removeformat' },
                tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | a11ycheck code wordcount' },
                help: { title: 'Help', items: 'help' },
                tc: {
                  title: 'Comment',
                  items: 'addcomment showcomments deleteallconversations'
                }
              },
              toolbar: isReadOnly 
                ? 'preview fullscreen | help showcomments'
                : 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | save | importword exportword exportpdf | help addcomment showcomments',
              content_style: `
                body { 
                  font-family:Helvetica,Arial,sans-serif; 
                  font-size:14px;
                  background: #f5f5f5;
                  padding: 20px;
                }
                .mce-content-body {
                  background: white;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  max-width: 800px;
                  margin: 0 auto;
                }
                .mention {
                  background-color: #e8f4ff;
                  padding: 2px 4px;
                  border-radius: 3px;
                  border: 1px solid #bce0ff;
                  font-weight: 500;
                  display: inline-block;
                  cursor: pointer;
                }
                .mention:hover {
                  background-color: #d8ecff;
                }
              `,
              save_onsavecallback: onSave,
              autosave_interval: '30s',
              autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
              autosave_restore_when_empty: false,
              autosave_retention: '1440m', // 24 hours
              branding: false,
              elementpath: false,
              resize: true,
              statusbar: true,
              paste_data_images: true,
              images_upload_url: '/api/upload-image', // You can implement this later
              images_upload_handler: (blobInfo: any, progress: any) => {
                return new Promise((resolve, reject) => {
                  // For now, just reject image uploads
                  reject('Image upload not implemented yet');
                });
              },
              // Tiny Comments configuration - only configure when user is loaded
              tinycomments_mode: 'callback',
              tinycomments_create,
              tinycomments_reply,
              tinycomments_delete,
              tinycomments_resolve,
              tinycomments_delete_comment,
              tinycomments_edit_comment,
              tinycomments_delete_all,
              tinycomments_lookup,
              tinycomments_fetch,
              tinycomments_fetch_author_info,
              tinycomments_author: currentAuthor,
              tinycomments_can_resolve: () => userAllowedToResolve !== null,
              // Mentions configuration
              mentions_selector: '.mention',
              mentions_min_chars: 1,
              mentions_fetch: async (query: string, success: Function) => {
                try {
                  const users = await fetchUsers(query);
                  success(users);
                } catch (error) {
                  console.error('Error fetching users for mentions:', error);
                  success([]);
                }
              },
              mentions_menu_hover: (userInfo: any, success: Function) => {
                const html = `
                  <div style="padding: 10px;">
                    <div style="font-weight: bold;">${userInfo.name}</div>
                  </div>
                `;
                success(html);
              },
              mentions_select: (mention: any, success: Function) => {
                const html = `<span class="mention" data-mention-id="${mention.id}">@${mention.name}</span>`;
                success(html);
              },
              setup: (editor: any) => {
                // Notify when editor is ready
                editor.on('init', () => {
                  if (user && user.email !== 'guest@example.com') {
                    if (editor.notificationManager && editor.notificationManager.open) {
                      editor.notificationManager.open({
                        text: 'Editor ready - Comments available',
                        type: 'success',
                        timeout: 2000
                      });
                    }
                  }
                });

                // Add custom save button
                editor.ui.registry.addButton('save', {
                  text: 'Save',
                  tooltip: 'Save document',
                  onAction: () => {
                    if (onSave) {
                      onSave();
                    }
                  }
                });

                // Add keyboard shortcut for save (Ctrl+S)
                editor.addShortcut('meta+s', 'Save document', () => {
                  if (onSave) {
                    onSave();
                  }
                });

                // Handle DOCX import
                editor.on('ImportWord', async (e: any) => {
                  try {
                    // TinyMCE handles the DOCX import internally
                    // We just need to save the content after import
                    if (onSave) {
                      await onSave();
                    }
                    
                    // Show success message
                    if (editor.notificationManager && editor.notificationManager.open) {
                      editor.notificationManager.open({
                        text: 'DOCX file imported successfully',
                        type: 'success',
                        timeout: 3000
                      });
                    }

                  } catch (error) {
                    console.error('Error importing DOCX:', error);
                    if (editor.notificationManager && editor.notificationManager.open) {
                      editor.notificationManager.open({
                        text: 'Failed to import DOCX file',
                        type: 'error',
                        timeout: 3000
                      });
                    }
                  }
                });

                // Handle DOCX export
                editor.on('ExportWord', async (e: any) => {
                  try {
                    const content = editor.getContent();
                    const documentName = e.documentName || 'document';

                    const idToken = await user?.getIdToken();
                    if (!idToken) {
                      console.error('No authentication token');
                      return;
                    }

                    // Send content to backend for DOCX generation
                    const response = await fetch(`/api/document/${documentId}/export-docx`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`,
                      },
                      body: JSON.stringify({
                        content,
                        documentName
                      })
                    });

                    if (!response.ok) {
                      throw new Error('Failed to export DOCX file');
                    }

                    // Get the blob from response
                    const blob = await response.blob();
                    
                    // Create download link
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${documentName}.docx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    // Show success message
                    if (editor.notificationManager && editor.notificationManager.open) {
                      editor.notificationManager.open({
                        text: 'DOCX file exported successfully',
                        type: 'success',
                        timeout: 3000
                      });
                    }

                  } catch (error) {
                    console.error('Error exporting DOCX:', error);
                    if (editor.notificationManager && editor.notificationManager.open) {
                      editor.notificationManager.open({
                        text: 'Failed to export DOCX file',
                        type: 'error',
                        timeout: 3000
                      });
                    }
                  }
                });

                // Handle AI comment creation
                editor.on('mceAiComment', async (e: any) => {
                  // Set loading state to prevent user interaction
                  setIsCreatingComment(true);
                  
                  try {
                    const revealAdditionalToolbarButton = document.querySelector('[data-mce-name="overflow-button"]');
                    
                    let addCommentButton = document.querySelector('[data-mce-name="addcomment"]');
                    
                    if (addCommentButton == null) {
                      if (revealAdditionalToolbarButton instanceof HTMLElement) {
                        revealAdditionalToolbarButton.click();
                        
                        // Wait 1 second for overflow to open
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        addCommentButton = document.querySelector('[data-mce-name="addcomment"]');
                      }
                    }

                    if (addCommentButton instanceof HTMLElement) {
                      addCommentButton.click();
                      
                      // Wait 1 second for dialog to appear
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      const commentDialog = document.querySelector('.tox-comment--selected');
                      
                      if (commentDialog) {
                        // Look for comment input and fill it
                        const commentInput = commentDialog.querySelector('.tox-textarea');
                        
                        if (commentInput instanceof HTMLTextAreaElement) {
                          // Get the suggestion from the event
                          const suggestions = e.suggestions || [];
                          const suggestion = suggestions[0]?.suggestion || 'AI Review Comment';
                          
                          commentInput.value = suggestion;
                          commentInput.dispatchEvent(new Event('input', { bubbles: true }));
                          
                          // Wait 1 second before looking for save button
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          
                          // Look for save button and click it
                          const saveButton = commentDialog.querySelector('.tox-comment__edit button:nth-child(2)');
                          
                          if (saveButton instanceof HTMLElement) {
                            saveButton.click();
                            
                            // Wait 1 second for comment to be saved
                            await new Promise(resolve => setTimeout(resolve, 1000));
                          }
                        }
                      }
                    }
                  } catch (error) {
                    // Handle error silently in production
                  } finally {
                    // Always clear loading state when done
                    setIsCreatingComment(false);
                  }
                });
              }
            }}
          />
          
          {/* Loading overlay */}
          {isCreatingComment && (
            <div className="absolute inset-0 bg-white bg-opacity-98 dark:bg-gray-900 dark:bg-opacity-98 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Creating AI Comment...</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Please wait while the comment is being added</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
});

export default TinyMCEEditor; 