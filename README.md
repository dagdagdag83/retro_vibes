# Real-Time, Serverless Scrum Retrospective App

This is a single-page web application that allows agile teams to conduct a collaborative retrospective meeting in real-time without a traditional backend server. It uses a peer-to-peer (P2P) architecture for communication.

## How It Works

A user creates a new retrospective board, which generates a unique URL. This URL can be shared with teammates. Anyone with the link can join the session instantly without needing to sign up. All interactions—such as adding, editing, moving, or deleting cards—are reflected in real-time for all participants.

### Core Features
- **Collaborative Board:** Three columns: "Start," "Stop," and "Continue."
- **Card Management:** Add, edit, delete, and drag-and-drop cards between columns.
- **Action Points:** Promote any card to a dedicated "Action Points" section.
- **Participant Status:** See a list of participants and their status (e.g., "Done").
- **Real-Time Sync:** All changes are instantly broadcast to all peers.
- **Serverless:** No backend server is needed to store board data.
- **Persistence:** The board state is saved in your browser's `localStorage`, so you can refresh the page without losing your work.

## Architecture

The application is built on a serverless, peer-to-peer architecture.

- **Frontend:** A Vue.js (v3) single-page application.
    - **UI:** Tailwind CSS for styling.
    - **State Management:** Pinia is used to manage the application's state on each client. The state is the "single source of truth" for the UI.
    - **Routing:** Vue Router handles navigation.

- **Real-Time Communication:** WebRTC Data Channels are used to create a direct P2P mesh network between all clients in a session. This allows for low-latency, real-time communication without a central server.

- **Signaling:** Google Firebase Firestore is used as the signaling layer. When a user joins a room, Firestore is used to facilitate the initial WebRTC connection handshake (exchanging offers, answers, and ICE candidates) between peers. After the connection is established, Firestore is no longer in the communication path.

- **Authentication:** Firebase Anonymous Authentication is used to assign a unique, temporary ID to each user. This ID is used to secure the signaling documents in Firestore via Security Rules, ensuring that only authenticated participants of a specific session can access its signaling data.

- **Mocking:** For local development, the application uses a mock implementation of the Firebase and Firestore APIs, allowing for development and testing without needing a live Firebase project.

## How to Run Locally

To run the application locally, you can use the mock Firestore instance, which requires no setup.

### Prerequisites
- Node.js (v20 or higher)
- Yarn (or npm)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    Using Yarn:
    ```bash
    yarn install
    ```
    Or using npm:
    ```bash
    npm install
    ```

3.  **Run the development server:**
    The project is configured to use a mock database by default for local development.
    ```bash
    yarn dev
    ```
    Or using npm:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### Connecting to a Real Firebase Project (Optional)

If you want to connect the application to your own Firebase project for production or testing:

1.  **Create a Firebase project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Firestore and Anonymous Authentication:**
    - In your Firebase project, go to "Firestore Database" and create a database.
    - Go to "Authentication" -> "Sign-in method" and enable "Anonymous" sign-in.
3.  **Get your Firebase config:** In your project settings, find your web app's Firebase configuration object.
4.  **Create a `.env.local` file:** In the root of the project, create a file named `.env.local`.
5.  **Add your credentials to `.env.local`:**
    ```
    # Set this to false to use your real Firebase project
    VITE_USE_MOCK_DB=false

    # Your Firebase project credentials
    VITE_FIREBASE_API_KEY=your-api-key
    VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    VITE_FIREBASE_APP_ID=your-app-id
    ```
6.  **Restart the development server.**