# Apprvd Frontend

A modern Next.js application for the Apprvd platform, featuring authentication, responsive design, a clean user interface, and productivity features inspired by Google Drive with a PostgreSQL backend. The platform includes advanced document editing, collaboration features, and AI-powered analysis.

## 🚀 Features

### 🔐 Authentication & Security
- **Modern Authentication**: Google OAuth integration with Firebase
- **Secure API**: Firebase ID token verification for all API endpoints
- **User Management**: Automatic user creation and session management
- **Access Control**: Document and folder-level permissions

### 📁 File Management
- **Folder System**: Create, organize, and navigate nested folders
- **Document Creation**: Rich text documents with TinyMCE editor
- **Drag & Drop**: Intuitive file organization
- **Search**: Instant search across folders and documents
- **Soft Delete**: Safe document and folder deletion

### 📝 Document Editor
- **TinyMCE Integration**: Full-featured rich text editor
- **Auto-save**: Automatic document saving with timestamp display
- **Version Control**: Document status tracking (Draft, Review, Final)
- **Comments System**: Inline comments and replies
- **Mentions**: @user mentions with notifications
- **Keyboard Shortcuts**: Enhanced editing experience

### 🤝 Collaboration Features
- **Document Sharing**: Share documents with view/edit permissions
- **Access Management**: Granular control over document access
- **Real-time Updates**: Live collaboration capabilities
- **User Permissions**: Owner, editor, and viewer roles

### 🔔 Notifications System
- **Mention Notifications**: Get notified when mentioned in documents
- **Access Change Alerts**: Notifications for permission updates
- **Document Sharing**: Alerts when documents are shared with you
- **Real-time Updates**: Instant notification delivery

### 🤖 AI-Powered Features
- **Document Summarization**: Generate concise summaries using OpenAI GPT-4
- **Document Review**: AI-powered suggestions for grammar, style, content, and structure
- **Expandable AI Sidebar**: Right-side panel for AI interactions
- **Smart Analysis**: Context-aware document improvement suggestions

### 🎨 User Interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Toggle between themes with persistent preferences
- **Modern UI**: Clean, intuitive interface inspired by Google Drive
- **Accessibility**: Keyboard navigation and screen reader support

### 🔧 Technical Features
- **TypeScript**: Full type safety throughout the application
- **Next.js 15**: Latest features with App Router
- **PostgreSQL**: Robust database with advanced schema
- **Real-time Updates**: Live data synchronization
- **Performance**: Optimized loading and rendering

## 📁 Project Structure

```
apprvd-frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/            # AI-powered features
│   │   │   ├── summarize/ # Document summarization
│   │   │   └── review/    # Document review
│   │   ├── document/      # Document management
│   │   │   ├── [id]/      # Individual document operations
│   │   │   │   ├── route.ts           # GET, PUT document
│   │   │   │   ├── share/             # Document sharing
│   │   │   │   ├── comment/           # Comments system
│   │   │   │   └── users/             # Users with access
│   │   │   └── route.ts   # POST create document
│   │   ├── folder/        # Folder operations
│   │   ├── notification/  # Notification system
│   │   └── user/          # User management
│   ├── document/[id]/     # Document editor page
│   ├── login/             # Authentication
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home dashboard
├── components/            # React components
│   ├── AISidebar.tsx      # AI assistant sidebar
│   ├── TinyMCEEditor.tsx  # Rich text editor
│   ├── ShareModal.tsx     # Document sharing modal
│   ├── NotificationDropdown.tsx # Notification panel
│   ├── UserDropdown.tsx   # User menu
│   ├── Sidebar.tsx        # Main navigation
│   ├── Navbar.tsx         # Top navigation
│   ├── FolderList.tsx     # Folder display
│   ├── FileList.tsx       # File display
│   ├── FolderCard.tsx     # Folder UI
│   ├── FileCard.tsx       # File UI
│   └── withAuth.tsx       # Authentication HOC
├── lib/                   # Utilities
│   ├── firebase/          # Firebase configuration
│   ├── firebase/admin.ts  # Firebase Admin SDK
│   ├── openai.ts          # OpenAI integration
│   ├── api.ts             # API utilities
│   └── db.ts              # Database connection
├── db/                    # Database
│   └── schema.sql         # PostgreSQL schema
├── scripts/               # Database scripts
├── public/                # Static assets
└── [config files]         # Various configuration files
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 (with dark mode)
- **Authentication**: Firebase 11.9.1 (Client + Admin SDK)
- **Database**: PostgreSQL with pg driver
- **AI Integration**: OpenAI GPT-4 API
- **Rich Text Editor**: TinyMCE 6
- **UI Components**: Custom, modular React components
- **Development**: ESLint, Turbopack/Webpack

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Firebase project setup
- PostgreSQL database (local or remote)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apprvd-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Client SDK (public)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Firebase Admin SDK (private)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/apprvd_db
   
   # OpenAI (for AI features)
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Set up Firebase Admin SDK**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file and copy values to `.env.local`

5. **Set up PostgreSQL database**
   
   **Option A: Local with Docker (recommended)**
   ```bash
   # Start PostgreSQL container
   docker-compose up -d
   
   # Initialize database schema
   npm run init-db
   ```
   
   **Option B: Remote PostgreSQL**
   - Create a PostgreSQL database
   - Set the `DATABASE_URL` in your `.env.local`
   - Run: `npm run init-db`

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Authentication
- Sign in with Google on the login page
- Authenticated pages are protected with HOC
- All API calls are secured with Firebase ID tokens

### Main Dashboard
- **Create Folders**: Click "New Folder" to create folders
- **Create Documents**: Click "New Document" to create rich text documents
- **Search**: Instantly filter folders and documents
- **Navigation**: Use sidebar for folder navigation

### Document Editor
- **Rich Text Editing**: Full TinyMCE editor with formatting options
- **Auto-save**: Documents save automatically with timestamp
- **Comments**: Add inline comments and replies
- **Mentions**: Use @username to mention users
- **Status Management**: Mark documents as Draft, Review, or Final
- **Sharing**: Share documents with specific permissions

### AI Features
- **AI Sidebar**: Click the AI Assistant button (right side)
- **Document Summary**: Generate concise summaries using GPT-4
- **Document Review**: Get AI-powered improvement suggestions
- **Categories**: Grammar, style, content, and structure suggestions

### Collaboration
- **Share Documents**: Grant view or edit access to users
- **Access Management**: Update permissions for shared users
- **Notifications**: Get alerts for mentions and access changes
- **Real-time Updates**: See changes from other users

### User Interface
- **Dark/Light Mode**: Toggle theme from navbar
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Search**: Instant filtering with clear button
- **Sidebar**: Always visible on desktop, drawer on mobile

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

### Core Tables
- `user` - User accounts (linked to Firebase auth)
- `folder` - User folders (supports nesting)
- `document` - User documents (rich text content)

### Collaboration Tables
- `document_ownership` - Document sharing and permissions
- `comment` - Document comments and replies
- `notification` - User notifications and mentions

### Schema Features
- **UUID Primary Keys**: Secure, non-sequential identifiers
- **Soft Delete**: Safe deletion with data preservation
- **Timestamps**: Created and updated timestamps
- **Foreign Keys**: Proper referential integrity
- **Indexes**: Optimized for performance

## 🔒 Security Features

### Authentication
- **Firebase OAuth**: Secure Google authentication
- **ID Token Verification**: Server-side token validation
- **Session Management**: Automatic token refresh

### Authorization
- **Document Access Control**: Owner, editor, viewer roles
- **Folder Permissions**: Inherited from parent folders
- **API Security**: All endpoints require valid tokens

### Data Protection
- **Environment Variables**: Sensitive config protection
- **Input Validation**: Server-side request validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization

## 🤖 AI Integration

### OpenAI Integration
- **GPT-4 Model**: High-quality text analysis
- **Structured Prompts**: Consistent, actionable results
- **Error Handling**: Graceful API failure management
- **Rate Limiting**: Built-in request throttling

### AI Features
- **Document Summarization**: Extract key points and insights
- **Writing Review**: Grammar, style, and content suggestions
- **Context Awareness**: Document-specific recommendations
- **User-Friendly Output**: Clear, actionable feedback

## 📱 Responsive Design

### Mobile Experience
- **Touch-Friendly**: Optimized for touch interactions
- **Sidebar Drawer**: Collapsible navigation on mobile
- **Responsive Grid**: Adaptive folder and file layouts
- **Mobile Editor**: Optimized TinyMCE for mobile

### Desktop Experience
- **Full-Featured**: Complete functionality on larger screens
- **Multi-Panel**: Sidebar, main content, and AI panel
- **Keyboard Shortcuts**: Enhanced productivity features
- **Drag & Drop**: Intuitive file organization

## 🎨 Design System

### Colors
- **Primary**: #88DF95 (green accent)
- **Text**: Black/white with proper contrast
- **Background**: Light/dark theme support
- **Status Colors**: Blue, green, yellow, red for different states

### Typography
- **Font Family**: System fonts for optimal performance
- **Font Sizes**: Responsive typography scale
- **Line Heights**: Optimized for readability

### Spacing
- **Consistent**: 4px base unit system
- **Touch-Friendly**: Minimum 44px touch targets
- **Responsive**: Adaptive spacing for different screen sizes

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run init-db` - Initialize database schema

## 🔧 Configuration

### Environment Variables
All sensitive configuration is stored in `.env.local`:
- Firebase configuration (client and admin)
- Database connection string
- OpenAI API key
- Other service credentials

### Database Configuration
- PostgreSQL 12+ recommended
- Connection pooling enabled
- Proper indexing for performance
- Regular backups recommended

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Setup
- Set all required environment variables
- Configure database connection
- Set up Firebase project
- Configure OpenAI API access

### Performance Optimization
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Built-in Next.js optimization
- **Caching**: Static generation where possible
- **CDN**: Recommended for static assets

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Testing requirements
- Documentation standards

## 🆘 Support

### Common Issues
- **Authentication**: Check Firebase configuration
- **Database**: Verify PostgreSQL connection
- **AI Features**: Ensure OpenAI API key is set
- **Performance**: Check database indexes

### Getting Help
- Create an issue in the GitHub repository
- Check the Firebase documentation
- Review the database schema
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS, PostgreSQL, and OpenAI**
