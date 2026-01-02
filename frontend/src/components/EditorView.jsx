import { Button, Avatar } from './UI';
import { useState } from 'react';
import { RichTextEditor } from './Editor';

export function EditorView({ username, roomName, content, setContent, users, onLeave, serverPort }) {
  const [showUserPanel, setShowUserPanel] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Extract text from HTML for character/word count
  const getTextFromHTML = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const plainText = getTextFromHTML(content);
  const characterCount = plainText.length;
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="flex h-screen flex-col bg-white relative">
      {/* User Panel Sidebar */}
      {showUserPanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 transition-opacity"
            onClick={() => setShowUserPanel(false)}
          />
          
          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 border-l border-gray-200 flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Active Users</h2>
              <button 
                onClick={() => setShowUserPanel(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* User List */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {users.map((user, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar name={user.username || user} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.username || user}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-gray-500">Active now</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Panel Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="text-xs text-gray-600 text-center">
                {users.length} {users.length === 1 ? 'person' : 'people'} in this room
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold leading-none">{roomName}</h1>
            <span className="text-[11px] text-gray-500">Last edited just now</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connected Users */}
          <button 
            onClick={() => setShowUserPanel(true)}
            className="flex -space-x-2 mr-4 hover:scale-105 transition-transform cursor-pointer"
            title="View all users"
          >
            {users.slice(0, 5).map((user, idx) => (
              <div
                key={idx}
                className="relative group"
              >
                <Avatar name={user.username || user} />
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white ring-1 ring-black/5">
                +{users.length - 5}
              </div>
            )}
          </button>

          <div className="h-8 w-px bg-gray-200 mx-2" />

          {/* Action Buttons */}
          <button className="h-9 w-9 rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors">
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="h-9 px-4 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <Button variant="text" onClick={onLeave} className="h-9 px-4">
            Leave
          </Button>
        </div>
      </header>

      {/* Toolbar - Now part of RichTextEditor */}
      <div className="flex h-12 items-center gap-1 border-b px-4 bg-gray-50/50">
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          File
        </div>
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          Edit
        </div>
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          View
        </div>
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          Insert
        </div>
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          Format
        </div>
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          Tools
        </div>
      </div>

      {/* Content Area with Rich Text Editor */}
      <main className="flex-1 overflow-hidden">
        <RichTextEditor 
          content={content}
          onChange={setContent}
          placeholder="Start typing..."
        />
      </main>

      {/* Footer */}
      <footer className="flex h-8 items-center justify-between border-t bg-white px-4 text-[10px] text-gray-600">
        <div className="flex items-center gap-4">
          <span className="font-medium">{roomName}</span>
          <span>Characters: {characterCount}</span>
          <span>Words: {wordCount}</span>
          <span>{users.length} {users.length === 1 ? 'user' : 'users'} connected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Connected to Port: {serverPort}</span>
        </div>
      </footer>
    </div>
  );
}