# EduAssist: AI-Integrated Educational Platform

EduAssist is a comprehensive educational platform designed to address the fragmentation and inefficiencies of existing academic tools. It provides a unified, AI-driven environment for classroom management, communication, assignments, and student support, integrating functionalities often spread across platforms like Google Classroom, Piazza, and email.

The platform consists of two main parts:
1.  A **FastAPI backend** dedicated to AI processing and chatbot functionalities.
2.  A **Next.js full-stack application** handling the core educational platform features, user interactions, and data management.

## Project Structure

├── AI/ # AI Backend (FastAPI)\
│&nbsp;&nbsp;&nbsp;&nbsp;├── database/ # Database operations and models (e.g., for conversation history)\
│&nbsp;&nbsp;&nbsp;&nbsp;├── schemas/ # Pydantic models and request/response schemas\
│&nbsp;&nbsp;&nbsp;&nbsp;├── services/ # Business logic and AI services (LangChain, OpenAI interactions)\
│&nbsp;&nbsp;&nbsp;&nbsp;├── utils/ # Utility functions and prompt templates\
│&nbsp;&nbsp;&nbsp;&nbsp;├── main.py # FastAPI application entry point\
│&nbsp;&nbsp;&nbsp;&nbsp;└── config.py # Configuration settings\
│\
├── Web/ # Full-stack Next.js application\
│&nbsp;&nbsp;&nbsp;&nbsp;├── app/ # Next.js app directory (using App Router)\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── api/ # API routes / Server Actions for backend logic\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── administration/ # Admin API endpoints\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── faculty/ # Faculty API endpoints\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── student/ # Student API endpoints\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── ... # Other backend logic (onboarding, posts, reminders)\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── (auth)/ # Authentication pages (Clerk integration)\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── sign-in/ # Sign in page\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── sign-up/ # Sign up page\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── forgot-password/ # Password recovery\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── (dashboard)/ # User dashboards (role-specific)\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── administration/ # Admin dashboard pages\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── faculty/ # Faculty dashboard pages\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── student/ # Student dashboard pages\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── (main)/ # Core application pages\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── (index)/ # Landing page\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── onboarding/ # University onboarding flow\
│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── dashboard/ # Dashboard redirect (routes by role)\
│&nbsp;&nbsp;&nbsp;&nbsp;├── components/ # Reusable UI components (using Shadcn UI)\
│&nbsp;&nbsp;&nbsp;&nbsp;├── hooks/ # Custom React hooks\
│&nbsp;&nbsp;&nbsp;&nbsp;├── lib/ # Utility functions, Prisma client, etc.\
│&nbsp;&nbsp;&nbsp;&nbsp;├── prisma/ # Database schema (schema.prisma) and migrations\
│&nbsp;&nbsp;&nbsp;&nbsp;├── public/ # Static assets\
│&nbsp;&nbsp;&nbsp;&nbsp;├── styles/ # Global styles, Tailwind CSS config\
│&nbsp;&nbsp;&nbsp;&nbsp;└── types/ # TypeScript type definitions\

## Features

### Core Platform Features (Web Application)
-   **User Management:**
    -   Secure user authentication and authorization (using Clerk).
    -   Role-based access control (Student, Faculty, University Administration).
    -   Admin panel for managing users (create, update, delete accounts).
    -   Bulk user registration via Excel uploads for students and faculty.
    -   Profile management and password/email updates.
    -   "Forgot Password" recovery feature.
-   **Classroom Management:**
    -   Creation, editing, and archiving of digital classrooms by Admins/Faculty.
    -   Management of classroom participants (students, TAs).
    -   Bulk add/remove of students/teachers via Excel.
    -   Uploading and organization of study materials.
    -   Assignment creation, distribution, and management.
    -   Enforcement of assignment deadlines (preventing late submissions).
    -   Grading/marking system for assignments.
-   **Discussion Forums & Communication:**
    -   Classroom-specific discussion threads.
    -   Standalone discussion forums (e.g., for departments, batches, all students).
    -   Ability for users to create, view, and reply to threads.
    -   Private chat (1-to-1 messaging, potentially thread-based).
    -   Admin moderation capabilities (add/remove users, manage threads/replies).
    -   Automatic forum creation for groups (departments, batches).
-   **Notification System:**
    -   Real-time notifications for key events (new assignments, private messages, forum/thread posts).
-   **General:**
    -   Modern, responsive UI built with Next.js, React, and Tailwind CSS (Shadcn UI).
    -   Intuitive navigation and user experience.

### AI Chatbot Features (Integrated via FastAPI Backend)
-   **Contextual Assistance:** Provides real-time, context-aware support to users based on their role and current activity.
-   **Query Handling:** Answers questions related to:
    -   Pending assignments.
    -   Important announcements.
    -   Course content and study materials (via document analysis).
    -   University policies.
    -   Discussions the user is part of.
-   **Discussion Summarization:** Summarizes lengthy discussion threads in forums or classrooms.
-   **Faculty Support:** Filters and highlights important student queries for teachers.
-   **Document Analysis:** Analyzes uploaded study-related documents (PDFs etc.) to answer specific user queries about their content.
-   **Task Assistance:** Acts as a personal assistant (e.g., setting reminders for deadlines).
-   **Natural Language Processing:** Uses LangChain and OpenAI models for understanding and generation.
-   **Semantic Search:** Leverages vector embeddings (Chroma DB) for relevant information retrieval from discussions (RAG).

## Technology Stack

### Frontend (Web)
-   **Framework:** Next.js 14 (with App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** Shadcn UI
-   **State Management / Data Fetching:** React Server Components, potentially Axios & React Query for client-side needs.
-   **Core Library:** React JS

### Backend (Web - Core Logic)
-   **Framework:** Next.js (API Routes / Server Actions)
-   **Language:** TypeScript
-   **Authentication:** Clerk
-   **ORM:** Prisma
-   **Database:** PostgreSQL

### Backend (AI Features)
-   **Framework:** FastAPI
-   **Language:** Python
-   **AI Orchestration:** LangChain
-   **LLM:** OpenAI API
-   **Vector Database:** Chroma
-   **Conversation DB:** SQLite (as mentioned in implementation details)

### Databases
-   **Primary Data:** PostgreSQL
-   **Vector Embeddings:** Chroma

### Key Libraries/Tools
-   **Version Control:** Git / GitHub Desktop
-   **Code Editor:** Visual Studio Code
-   **Package Managers:** npm / pip
-   **API Interaction:** Axios (mentioned in design)
-   **Server State:** React Query (mentioned in design)

## Database Schema

The application utilizes a relational database (PostgreSQL) managed via Prisma. Key models include:
-   University
-   User (handles Student, Faculty, Admin roles via `type`)
-   Student / Faculty (role-specific profile details)
-   UniAdministration / UniAdministrationRoles / Permission (admin roles and permissions)
-   Department / Batch / DepartmentBatches
-   Course
-   Classroom
-   ClassroomTeachers (linking faculty/TAs to classrooms)
-   Enrollment (linking students to classrooms)
-   Assignment (classwork with due dates)
-   Submission / SubmissionAttachments (student submissions with marks)
-   Forum (standalone discussion forums)
-   Thread / ThreadPost / ThreadPostAttachments (forum discussions and replies)
-   ClassroomThread / ClassroomPost / ClassroomPostAttachments (classroom-specific discussions)
-   Group / BatchGroup / DepartmentGroup / CustomGroup / CustomGroupMembers (user groups)
-   Reminder (user reminders with due dates)
-   *Refer to `Web/prisma/schema.prisma` for the exact schema.*

## Backend Architecture

EduAssist employs a modular architecture with distinct subsystems:
1.  **User Management Subsystem:** Handles authentication, roles, permissions, and user profiles. (Primarily Next.js backend + Clerk)
2.  **Classroom Management Subsystem:** Manages courses, classrooms, enrollments, materials, assignments, and grading. (Next.js backend + PostgreSQL)
3.  **Forum Management Subsystem:** Manages discussion forums, threads, posts, private chats, and notifications. (Next.js backend + PostgreSQL)
4.  **Chatbot Management Subsystem:** Provides AI-driven assistance, interacting with users and other subsystems via API calls. (FastAPI backend + LangChain/OpenAI/Chroma + Next.js backend for integration)

The overall architecture follows a layered approach:
-   **Frontend Layer (Next.js/React):** User interface and interaction.
-   **Backend Layer (Next.js API/Server Actions & FastAPI):** Business logic, API endpoints, AI processing.
-   **Database Layer (PostgreSQL, Chroma, Prisma):** Data persistence and retrieval.
-   **AI Model Layer (OpenAI):** Core intelligence for the chatbot.

## Getting Started

### Prerequisites

-   Node.js (LTS version recommended)
-   Python (3.8+)
-   npm or yarn
-   pip
-   PostgreSQL server
-   Git
-   Clerk Account (Publishable Key, Secret Key)
-   OpenAI API Key

### AI Backend Setup (FastAPI)

1.  Navigate to the `AI` directory:
    ```bash
    cd AI
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Set up environment variables:
    ```bash
    cp .env.example .env
    # Edit .env with your OpenAI API Key
    ```
5.  Run the AI backend server:
    ```bash
    uvicorn main:app --reload
    # Typically runs on http://localhost:8000
    ```

### Web Application Setup (Next.js)

1.  Navigate to the `Web` directory:
    ```bash
    cd Web
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env
    # Edit .env with your Database URL, Clerk keys, AI API URL, etc.
    ```
4.  Set up the PostgreSQL database and apply schema:
    ```bash
    # Ensure PostgreSQL server is running and accessible
    npx prisma generate
    npx prisma migrate dev --name init # Or your migration name
    # npx prisma db seed # If you have seed data
    ```
5.  Run the Next.js development server:
    ```bash
    npm run dev
    # or
    yarn dev
    # Typically runs on http://localhost:3000
    ```

## Environment Variables

### AI Backend (`AI/.env`)
```dotenv
OPENAI_API_KEY=your_openai_api_key
```

### Web Application (`Web/.env`)
```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_AI_API_URL=http://localhost:8000 # Adjust if your AI backend runs on any other port
```

## Contributing

Fork the repository.
Create your feature branch (git checkout -b feature/YourAmazingFeature).
Commit your changes (git commit -m 'Add some AmazingFeature').
Push to the branch (git push origin feature/YourAmazingFeature).
Open a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.