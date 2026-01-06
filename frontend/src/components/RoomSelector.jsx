import { useState, useEffect } from 'react'
import { Button, Input } from './UI'
import { AdminPanel } from './AdminPanel'

export function RoomSelector({ username, onJoinRoom, onSignOut, serverPort }) {
  const [roomName, setRoomName] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUserRooms();
    fetchInvitations();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.is_admin || false);
        localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false');
        console.log('Admin status updated:', data.is_admin);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const fetchUserRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ room_name: roomName.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        onJoinRoom(data.room_id);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create room');
      }
    } catch (error) {
      alert('Failed to create room');
    }
  };

  const handleAcceptInvitation = async (inviteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/invitations/${inviteId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        fetchUserRooms();
        fetchInvitations();
        alert('Invitation accepted! You can now access the room.');
      }
    } catch (error) {
      alert('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (inviteId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://127.0.0.1:${serverPort}/api/invitations/${inviteId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchInvitations();
    } catch (error) {
      alert('Failed to decline invitation');
    }
  };

  const handleJoin = (roomId) => {
    onJoinRoom(roomId);
  };

  const handleDeleteRoom = async (roomId, roomName, e) => {
    e.stopPropagation(); // Prevent triggering the room join
    
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/rooms/${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Refresh room list
        fetchUserRooms();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to delete room');
      }
    } catch (error) {
      alert('Failed to delete room');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="pt-8 pb-6 px-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-green-100 p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-1">
              Welcome back, {username}
            </h1>
            <p className="text-sm text-gray-600 text-center">Select a room or create a new one</p>
          </div>
          
          {/* Invitations Badge */}
          {invitations.length > 0 && (
            <div className="mx-8 mb-4">
              <button
                onClick={() => setShowInvitations(!showInvitations)}
                className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">
                    {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <svg className={`w-5 h-5 text-blue-600 transition-transform ${showInvitations ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* Invitations List */}
          {showInvitations && invitations.length > 0 && (
            <div className="mx-8 mb-4 space-y-2">
              {invitations.map((invite) => (
                <div key={invite.invite_id} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{invite.room_name}</p>
                      <p className="text-sm text-gray-600">
                        from <span className="font-medium">{invite.invited_by_username}</span>
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        invite.role === 'editor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {invite.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAcceptInvitation(invite.invite_id)}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(invite.invite_id)}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Create Room Button */}
          <div className="px-8 pb-4">
            <Button 
              variant="primary" 
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              className="w-full py-2.5 font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Room
            </Button>
          </div>

          {/* Create Room Form */}
          {showCreateRoom && (
            <div className="px-8 pb-4">
              <form onSubmit={handleCreateRoom} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Room Name</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <Input
                      placeholder="my-document"
                      className="w-full pl-10"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    variant="primary"
                    className="flex-1"
                    disabled={!roomName.trim()}
                  >
                    Create & Join
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Rooms */}
          <div className="px-8 pb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">My Rooms</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm">No rooms yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rooms.map((room) => (
                  <div
                    key={room.room_id}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                  >
                    <button
                      onClick={() => handleJoin(room.room_id)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{room.room_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            room.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                            room.role === 'editor' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {room.role}
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {room.role === 'owner' && (
                        <button
                          onClick={(e) => handleDeleteRoom(room.room_id, room.room_name, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete room"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </button>
              )}
              <button
                onClick={onSignOut}
                className="flex-1 text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel
          token={localStorage.getItem('token')}
          serverPort={serverPort}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}
