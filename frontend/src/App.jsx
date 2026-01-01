import { useState, useEffect, useRef } from 'react'
import { Auth } from './components/Auth'
import { RoomSelector } from './components/RoomSelector'
import { EditorView } from './components/EditorView'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [content, setContent] = useState("");
  const [users, setUsers] = useState([]);
  const ws = useRef(null);
  const [serverPort, setServerPort] = useState("8000");

  const handleAuthComplete = ({ userId, username }) => {
    setUserId(userId);
    setUsername(username);
    setIsAuthenticated(true);
  };

  const handleJoinRoom = (room) => {
    setRoomId(room);
    joinRoom(room);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUsername("");
    setUserId("");
  };

  const handleLeave = () => {
    if (ws.current) ws.current.close();
    setJoined(false);
    setRoomId("");
    setContent("");
    setUsers([]);
  };

  const joinRoom = (room) => {
    const roomToJoin = room || roomId;
    if (!roomToJoin) return;
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
    
    ws.current = new WebSocket(`ws://127.0.0.1:${serverPort}/ws/${roomToJoin}?user_id=${userId}`);
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "presence") {
          setUsers(message.users || []);
        } else if (message.type === "content") {
          setContent(message.data);
        }
      } catch (e) {
        setContent(event.data);
      }
    };
    
    setJoined(true);
  };

  useEffect(() => {
    if (!joined || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const timeoutId = setTimeout(() => ws.current.send(content), 500);
    return () => clearTimeout(timeoutId);
  }, [content, joined]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  // Auth View
  if (!isAuthenticated) {
    return (
      <Auth 
        onAuthComplete={handleAuthComplete}
        serverPort={serverPort}
        setServerPort={setServerPort}
      />
    );
  }

  // Lobby View
  if (!joined) {
    return (
      <RoomSelector 
        username={username}
        onJoinRoom={handleJoinRoom}
        onSignOut={handleSignOut}
      />
    );
  }

  // Editor View
  return (
    <EditorView
      username={username}
      roomName={roomId}
      content={content}
      setContent={setContent}
      users={users}
      onLeave={handleLeave}
      serverPort={serverPort}
    />
  );
}

export default App;
