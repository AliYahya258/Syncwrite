import { useState } from 'react'
import { Button, Input } from './UI'

export function RoomSelector({ username, onJoinRoom, onSignOut }) {
  const [roomName, setRoomName] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      onJoinRoom(roomName.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
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
            <p className="text-sm text-gray-600 text-center">Enter a room name to start collaborating</p>
          </div>
          
          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Room Name</label>
                <div className="relative">
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <Input
                    id="room-name"
                    placeholder="marketing-sync"
                    className="w-full pl-10"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoin(e)}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                variant="primary" 
                disabled={!roomName.trim()}
                className="w-full py-2.5 font-medium flex items-center justify-center group"
              >
                Join Room
                <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4">
            <button
              onClick={onSignOut}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
