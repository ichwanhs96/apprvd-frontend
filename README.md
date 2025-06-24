# Apprvd Frontend

A modern Next.js application for the Apprvd platform, featuring authentication, responsive design, a clean user interface, and productivity features inspired by Google Drive.

## 🚀 Features

- **Modern Authentication**: Google OAuth integration with Firebase
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Next.js 15**: Latest features with App Router
- **Firebase Integration**: Secure authentication and data management
- **Dark/Light Mode**: Toggle between light and dark themes from the navbar
- **Instant Search**: Search bar in the navbar instantly filters files and folders, with a clear (X) button
- **Sidebar Drawer**: Sidebar is a drawer on mobile, always visible on desktop
- **Modular React Structure**: All UI is built from reusable, well-typed components

## 📁 Project Structure

```
apprvd-frontend/
├── app/                    # Next.js App Router
│   ├── login/             # Authentication pages
│   │   └── page.tsx       # Login page with Google OAuth
│   ├── globals.css        # Global styles (Tailwind directives)
│   ├── layout.tsx         # Root layout (imports globals.css)
│   └── page.tsx           # Home page (main app)
├── components/            # Reusable React components
│   ├── Sidebar.tsx        # Sidebar with navigation and new button
│   ├── Navbar.tsx         # Navbar with logo, search, theme toggle, avatar
│   ├── FolderList.tsx     # Folder list display
│   ├── FileList.tsx       # File list display
│   ├── FolderCard.tsx     # Folder card UI
│   ├── FileCard.tsx       # File card UI
│   └── withAuth.tsx       # HOC for authentication protection
├── lib/                   # Utility libraries
│   └── firebase/          # Firebase configuration and utilities
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration (dark mode enabled)
├── postcss.config.mjs     # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.ts         # Next.js configuration
├── README.md              # Project documentation
└── CONTRIBUTING.md        # Contribution rules and best practices
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 (with dark mode)
- **Authentication**: Firebase 11.9.1
- **UI Components**: Custom, modular React components
- **Development**: ESLint, Turbopack/Webpack

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Firebase project setup

### Installation
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apprvd-frontend
   ```
2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```
3. **Set up Firebase configuration**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```
5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ✨ Usage Guide

### Authentication
- Sign in with Google on the login page.
- Authenticated pages are protected with a HOC and redirect to `/login` if not signed in.

### Sidebar
- On desktop: always visible on the left.
- On mobile: hidden by default, open with the hamburger menu in the navbar.
- "New" button lets you create new files or folders (currently shows an alert).

### Navbar
- **Logo**: Top left (mobile only).
- **Search Bar**: Instantly filters files and folders as you type. Click the (X) to clear.
- **Theme Toggle**: Sun/moon button toggles between light and dark mode. Remembers your preference.
- **User Avatar**: Shows your Google profile image. Click to logout.

### Main Content
- **Folders**: Displayed in a responsive grid. Filtered by search.
- **Files**: Displayed in a responsive grid. Filtered by search.
- **Responsive**: All layouts adapt for mobile, tablet, and desktop.

## 🎨 Design System
- **Primary Color**: #88DF95 (used for buttons, highlights)
- **Text**: Black in light mode, white in dark mode
- **Dark Mode**: All components support dark mode
- **Spacing**: Consistent, touch-friendly padding and margins

## 📝 Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🔒 Security
- **Environment Variables**: Sensitive config stored in `.env.local`
- **Firebase Security**: Authentication handled by Firebase
- **TypeScript**: Compile-time type checking

## 🤝 Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) for project-specific rules and React best practices.

## 🆘 Support
- Create an issue in the GitHub repository
- Contact the development team
- Check the Firebase documentation for authentication issues

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
