import { Button, Avatar } from './UI';
import { useState, useEffect } from 'react';
import { RichTextEditor } from './Editor';
import { ZoomControls } from './Editor/ZoomControls';
import { KeyboardShortcutsModal } from './Editor/KeyboardShortcutsModal';

export function EditorView({ username, roomName, content, setContent, users, onLeave, serverPort, userRole, token }) {
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [roomUsers, setRoomUsers] = useState([]);
  
  const handleInviteClick = () => {
    setShowInviteModal(true);
  };

  // Fetch room users with roles
  useEffect(() => {
    fetchRoomUsers();
  }, [roomName]);

  const fetchRoomUsers = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/rooms/${encodeURIComponent(roomName)}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoomUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch room users:', error);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: roomName,
          invited_email: inviteEmail,
          role: inviteRole
        })
      });
      
      if (response.ok) {
        alert('Invitation sent successfully!');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('editor');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send invitation');
      }
    } catch (error) {
      alert('Failed to send invitation');
    }
  };

  const isReadOnly = userRole === 'viewer';

  // Listen for shortcuts modal trigger
  useEffect(() => {
    const handleShowShortcuts = () => setShowShortcuts(true);
    window.addEventListener('show-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-shortcuts', handleShowShortcuts);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />

      {/* Invite Modal */}
      {showInviteModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowInviteModal(false)}
          />
          
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Invite User to Room</h2>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Level
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="editor">Editor - Can edit the document</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Invitation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* User Panel Sidebar */}
      {showUserPanel && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40 transition-opacity"
            onClick={() => setShowUserPanel(false)}
          />
          
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 border-l border-gray-200 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Room Users</h2>
              <button 
                onClick={() => setShowUserPanel(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {roomUsers.map((user, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar name={user.username} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {user.is_online && (
                          <>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-500">Active now</span>
                          </>
                        )}
                        {!user.is_online && (
                          <span className="text-xs text-gray-400">Offline</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'editor' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="text-xs text-gray-600 text-center mb-3">
                {roomUsers.length} {roomUsers.length === 1 ? 'person' : 'people'} with access
              </div>
              {(userRole === 'owner' || userRole === 'editor') && (
                <button
                  onClick={() => {
                    setShowUserPanel(false);
                    setShowInviteModal(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Invite User
                </button>
              )}
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
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold leading-none">{roomName.split('/').pop()}</h1>
              {isReadOnly && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Read-only
                </span>
              )}
              {userRole && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  userRole === 'owner' ? 'bg-purple-100 text-purple-800' :
                  userRole === 'editor' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {userRole}
                </span>
              )}
            </div>
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
              <div key={idx} className="relative group">
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
          <button 
            onClick={() => setShowShortcuts(true)}
            className="h-9 w-9 rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Keyboard shortcuts (Ctrl+/)"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          {(userRole === 'owner' || userRole === 'editor') && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="h-9 px-4 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-colors"
              title="Invite users to this room"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
          <Button variant="text" onClick={onLeave} className="h-9 px-4">
            Leave
          </Button>
        </div>
      </header>

      {/* Menu Bar */}
      <div className="flex h-12 items-center gap-1 border-b px-4 bg-gray-50/50">
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          File
        </div>
        <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors">
          Edit
        </div>
        
        {/* View Menu with Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm font-medium text-gray-700 transition-colors"
          >
            View
          </div>
          
          {showViewMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowViewMenu(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-20">
                <button
                  onClick={() => {
                    setShowLineNumbers(!showLineNumbers);
                    setShowViewMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span>Show line numbers</span>
                  {showLineNumbers && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => {
                    setZoom(100);
                    setShowViewMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                >
                  Reset zoom
                </button>
              </div>
            </>
          )}
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
        {isReadOnly && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            You have view-only access to this document. Ask the owner for editor access to make changes.
          </div>
        )}
        <RichTextEditor 
          content={content}
          onChange={setContent}
          placeholder={isReadOnly ? "This document is read-only" : "Start typing..."}
          showLineNumbers={showLineNumbers}
          zoom={zoom}
          readOnly={isReadOnly}
          userRole={userRole}
          onInvite={handleInviteClick}
        />
      </main>

      {/* Zoom Controls */}
      <ZoomControls zoom={zoom} onZoomChange={setZoom} />

      {/* Footer */}
      <footer className="flex h-8 items-center justify-between border-t bg-white px-4 text-[10px] text-gray-600">
        <div className="flex items-center gap-4">
          <span className="font-medium">{roomName.split('/').pop()}</span>
          <span>Characters: {characterCount.toLocaleString()}</span>
          <span>Words: {wordCount.toLocaleString()}</span>
          <span>{users.length} {users.length === 1 ? 'user' : 'users'} connected</span>
          <span>Zoom: {zoom}%</span>
          {userRole && (
            <span className="capitalize">Role: {userRole}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Connected to Port: {serverPort}</span>
        </div>
      </footer>
    </div>
  );
}
