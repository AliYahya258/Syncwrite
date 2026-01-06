# SyncWrite - Real-Time Collaborative Document Editor

A modern, feature-rich collaborative document editor built with React, FastAPI, and WebSockets. SyncWrite enables multiple users to edit documents simultaneously with real-time synchronization, AI-powered writing assistance, and comprehensive formatting tools.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)

## 🌟 Features

### 📝 Real-Time Collaboration
- **Live Multi-User Editing**: Multiple users can edit the same document simultaneously with instant synchronization
- **WebSocket-Based**: Low-latency updates using WebSocket connections for real-time collaboration
- **User Presence**: See who's currently viewing and editing the document
- **Role-Based Access Control**: Owner, Editor, and Viewer roles with granular permissions
- **Invite System**: Share documents via email with customizable access levels

### 🤖 AI-Powered Writing Assistant
- **Text Enhancement**: Improve, shorten, expand, or rephrase selected text using Groq's LLaMA 3.3 70B model
- **Style Transformation**: Convert text between formal and casual tones
- **Grammar Correction**: Fix grammatical errors while preserving meaning
- **Smart Autocomplete**: Context-aware text suggestions (up to 15 words) that match your writing style
- **Grammar Checking**: Real-time grammar and spelling checks using LanguageTool API
- **Visual Error Highlights**: 
  - Red wavy underlines for spelling errors
  - Blue wavy underlines for grammar errors
  - Orange wavy underlines for style suggestions
- **One-Click Fixes**: Click on highlighted errors to see suggestions and apply corrections

### 📄 Document Management
- **DOCX Import**: Upload and convert Microsoft Word documents to HTML
- **PDF Export**: Download documents as professionally formatted PDFs
- **DOCX Export**: Save documents back to Microsoft Word format
- **Image Support**: Insert and manage images directly in documents (base64 encoding)
- **Room-Based Organization**: Create and manage multiple document rooms

### ✨ Rich Text Editing
- **Comprehensive Formatting**: Bold, italic, underline, strikethrough
- **Headings**: Three levels of heading styles
- **Text Alignment**: Left, center, right, and justify
- **Lists**: Bulleted and numbered lists
- **Text Colors**: Custom text and highlight colors
- **Links**: Hyperlink support with visual indicators
- **Line Numbers**: Optional line numbering for document navigation
- **Zoom Controls**: Adjustable document zoom (50% - 200%)
- **Page Breaks**: Insert page breaks for document structure

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication system
- **Password Hashing**: Bcrypt encryption for user passwords
- **Role-Based Permissions**: Fine-grained access control for document operations
- **Session Management**: Secure user session handling

## 🏗️ Architecture

### Backend Stack
- **FastAPI**: Modern Python web framework for building APIs
- **WebSockets**: Real-time bidirectional communication
- **Redis**: In-memory data store for sessions and real-time state
- **PostgreSQL**: Relational database for persistent data storage
- **SQLAlchemy**: ORM for database operations
- **Groq API**: AI text completion using LLaMA 3.3 70B Versatile model
- **LanguageTool**: Open-source grammar checking service
- **python-docx**: DOCX file processing
- **WeasyPrint**: HTML to PDF conversion

### Frontend Stack
- **React 18**: Modern UI library with hooks
- **Vite**: Fast build tool and dev server
- **TipTap**: Rich text editor built on ProseMirror
- **Tailwind CSS**: Utility-first CSS framework
- **WebSocket Client**: Real-time connection to backend

### Key Technical Features
- **Singleton Pattern**: Efficient API client initialization with lazy loading
- **Mark Extensions**: Custom TipTap marks for grammar highlighting
- **Decoration System**: Visual error indicators without modifying document content
- **Position Mapping**: Accurate error positioning between LanguageTool and TipTap
- **Debounced Grammar Checks**: Optimized API calls with 2-second delay
- **Rate Limiting**: Protection against API abuse (20 grammar checks/min, 30 autocomplete/min)
- **Concurrent Request Handling**: Thread-safe rate limiting
- **Environment Variable Management**: Secure configuration with python-dotenv

## 🚀 Getting Started

### Prerequisites
```bash
- Python 3.9+
- Node.js 16+
- PostgreSQL
- Redis
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with required variables
cat > .env << EOL
DATABASE_URL=postgresql://user:password@localhost/syncwrite
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secret-key-here
GROQ_API_KEY=your-groq-api-key
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2
EOL

# Run database migrations (if applicable)
# python migrate.py

# Start the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Install TipTap Image extension
npm install @tiptap/extension-image

# Start development server
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📋 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost/syncwrite
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=generate-a-secure-random-string
GROQ_API_KEY=get-from-groq-console
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2
```

### Getting API Keys
- **Groq API**: Sign up at [console.groq.com](https://console.groq.com) for free tier
- **LanguageTool**: Free public API available at `https://api.languagetool.org/v2`

## 🎯 How It Works

### Real-Time Collaboration Flow
1. User creates/joins a room with authentication
2. WebSocket connection established with JWT token
3. User edits trigger events sent via WebSocket
4. Backend broadcasts changes to all connected users in the room
5. Frontend applies changes while preserving cursor position
6. Redis stores active sessions and user presence

### AI Enhancement Flow
1. User selects text and chooses enhancement action (improve, formal, etc.)
2. Frontend sends selection + action to `/api/ai/enhance` endpoint
3. Backend constructs context-aware prompt with examples
4. Groq API (LLaMA 3.3 70B) processes the request
5. Enhanced text returned and displayed in comparison modal
6. User clicks "Replace" to apply changes to document

### Grammar Checking Flow
1. Editor monitors text changes with 2-second debounce
2. Full document text sent to `/api/ai/grammar-check`
3. LanguageTool API analyzes text and returns error positions
4. Backend maps errors to TipTap positions (+1 offset)
5. Frontend applies Mark extensions for visual highlights
6. User clicks error → sees suggestions → applies fix

### Autocomplete Flow
1. Typing stops → 1-second delay triggers autocomplete
2. Last 800 characters sent as context to `/api/ai/autocomplete`
3. Groq API analyzes writing style and generates continuation
4. Suggestion displayed as ghost text below editor
5. Press Tab to accept, Escape to dismiss
6. Completion matches tone and formality of original text

## 🔧 Technical Challenges Solved

### 1. Environment Variable Loading Timing
**Problem**: Groq API key was `None` because singleton was initialized before `load_dotenv()` executed.

**Solution**: Implemented lazy initialization pattern with `_lazy_init()` method that defers API key loading until first runtime call.

### 2. Grammar Highlights Not Rendering
**Problem**: ProseMirror decorations weren't creating visible DOM elements.

**Solution**: Switched from decoration-based approach to TipTap Mark extensions (`GrammarErrorSpelling`, `GrammarErrorGrammar`, `GrammarErrorStyle`) which automatically render as styled spans.

### 3. Tab Key Focus Stealing
**Problem**: Tab key shifted focus to zoom controls instead of accepting autocomplete suggestions.

**Solution**: Added `handleKeyDown` to TipTap's `editorProps` to intercept Tab at editor level before browser focus handling.

### 4. Autocomplete Tone Mismatch
**Problem**: AI suggestions were overly formal when user wrote casually.

**Solution**: 
- Increased context from 200 to 800 characters
- Modified prompt to explicitly analyze and match writing style
- Reduced temperature from 0.7 to 0.4 for consistency
- Increased output from 8 to 15 words for natural completions

### 5. Position Mapping Between APIs
**Problem**: LanguageTool uses 0-indexed positions, TipTap uses 1-indexed positions.

**Solution**: Added `+1` offset when converting error positions: `from = error.start + 1`

## 📊 Performance Optimizations

- **Debounced Grammar Checks**: 2-second delay prevents excessive API calls
- **Rate Limiting**: Per-user limits prevent API quota exhaustion
- **Lazy Initialization**: Deferred resource loading for faster startup
- **Abortable Requests**: Cancel pending autocomplete on new input
- **Memoized Components**: React optimization for toolbar and controls
- **WebSocket Pooling**: Efficient connection reuse
- **Redis Caching**: Fast session and state lookups

## 🎨 User Interface

- **Clean, Modern Design**: Google Docs-inspired interface
- **Responsive Layout**: Works on desktop and tablet devices
- **Intuitive Toolbar**: One-click access to formatting and AI tools
- **Visual Feedback**: Loading states, success/error messages
- **Keyboard Shortcuts**: 
  - `Ctrl+B`: Bold
  - `Ctrl+I`: Italic
  - `Ctrl+U`: Underline
  - `Tab`: Accept autocomplete
  - `Escape`: Dismiss autocomplete
  - `Ctrl+/`: Show shortcuts

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast LLaMA 3.3 inference
- **LanguageTool** for open-source grammar checking
- **TipTap** for the excellent rich text editor framework
- **FastAPI** for the modern Python web framework
- **The open-source community** for amazing tools and libraries

## 🔮 Future Enhancements

- [ ] Comments and annotations
- [ ] Version history and document revisions
- [ ] Advanced formatting (tables, code blocks)
- [ ] Custom AI prompts and templates
- [ ] Offline mode with sync on reconnect
- [ ] Mobile apps (iOS/Android)
- [ ] End-to-end encryption
- [ ] Integration with cloud storage (Google Drive, Dropbox)
- [ ] Advanced search and replace
- [ ] Document templates library

## 📧 Contact

For questions, issues, or suggestions, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ using React, FastAPI, and AI**

