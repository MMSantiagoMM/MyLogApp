
# My Logic App - A Multifunctional Web Application

Welcome to "My Logic App"! This is a Next.js application designed to provide a suite of tools for learning and development, including an online Java compiler, a YouTube video hub, an HTML presenter, and a platform for coding exercises.

## Core Features

1.  **Online Java Editor (`/editor`)**:
    *   Write, compile, and run Java code directly in the browser.
    *   Supports standard input for programs.
    *   Displays output and compilation errors.
    *   Resizable editor and panes for a comfortable coding experience.

2.  **Video Hub (`/files`)**:
    *   Add and manage a collection of YouTube video links.
    *   Embeds YouTube videos for direct playback on the page.
    *   Videos are displayed side-by-side in a responsive grid.
    *   Data is saved locally in the browser.

3.  **Coding Exercises (`/exercises`)**:
    *   Create and attempt coding exercises.
    *   Exercises are defined using HTML for instructions and content.
    *   Includes an integrated Java editor (`JavaEditor.tsx` component) for solving Java-based problems.
    *   Manage exercises: create, edit, delete, and attempt.
    *   Resizable instruction and editor panes.

4.  **HTML Presenter (`/html-presenter`)**:
    *   An HTML editor with a live preview pane.
    *   Create, edit, and save HTML snippets or full pages.
    *   Useful for experimenting with HTML, CSS, and JavaScript.
    *   Presentations are saved locally.

5.  **Modern UI & UX**:
    *   Clean, responsive interface built with ShadCN UI components and Tailwind CSS.
    *   Collapsible sidebar for navigation.
    *   Light and Dark mode theme toggle.

## Technology Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
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
    *   This project uses Genkit for the Java compilation feature, which requires a Gemini API Key.
    *   Create a `.env` file in the root of the project.
    *   Add your Gemini API key to the `.env` file:
        ```env
        GEMINI_API_KEY=your_gemini_api_key_here
        ```
    *   You can obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

4.  **Run the Genkit development server (for AI features):**
    *   In a separate terminal, start the Genkit development server:
        ```bash
        npm run genkit:dev
        # or use genkit:watch for automatic reloading on changes to AI flows
        # npm run genkit:watch
        ```
    *   This server handles requests to the Genkit flows (e.g., `compileCode`).

5.  **Run the Next.js development server:**
    *   In another terminal, start the Next.js application:
        ```bash
        npm run dev
        ```
    *   The application should now be running, typically at `http://localhost:9002`.

## Project Structure Highlights

*   `src/app/`: Contains the Next.js pages (App Router).
    *   `editor/page.tsx`: Standalone Java Editor.
    *   `exercises/page.tsx`: Coding exercises management and attempt views.
    *   `files/page.tsx`: YouTube Video Hub.
    *   `html-presenter/page.tsx`: HTML editor and live preview.
    *   `layout.tsx`: Root layout of the application.
    *   `page.tsx`: The homepage.
*   `src/components/`: Reusable React components.
    *   `AppShell.tsx`: Defines the main application layout including the sidebar and theme toggle.
    *   `JavaEditor.tsx`: The core component for Java code editing, input, and output display, used in both `/editor` and `/exercises`.
    *   `ui/`: ShadCN UI components (Accordion, Button, Card, etc.).
*   `src/ai/`: Genkit related files.
    *   `flows/compile-code.ts`: The Genkit flow responsible for the Java code compilation logic using a tool (currently simulated).
    *   `genkit.ts`: Initializes and configures Genkit with the Google AI plugin.
*   `src/lib/`: Utility functions, type definitions, and shared data.
    *   `data.ts`: Defines interfaces like `VideoData` and `ExerciseItem`.
    *   `youtubeUtils.ts`: Helper functions for processing YouTube URLs.
    *   `utils.ts`: General utility functions like `cn` for class merging.
*   `public/`: Static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.ts`: Next.js configuration.

## How the Java Compiler Works

The Java compilation feature (`/editor` and within `/exercises`) uses a Genkit flow (`src/ai/flows/compile-code.ts`).
This flow defines a "tool" named `executeJavaCode`. In the current implementation, this tool simulates code execution. For a production environment, this tool would need to be integrated with a secure code execution service (e.g., JDoodle, a sandboxed Docker environment, or a custom microservice).

The frontend sends the Java code and any user input to this Genkit flow, which then invokes the tool and returns the output.

---
