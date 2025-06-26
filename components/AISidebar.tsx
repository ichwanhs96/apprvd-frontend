'use client';

import { useState } from 'react';
import { apiCall } from '@/lib/api';

interface AISidebarProps {
  documentId: string;
  documentContent: string;
  documentName: string;
  isOpen: boolean;
  onToggle: () => void;
  onAddComment?: (position: { start: number; end: number }, message: string) => void;
  editorRef?: React.RefObject<any>;
  isCreatingComment?: boolean;
  userAccessLevel?: 'view' | 'edit';
}

export default function AISidebar({ 
  documentId, 
  documentContent, 
  documentName, 
  isOpen, 
  onToggle,
  onAddComment,
  editorRef,
  isCreatingComment = false,
  userAccessLevel
}: AISidebarProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'review'>('summary');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [processingLongDocument, setProcessingLongDocument] = useState(false);
  const [commentedSuggestions, setCommentedSuggestions] = useState<Set<string>>(new Set());

  // Ensure view-only users can only access summary tab
  const handleTabChange = (tab: 'summary' | 'review') => {
    if (userAccessLevel === 'view' && tab === 'review') {
      // Redirect view-only users to summary tab
      setActiveTab('summary');
      return;
    }
    setActiveTab(tab);
  };

  // Estimate if document is long (rough approximation)
  const isLongDocument = documentContent.length > 12000; // ~4000 tokens (more conservative)

  const handleSummarize = async () => {
    if (!documentContent.trim()) {
      setError('Document is empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProcessingLongDocument(isLongDocument);
      
      const response = await apiCall(`/ai/summarize`, {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          content: documentContent,
          documentName
        })
      });

      setSummary(response.summary);
    } catch (error: any) {
      if (error.message?.includes('OpenAI API key not configured')) {
        setError('AI features are not configured. Please contact your administrator.');
      } else {
        setError(error.message || 'Failed to generate summary');
      }
    } finally {
      setLoading(false);
      setProcessingLongDocument(false);
    }
  };

  const handleReview = async () => {
    if (!documentContent.trim()) {
      setError('Document is empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProcessingLongDocument(isLongDocument);
      
      // Clear previous commented suggestions when starting a new review
      setCommentedSuggestions(new Set());
      
      const response = await apiCall(`/ai/review`, {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          content: documentContent,
          documentName
        })
      });

      setSuggestions(response.suggestions);
    } catch (error: any) {
      if (error.message?.includes('OpenAI API key not configured')) {
        setError('AI features are not configured. Please contact your administrator.');
      } else {
        setError(error.message || 'Failed to review document');
      }
    } finally {
      setLoading(false);
      setProcessingLongDocument(false);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'compliance':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'legal_risk':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'data_protection':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'regulatory':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'clarity':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'structure':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getSuggestionColor = (type: string) => {
    const baseColors = {
      compliance: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      legal_risk: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      data_protection: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      regulatory: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      clarity: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      structure: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
    };
    
    return baseColors[type as keyof typeof baseColors] || baseColors.structure;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'compliance':
        return 'Compliance';
      case 'legal_risk':
        return 'Legal Risk';
      case 'data_protection':
        return 'Data Protection';
      case 'regulatory':
        return 'Regulatory';
      case 'clarity':
        return 'Clarity';
      case 'structure':
        return 'Structure';
      default:
        return type;
    }
  };

  // Calculate position of highlighted text in TinyMCE editor
  const calculateTextPosition = (highlightedText: string): { start: number; end: number } | null => {
    // Get the TinyMCE editor instance from the ref
    const editor = editorRef?.current?.getEditor?.();
    
    if (!editor) {
      return null;
    }

    try {
      // Get the text content from TinyMCE (not HTML)
      const textContent = editor.getContent({ format: 'text' });
      
      if (!textContent) {
        return null;
      }

      // Find the position of the highlighted text
      let startIndex = textContent.indexOf(highlightedText);
      
      if (startIndex === -1) {
        // Fallback: Try to find partial matches
        const words = highlightedText.split(/\s+/).filter(word => word.length > 3);
        if (words.length > 1) {
          // Try to find the longest consecutive sequence of words
          for (let i = words.length; i >= 2; i--) {
            for (let j = 0; j <= words.length - i; j++) {
              const phrase = words.slice(j, j + i).join(' ');
              const phraseIndex = textContent.indexOf(phrase);
              if (phraseIndex !== -1) {
                startIndex = phraseIndex;
                highlightedText = phrase;
                break;
              }
            }
            if (startIndex !== -1) break;
          }
        }
        
        // If still not found, try to find the longest word
        if (startIndex === -1 && words.length > 0) {
          const longestWord = words.reduce((longest, current) => 
            current.length > longest.length ? current : longest
          );
          startIndex = textContent.indexOf(longestWord);
          if (startIndex !== -1) {
            highlightedText = longestWord;
          }
        }
        
        if (startIndex === -1) {
          return null;
        }
      }

      const position = {
        start: startIndex,
        end: startIndex + highlightedText.length
      };

      return position;
    } catch (error) {
      return null;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-20 right-4 z-40 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-gray-700 dark:text-white ${
          isOpen ? 'rotate-180' : ''
        }`}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 border-l dark:border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out z-30 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-black dark:text-white">AI Assistant</h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-white"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => handleTabChange('summary')}
            className={`py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            style={{ flex: 1 }}
          >
            Summary
          </button>
          {userAccessLevel === 'edit' && (
            <button
              onClick={() => handleTabChange('review')}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'review'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              style={{ flex: 1 }}
            >
              Review
            </button>
          )}
        </div>

        {/* Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === 'summary' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">Document Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Generate a concise summary of your document using AI.
                </p>
                
                {isLongDocument && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium">Long Document Detected</p>
                        <p>This document will be processed using semantic chunking for better results.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleSummarize}
                  disabled={loading || !documentContent.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {processingLongDocument ? 'Processing long document...' : 'Generating...'}
                    </div>
                  ) : 'Generate Summary'}
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {!summary && !loading && !error && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mx-auto mb-4 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Click "Generate Summary" to get started</p>
                </div>
              )}

              {summary && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-black dark:text-white mb-2">Summary</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {summary}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">Document Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get AI-powered suggestions for improving your document.
                </p>
                
                {isLongDocument && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium">Long Document Detected</p>
                        <p>This document will be processed using semantic chunking for better results.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleReview}
                  disabled={loading || !documentContent.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {processingLongDocument ? 'Processing long document...' : 'Reviewing...'}
                    </div>
                  ) : 'Review Document'}
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {!suggestions.length && !loading && !error && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mx-auto mb-4 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm">Click "Review Document" to get suggestions</p>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-black dark:text-white">Legal Review Findings ({suggestions.length})</h4>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id || index}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border-l-4 border-blue-500"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded-full ${getSuggestionColor(suggestion.type)}`}>
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {getTypeLabel(suggestion.type)}
                            </div>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(suggestion.severity)}`}>
                              {suggestion.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {suggestion.message}
                          </p>
                          
                          {suggestion.highlightedText && (
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-xs text-gray-700 dark:text-gray-300 mb-2">
                              <span className="font-medium">Highlighted text:</span> &ldquo;{suggestion.highlightedText}&rdquo;
                            </div>
                          )}
                          
                          {suggestion.euRegulation && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                              <span className="font-medium">EU Regulation:</span> {suggestion.euRegulation}
                            </div>
                          )}
                          
                          {suggestion.recommendation && (
                            <div className="text-xs text-green-600 dark:text-green-400 mb-2">
                              <span className="font-medium">Recommendation:</span> {suggestion.recommendation}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {suggestion.highlightedText && onAddComment && !commentedSuggestions.has(suggestion.id || index.toString()) && (
                              <button
                                onClick={() => {
                                  const position = calculateTextPosition(suggestion.highlightedText);
                                  if (position) {
                                    // Mark this suggestion as commented on
                                    setCommentedSuggestions(prev => new Set([...prev, suggestion.id || index.toString()]));
                                    onAddComment(position, suggestion.message);
                                  }
                                }}
                                disabled={isCreatingComment}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  isCreatingComment 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                {isCreatingComment ? 'Adding...' : 'Add Comment'}
                              </button>
                            )}
                            {commentedSuggestions.has(suggestion.id || index.toString()) && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded flex items-center gap-1">
                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Comment Added
                              </span>
                            )}
                            {suggestion.highlightedText && (
                              <button
                                onClick={() => {
                                  // Scroll to the highlighted text in the editor
                                  const position = calculateTextPosition(suggestion.highlightedText);
                                  if (position) {
                                    const event = new CustomEvent('scrollToPosition', {
                                      detail: position
                                    });
                                    window.dispatchEvent(event);
                                  }
                                }}
                                disabled={isCreatingComment}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  isCreatingComment 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                                }`}
                              >
                                Go to Text
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 