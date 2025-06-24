# Apprvd Frontend

A modern Next.js application for the Apprvd platform, featuring authentication, responsive design, and a clean user interface.

## 🚀 Features

- **Modern Authentication**: Google OAuth integration with Firebase
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Next.js 15**: Latest features with App Router
- **Firebase Integration**: Secure authentication and data management

## 📁 Project Structure

```
apprvd-frontend/
├── app/                    # Next.js App Router
│   ├── login/             # Authentication pages
│   │   └── page.tsx       # Login page with Google OAuth
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Utility libraries
│   └── firebase/          # Firebase configuration and utilities
│       ├── config.ts      # Firebase app configuration
│       ├── auth.ts        # Authentication utilities
│       └── index.ts       # Firebase exports
├── public/                # Static assets
│   ├── next.svg
│   ├── vercel.svg
│   ├── window.svg
│   ├── globe.svg
│   └── file.svg
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── next.config.ts         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # Project documentation
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Authentication**: Firebase 11.9.1
- **UI Components**: Custom components with Tailwind CSS
- **Development**: ESLint, Turbopack

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

   Create a `.env.local` file in the root directory with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

   **Note**: Create a `.env.example` file in the root directory with the same structure for team reference.

   Or update the configuration in `lib/firebase/config.ts` with your Firebase project details.

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

## 🔧 Firebase Setup

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication and Google Sign-in method

### 2. Get Configuration
1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click on the web app or create a new one
4. Copy the configuration object

### 3. Environment Variables
Add your Firebase configuration to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 📱 Features Overview

### Authentication
- **Google OAuth**: Seamless sign-in with Google accounts
- **Auto-redirect**: Automatic redirection after successful authentication
- **State Management**: Real-time authentication state tracking

### User Interface
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Loading States**: Smooth user experience with proper loading indicators
- **Error Handling**: User-friendly error messages

### Development Features
- **TypeScript**: Full type safety and better developer experience
- **ESLint**: Code quality and consistency
- **Hot Reload**: Instant feedback during development
- **Optimized Build**: Production-ready with Next.js optimizations

## 🎨 Design System

The application uses a consistent design system with:
- **Color Palette**: Green accent colors (#6EE7B7) with neutral grays
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Components**: Reusable UI components with consistent styling

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🔒 Security

- **Environment Variables**: Sensitive configuration stored in `.env.local`
- **Firebase Security**: Authentication handled by Firebase's secure infrastructure
- **TypeScript**: Compile-time type checking prevents runtime errors

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted servers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the Firebase documentation for authentication issues

---

**Built with ❤️ using Next.js, TypeScript, and Firebase**
