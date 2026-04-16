# SocialQuest - A Modern Quora Clone

SocialQuest is a full-stack, real-time social knowledge-sharing platform heavily inspired by Quora and X (Twitter). It allows users to ask questions, share posts, follow creators, participate in threaded comments, and securely chat with colleagues via real-time websockets. 

The application is built leveraging the modern React ecosystem, utilizing Firebase for a robust backend-as-a-service (BaaS) and Tailwind CSS with a stunning glassmorphism design.

## 🚀 Features

* **Authentication System:** Secure email/password login and registration powered by Firebase Auth, featuring a deep gradient split-screen UI.
* **Dual Content Types (Questions & Posts):** Differentiated schemas let users specifically ask knowledge-based questions or share organic posts.
* **Real-time Feed & Engagement:** Natively subscribe to feed updates. Users can like, comment, and bookmark posts instantly with `onSnapshot` real-time context streaming.
* **Real-time Direct Messaging:** A dedicated `/chat` portal providing live, private instant-messaging between mapped users.
* **Social Graph:** Follow/Unfollow architecture natively tied to your user profile and active routing.
* **Dashboard & Metrics:** A comprehensive user dashboard highlighting questions asked, answers given, likes received, and active following stats.
* **Skeleton Loaders:** Elegant, low-latency Shadcn geometry skeleton loading states replacing traditional spinners.
* **Dark Mode:** Fluid dark/light theme switching built directly into the UI parameters.
* **Responsive Layout:** A flat-feed timeline interface optimized for both desktop browsers and mobile touch interactions.

## 🛠️ Tech Stack

**Frontend Framework:**
* [React 18](https://react.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Vite](https://vitejs.dev/)
* [Wouter](https://github.com/molefrog/wouter) (Minimalist Routing)

**Styling & UI:**
* [Tailwind CSS v3](https://tailwindcss.com/)
* [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
* [Lucide React](https://lucide.dev/) (Icons)

**Backend & Database:**
* [Firebase Authentication](https://firebase.google.com/docs/auth)
* [Firestore](https://firebase.google.com/docs/firestore) (NoSQL Database)

## ⚙️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/socialquest.git
   cd socialquest
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory of your project. Copy the Firebase configuration variables from your Firebase Console.
   ```env
   VITE_FIREBASE_API_KEY="your_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   VITE_FIREBASE_APP_ID="your_app_id"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   *The application will boot up at `http://localhost:5173/`.*

## 📂 Project Structure

```text
src/
├── components/       # Reusable UI components (Cards, Header, Sidebar)
│   ├── ui/           # Shadcn foundational primitives
│   └── modals/       # Popups (Create Question, User Profiling)
├── contexts/         # Global React context (Auth Context, Theme)
├── hooks/            # Custom logical hooks (useFirestore realtime bindings)
├── lib/              # Utility configurations (Firebase App Init, tailwind merge)
├── pages/            # Full route pages (Auth, Home, Profile, Chat, Dashboard)
├── types/            # Typescript Interface schemas
└── index.css         # Global stylesheets and Tailwind layers
```

## 🔐 Database Rules (Firestore)

In order for the application to function correctly, ensure your Firebase Cloud Firestore Rules allow authenticated reads and writes. A basic secure testing setup:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Allow read/write access to authenticated users
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is licensed under the MIT License.
