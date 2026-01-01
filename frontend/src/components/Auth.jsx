import { useState } from 'react'
import { Button, Input } from './UI'

export function Auth({ onAuthComplete, serverPort, setServerPort }) {
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleAuth = async () => {
    setAuthError("");
    const endpoint = authMode === "login" ? "/api/login" : "/api/register";
    
    try {
      const response = await fetch(`http://127.0.0.1:${serverPort}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        setAuthError(error.detail || "Authentication failed");
        return;
      }
      
      const data = await response.json();
      onAuthComplete({
        userId: data.user_id,
        username: data.username
      });
    } catch (error) {
      setAuthError("Connection error. Is the server running?");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="text-center pt-8 pb-6 px-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-blue-100 p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">SyncWrite</h1>
            <p className="text-sm text-gray-600">Collaborate in real-time with your team</p>
          </div>
          
          {/* Tabs */}
          <div className="px-8">
            <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setAuthMode("login")}
                className={`py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  authMode === "login" 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  authMode === "register" 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>
            
            {/* Form */}
            <div className="space-y-4 pb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="relative">
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <Input
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              {authMode === "login" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Server Port</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    <Input
                      placeholder="8000"
                      value={serverPort}
                      onChange={(e) => setServerPort(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                      className="w-full pl-10"
                    />
                  </div>
                </div>
              )}
              
              {authError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {authError}
                </div>
              )}
              
              <Button variant="primary" onClick={handleAuth} className="w-full py-2.5 font-medium flex items-center justify-center group">
                {authMode === "login" ? "Enter App" : "Create Account"}
                <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center">
            <p className="text-xs text-gray-500">Secure, encrypted, and real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
