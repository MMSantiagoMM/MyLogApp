
# My Logic App - A Multifunctional Web Application

Welcome to "My Logic App"! This is a Next.js application designed to provide a suite of tools for learning and development, including an online Java compiler, a YouTube video hub, an HTML presenter, and a platform for coding exercises.

## Core Features

1.  **Online Java Editor (`/editor`)**:
    *   Write, compile, and run Java code directly in the browser.
    *   Supports standard input for programs.
    *   Displays output and compilation errors.
    *   Resizable editor and panes for a comfortable coding experience.

2.  **Video Hub (`/files`)**:
    *   Add, view, and manage a collection of YouTube video links.
    *   Embeds YouTube videos for direct playback on the page.
    *   Videos are displayed side-by-side in a responsive grid.
    *   Data is stored and retrieved from **Firebase Firestore**.

3.  **Coding Exercises (`/exercises`)**:
    *   Create and attempt coding exercises.
    *   Exercises are defined using HTML for instructions and content.
    *   Includes an integrated Java editor (`JavaEditor.tsx` component) for solving Java-based problems.
    *   Manage exercises: create, edit, delete, and attempt.
    *   Data is saved locally in the browser's localStorage.

4.  **HTML Presenter (`/html-presenter`)**:
    *   An HTML editor with a live preview pane.
    *   Create, edit, and save HTML snippets or full pages.
    *   Useful for experimenting with HTML, CSS, and JavaScript.
    *   Presentations are saved locally in the browser's localStorage.

5.  **Modern UI & UX**:
    *   Clean, responsive interface built with ShadCN UI components and Tailwind CSS.
    *   Collapsible sidebar for navigation.
    *   Light and Dark mode theme toggle.

## Technology Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Database**: Firebase Firestore (for Video Hub)
*   **UI Components**: ShadCN UI
*   **Styling**: Tailwind CSS
*   **AI Functionality (Java Compiler Backend)**: Genkit (with Google AI/Gemini)
*   **Code Editor**: Monaco Editor (powering VS Code)
*   **Icons**: Lucide React

## Getting Started

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   npm or yarn

### Setup & Running Locally

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Environment Variables:**
    *   This project requires two sets of environment variables: one for Firebase services (client-side) and one for Genkit (server-side).
    *   Create a `.env` file in the root of the project.
    *   **Firebase Keys:** Add your Firebase project's configuration to the `.env` file. You can get these from your Firebase project settings under "Your apps" -> "SDK setup and configuration" -> "Config".
        ```env
        # Firebase SDK Keys
        NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
        NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
        ```
    *   **Gemini API Key (for Genkit):** Add your Gemini API key for the Java compiler feature.
        ```env
        # Genkit / AI Keys
        GEMINI_API_KEY="your_gemini_api_key_here"
        ```
    *   You can obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

4.  **Run the Genkit development server (for AI features):**
    *   In a separate terminal, start the Genkit development server:
        ```bash
        npm run genkit:dev
        ```

5.  **Run the Next.js development server:**
    *   In another terminal, start the Next.js application:
        ```bash
        npm run dev
        ```
    *   The application should now be running, typically at `http://localhost:9002`.

## Project Structure Highlights

*   `src/app/`: Contains the Next.js pages (App Router).
*   `src/components/`: Reusable React components.
*   `src/ai/`: Genkit related files for the Java compiler.
*   `src/lib/`:
    *   `firebase.ts`: Initializes the Firebase app and Firestore.
    *   `data.ts`: Defines shared data interfaces like `Video`.
*   `public/`: Static assets.

---
