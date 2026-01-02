# AI Project Mentor - Frontend

A modern, minimal, and vibrant React application for AI-powered project mentoring for student teams.

## Features

- 🎨 **Beautiful UI**: Minimal but vibrant design with smooth animations
- 🚀 **Wizard/Onboarding Flow**: Step-by-step introduction for new users
- 🔐 **Google Authentication**: Secure login with Firebase Auth
- 📊 **Dashboard**: Overview of all projects with statistics
- 🗺️ **AI-Generated Roadmaps**: Project roadmaps tailored to team size
- 💬 **AI Mentor Chat**: Interactive chat with AI guidance
- 📈 **Progress Tracking**: Visual progress tracking with milestones
- 📱 **Responsive Design**: Desktop-first, but fully responsive

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & Database
- **Lucide React** - Icons
- **Google Gemini API** - AI capabilities (to be integrated)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Environment Variables:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add your API key to `.env.local`:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     ```
   - **Important:** Never commit `.env.local` to version control!

3. Configure Firebase:
   - Open `src/config/firebase.js`
   - Replace the placeholder values with your Firebase configuration:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

4. Customize App Name:
   - Open `src/config/app.js`
   - Change `name: 'Your App Name'` to your desired app name

5. Install Vercel CLI (required for serverless functions):
```bash
npm i -g vercel
```

6. Start development server:
```bash
npm run dev
```
This will run `vercel dev` which enables both the frontend and API serverless functions.

> **Note:** If you only want to run the frontend without API functions (for UI development only), you can use `npm run dev:vite`, but API features won't work.

7. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:3000`)

> **Note:** For detailed environment variable setup instructions, see [ENV_SETUP.md](./ENV_SETUP.md)

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── OnboardingWizard.jsx
│   │   ├── CreateProjectModal.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoadmapView.jsx
│   │   ├── ChatView.jsx
│   │   └── ProgressView.jsx
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   └── ProjectDetail.jsx
│   ├── context/             # React Context
│   │   └── AuthContext.jsx
│   ├── config/              # Configuration files
│   │   ├── firebase.js
│   │   └── app.js
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Changing App Name

Edit `src/config/app.js`:
```javascript
export const APP_CONFIG = {
  name: 'Your New App Name',
};
```

The app name appears in:
- Dashboard header
- Browser tab title (edit `index.html`)

### Color Scheme

Edit `tailwind.config.js` to customize colors:
- `primary` - Main brand color (blue)
- `accent` - Accent color (purple)
- `success` - Success states (green)

### Firebase Integration

1. Set up Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication
3. Create Firestore database
4. Set up Cloud Functions for Gemini API integration
5. Update `src/config/firebase.js` with your config

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. **Add environment variables:**
   - Go to **Settings > Environment Variables**
   - Add `GEMINI_API_KEY` with your Gemini API key
   - Select all environments (Production, Preview, Development)
4. Deploy!

> **Security:** The Gemini API key is stored securely in Vercel environment variables and is never exposed to the frontend code.

### Other Platforms

Build the project:
```bash
npm run build
```

The `dist/` folder contains the production build ready to deploy.

## TODO / Integration Points

The following features need backend integration:

1. **Firebase Firestore Integration**:
   - Project creation and storage
   - Roadmap generation and storage
   - Progress updates
   - Chat message history

2. **Google Gemini API**:
   - Roadmap generation based on project description and team size
   - AI chat responses
   - Progress feedback and suggestions

3. **Email Notifications**:
   - SMTP integration for alerts
   - Progress updates
   - Team member invitations

4. **Team Features**:
   - Invite team members
   - Team chat rooms
   - Shared progress tracking

## Design Philosophy

- **Minimal**: Clean, uncluttered interface
- **Vibrant**: Modern color gradients and smooth animations
- **Professional**: Polished UI suitable for academic/professional use
- **Desktop-First**: Optimized for desktop with responsive mobile support
- **Accessible**: Semantic HTML and keyboard navigation support

## License

MIT
