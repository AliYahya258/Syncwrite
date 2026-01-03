import { useState, useEffect, useRef } from 'react'
import { Auth } from './components/Auth'
import { RoomSelector } from './components/RoomSelector'
import { EditorView } from './components/EditorView'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [userRole, setUserRole] = useState("");
  
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [content, setContent] = useState("");
  const [users, setUsers] = useState([]);
  const ws = useRef(null);
  const [serverPort, setServerPort] = useState("8000");

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    
    if (storedToken && storedUserId && storedUsername) {
      setToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);
      setEmail(storedEmail);
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthComplete = ({ userId, username, email, token }) => {
    setUserId(userId);
    setUsername(username);
    setEmail(email);
    setToken(token);
    setIsAuthenticated(true);
  };

  const handleJoinRoom = (room) => {
    setRoomId(room);
    joinRoom(room);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    setIsAuthenticated(false);
    setUsername("");
    setUserId("");
    setEmail("");
    setToken("");
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
    
    // Use token instead of user_id for WebSocket connection
    // URL encode the room ID to handle spaces and special characters
    const encodedRoomId = encodeURIComponent(roomToJoin);
    ws.current = new WebSocket(`ws://127.0.0.1:${serverPort}/ws/${encodedRoomId}?token=${token}`);
    
    ws.current.onopen = () => {
      console.log('Connected to room:', roomToJoin);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Don't show alert here - connection might still succeed
    };

    ws.current.onclose = (event) => {
      if (event.code === 1008) {
        alert('Access denied or invalid token. Please login again.');
        handleSignOut();
      }
    };
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "role") {
          // Store user's role in the room
          setUserRole(message.role);
          console.log('Your role:', message.role);
        } else if (message.type === "presence") {
          setUsers(message.users || []);
        } else if (message.type === "content") {
          setContent(message.data);
        } else if (message.type === "error") {
          alert(message.message);
        }
      } catch (e) {
        setContent(event.data);
      }
    };
    
    setJoined(true);
  };

  useEffect(() => {
    if (!joined || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    
    // Don't send updates if user is a viewer
    if (userRole === 'viewer') {
      return;
    }
    
    const timeoutId = setTimeout(() => ws.current.send(content), 500);
    return () => clearTimeout(timeoutId);
  }, [content, joined, userRole]);

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
        serverPort={serverPort}
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
      userRole={userRole}
      token={token}
    />
  );
}

export default App;
