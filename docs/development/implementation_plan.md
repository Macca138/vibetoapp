---

### File: `implementation_plan.md`

```markdown
## Implementation Plan Overview

**Estimated Timeline:** 800-1200 development hours (approx. 100-150 person-days assuming an 8-hour workday, for a single developer with AI coding assistants). This is a high-level estimate, and detailed task complexity below will help refine it.

**Development Approach:** Single developer leveraging AI coding assistants for code generation, debugging, and best practice adherence. Focus on iterative development, with each step resulting in a buildable and testable state of the application. Prioritize core functionalities and infrastructure setup before diving into complex features.

**Task Complexity Legend:**
* 🟢 Small (1-2 hours)
* 🟡 Medium (4-8 hours)
* 🔴 Large (1-2 days)

---

### Core Infrastructure and Project Setup

**Step 1: Initialize Next.js Project and Basic Configuration** 🟢 ✅ COMPLETED
* **Task:** Create a new Next.js project with TypeScript and ESLint configured. Set up basic folder structure for components, pages, services, and utils. Initialize Git repository.
* **Files:**
    * `package.json`: Add Next.js, React, TypeScript, ESLint dependencies.
    * `next.config.js`: Basic Next.js configuration.
    * `tsconfig.json`: TypeScript configuration.
    * `.eslintrc.json`: ESLint configuration.
    * `.gitignore`: Standard Git ignore rules for Next.js.
    * `README.md`: Initial project README.
* **Step Dependencies:** None
* **User Instructions:**
    * Run `npx create-next-app@latest --typescript --eslint`
    * Initialize Git: `git init` and commit initial files.
* **UX/UI Considerations:** None at this stage.
* **Validation:** Project builds and runs without errors. `npm run dev` starts the development server.
* **Token Usage Estimate:** Low
* **Processing Time:** Short
* **Cost Category:** Setup

**Step 2: Integrate Tailwind CSS for Styling** 🟢 ✅ COMPLETED
* **Task:** Install and configure Tailwind CSS into the Next.js project. Add base styles and ensure it's properly purging unused CSS for production builds.
* **Files:**
    * `package.json`: Add `tailwindcss`, `postcss`, `autoprefixer` dependencies.
    * `tailwind.config.ts`: Tailwind CSS configuration file, define content paths.
    * `postcss.config.js`: PostCSS configuration.
    * `app/globals.css` (or equivalent): Import Tailwind base, components, and utilities.
* **Step Dependencies:** Step 1
* **User Instructions:**
    * Install dependencies: `npm install -D tailwindcss postcss autoprefixer`
    * Initialize Tailwind: `npx tailwindcss init -p`
    * Configure `tailwind.config.ts` and `postcss.config.js`.
    * Import Tailwind directives into global CSS.
* **UX/UI Considerations:** Establish basic typography and color palette variables in `tailwind.config.ts` based on initial design guidelines (though detailed design system will be implemented later).
* **Validation:** Apply a simple Tailwind class (e.g., `text-blue-500`) to an element in `app/page.tsx` and verify the styling is applied in the browser.
* **Token Usage Estimate:** Low
* **Processing Time:** Short
* **Cost Category:** Setup

**Step 3: Database Setup with Prisma ORM and PostgreSQL** 🟡 ✅ COMPLETED
* **Task:** Install Prisma, configure it to connect to a PostgreSQL database, and set up the initial schema for the `User` model, including fields for `id`, `email`, `name`, `passwordHash` (for email/password auth), and `emailVerified`. Apply migrations.
* **Files:**
    * `package.json`: Add `prisma` and `@prisma/client` dependencies.
    * `prisma/schema.prisma`: Define `datasource` for PostgreSQL and `generator` for Prisma Client. Add `User` model.
    * `.env`: Add `DATABASE_URL` environment variable.
* **Step Dependencies:** Step 1
* **User Instructions:**
    * Install Prisma CLI: `npm install prisma --save-dev`
    * Install Prisma Client: `npm install @prisma/client`
    * Initialize Prisma: `npx prisma init`
    * Create a PostgreSQL database and update `.env` with `DATABASE_URL`.
    * Define `User` model in `prisma/schema.prisma`.
    * Generate Prisma Client and apply migration: `npx prisma db push` (for initial setup) or `npx prisma migrate dev --name init` (for tracked migrations).
* **UX/UI Considerations:** None. This is backend infrastructure.
* **Validation:** Prisma client is generated successfully. Connect to the PostgreSQL database and verify the `User` table is created with the specified columns.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Infrastructure

**Step 4: Basic NextAuth.js Setup for Authentication** 🟡 ✅ COMPLETED
* **Task:** Integrate NextAuth.js. Set up basic configuration with credentials provider for email/password authentication (even if social logins are added later, this provides a baseline). Define API routes for authentication.
* **Files:**
    * `package.json`: Add `next-auth` dependency.
    * `lib/auth.ts`: (New file) Configuration for NextAuth.js, including providers and callbacks.
    * `pages/api/auth/[...nextauth].ts` (or `app/api/auth/[...nextauth]/route.ts` if using App Router): NextAuth.js API route.
    * `.env`: Add `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.
* **Step Dependencies:** Step 1, Step 3 (for User model)
* **User Instructions:**
    * Install NextAuth.js: `npm install next-auth`
    * Create NextAuth configuration file (`lib/auth.ts`).
    * Create NextAuth API route.
    * Generate a secure `NEXTAUTH_SECRET` and add to `.env`.
    * Set `NEXTAUTH_URL` in `.env`.
* **UX/UI Considerations:** None at this stage. Basic auth routes are setup but no UI yet.
* **Validation:** Verify that the `/api/auth/csrf` and other NextAuth endpoints are accessible and return expected responses (e.g., CSRF token).
* **Token Usage Estimate:** Medium
* **Processing Time:** Short
* **Cost Category:** Authentication

### User Authentication and Project Management System

**Step 5: Implement User Sign-up UI and Backend Logic** 🟡 ✅ COMPLETED
* **Task:** Create a user registration page with a form for email, password, and name. Implement the API endpoint to handle user registration, hashing passwords (e.g., using `bcryptjs`), and saving the user to the database via Prisma. Handle basic input validation and error responses.
* **Files:**
    * `components/auth/SignUpForm.tsx`: (New file) React component for the sign-up form.
    * `app/auth/signup/page.tsx` (or equivalent): Page to render the sign-up form.
    * `app/api/auth/register/route.ts`: (New file) API endpoint for user registration.
    * `lib/utils/auth.ts`: (New file) Utility for password hashing.
    * `prisma/schema.prisma`: Add `passwordHash` to `User` model if not already present.
* **Step Dependencies:** Step 2 (Tailwind CSS for styling), Step 3 (Prisma/PostgreSQL), Step 4 (NextAuth.js, for session management integration later).
* **User Instructions:**
    * Create the sign-up form component and page.
    * Implement the API endpoint to send user input to Gemini and save the response.
    * Test registration by submitting the form.
* **UX/UI Considerations:**
    * **Form States:** Normal, disabled (during submission), error (with clear messages), success.
    * **Input Validation:** Real-time feedback for email format, password strength, matching passwords.
    * **Loading Indicators:** Spinners or disabled buttons during form submission.
    * **Accessibility:** Proper ARIA attributes for form fields and error messages.
* **Validation:** Successfully register a new user via the UI. Verify the new user's entry in the PostgreSQL database with a hashed password. Test with invalid inputs to ensure error handling.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Feature Development

**Step 6: Implement User Login UI and Session Management** 🟡 ✅ COMPLETED
* **Task:** Create a login page with email and password fields. Implement the API endpoint to handle user login using NextAuth.js's credentials provider. Redirect authenticated users to the dashboard.
* **Files:**
    * `components/auth/LoginForm.tsx`: (New file) React component for the login form.
    * `app/auth/login/page.tsx`: (New file) Page to render the login form.
    * `app/api/auth/[...nextauth].ts`: Update NextAuth.js configuration to handle credentials provider logic (authenticating user against database).
* **Step Dependencies:** Step 2, Step 3, Step 4, Step 5.
* **User Instructions:**
    * Create the login form component and page.
    * Update NextAuth.js configuration to validate user credentials against the database.
    * Test login with registered user credentials.
* **UX/UI Considerations:**
    * **Form States:** Normal, disabled, error (incorrect credentials, account locked).
    * **Password Visibility Toggle:** An eye icon to show/hide password.
    * **"Forgot Password" Link:** Placeholder for future implementation.
    * **Loading Indicators:** During submission.
    * **Redirection:** Smooth transition to the dashboard after successful login.
* **Validation:** Successfully log in with a registered user. Verify session creation (e.g., by checking cookies or session state). Attempt login with incorrect credentials and verify appropriate error messages.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Feature Development

**Step 7: Basic Project Dashboard and Project Creation UI** 🔴
* **Task:** Create a basic project dashboard page for authenticated users. This page should display a list of projects (initially empty or showing a "create your first project" prompt). Implement a UI for creating a new project with a "Project Name" input. Implement the backend API endpoint to create a new `Project` entry in the database associated with the logged-in user.
* **Files:**
    * `prisma/schema.prisma`: Add `Project` model (id, name, userId, createdAt, updatedAt).
    * `app/dashboard/page.tsx`: (New file) Main dashboard page.
    * `components/projects/ProjectList.tsx`: (New file) Component to display projects.
    * `components/projects/CreateProjectForm.tsx`: (New file) Form for new project.
    * `app/api/projects/route.ts`: (New file) API endpoint for creating/listing projects.
* **Step Dependencies:** Step 3, Step 6.
* **User Instructions:**
    * Define `Project` model in Prisma.
    * Generate new Prisma client/migrate DB.
    * Create dashboard page and components.
    * Implement API endpoint for project creation.
    * Test creating a new project via the UI.
* **UX/UI Considerations:**
    * **Empty State:** Clear instructions for users with no projects.
    * **Project Card/List Item:** Basic display of project name.
    * **"Create New Project" Button/Modal:** Clear call to action.
    * **Form Submission:** Loading state and success/error feedback.
    * **Accessibility:** Ensure all interactive elements are keyboard navigable.
* **Validation:** Log in, navigate to the dashboard. Create a new project. Verify the project appears on the dashboard and is correctly stored in the PostgreSQL database linked to the user.
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development

### Landing Page and Waitlist Integration

**Step 8: Implement Static Landing Page Structure** 🟡
* **Task:** Create a static landing page (`/`) with basic sections: hero, features, testimonials (placeholders), and a call-to-action for the waitlist. Focus on layout and responsive design using Tailwind CSS.
* **Files:**
    * `app/page.tsx`: Update with landing page content.
    * `components/landing/HeroSection.tsx`: (New file)
    * `components/landing/FeaturesSection.tsx`: (New file)
    * `components/landing/CallToActionSection.tsx`: (New file)
* **Step Dependencies:** Step 2.
* **User Instructions:**
    * Design the layout for the landing page.
    * Implement the sections as React components.
* **UX/UI Considerations:**
    * **Responsive Design:** Ensure layout adapts well to mobile, tablet, and desktop screens.
    * **Visual Hierarchy:** Use typography and spacing to guide the user's eye.
    * **Call-to-Action:** Make the waitlist signup prominent.
* **Validation:** Access the root URL (`/`) and verify the landing page renders correctly and is responsive across different screen sizes.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Feature Development

**Step 9: Waitlist Integration with Resend (or similar service)** 🟡
* **Task:** Implement a waitlist signup form on the landing page. Create an API endpoint to handle form submissions, saving the email to a new `WaitlistEntry` model in the database, and sending a confirmation email via Resend.
* **Files:**
    * `prisma/schema.prisma`: Add `WaitlistEntry` model (id, email, createdAt).
    * `components/landing/WaitlistForm.tsx`: (New file) Form component.
    * `app/api/waitlist/route.ts`: (New file) API endpoint for waitlist submissions.
    * `.env`: Add `RESEND_API_KEY` (or similar for other email service).
* **Step Dependencies:** Step 3, Step 8.
* **User Instructions:**
    * Define `WaitlistEntry` model and migrate DB.
    * Integrate the waitlist form into the landing page.
    * Set up Resend API key.
    * Implement API endpoint to handle waitlist logic and send email.
* **UX/UI Considerations:**
    * **Form States:** Normal, submitting, success (with confirmation message), error (with clear message).
    * **Email Input Validation:** Client-side and server-side.
    * **Confirmation Message:** Clear feedback to the user upon successful signup.
* **Validation:** Submit the waitlist form with a valid email. Verify the email is saved in the database. Verify that a confirmation email is sent to the provided address.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Feature Development

### Advanced Infrastructure and Authentication

**Step 10: Configure Redis for Caching and Session Management** 🟢
* **Task:** Set up a Redis instance and configure the application to connect to it. This will be used later for Bull Queue and potentially session caching.
* **Files:**
    * `package.json`: Add `ioredis` or similar Redis client library.
    * `lib/redis.ts`: (New file) Redis client initialization and connection.
    * `.env`: Add `REDIS_URL`.
* **Step Dependencies:** Step 1
* **User Instructions:**
    * Install a Redis client library: `npm install ioredis`.
    * Set up a Redis instance (local or cloud provider).
    * Configure `REDIS_URL` in `.env`.
    * Create `lib/redis.ts` to export a Redis client instance.
* **UX/UI Considerations:** None. Backend infrastructure.
* **Validation:** Start the application and verify that the Redis client connects successfully without errors.
* **Token Usage Estimate:** Low
* **Processing Time:** Short
* **Cost Category:** Infrastructure

**Step 11: Implement Bull Queue for Background Processing** 🟡
* **Task:** Integrate Bull Queue using the Redis instance. Set up a basic queue (e.g., for `emailQueue`) and a worker process to handle jobs. This is foundational for AI processing and export functionality.
* **Files:**
    * `package.json`: Add `bullmq` and `bull` dependencies.
    * `lib/queues/emailQueue.ts`: (New file) Define a simple queue.
    * `workers/emailWorker.ts`: (New file) Define a worker to process jobs from the email queue.
* **Step Dependencies:** Step 10.
* **User Instructions:**
    * Install Bull Queue: `npm install bullmq bull`.
    * Define a sample queue and a corresponding worker.
    * Ensure the worker process can be run independently or integrated into the Next.js app's startup.
* **UX/UI Considerations:** None. Backend infrastructure.
* **Validation:** Add a sample job to the queue and verify that the worker processes it successfully (e.g., by logging job completion).
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Infrastructure

**Step 12: Integrate Framer Motion for UI Animations** 🟢
* **Task:** Install Framer Motion and integrate it into the project. Create a simple animated component (e.g., a fade-in effect on a landing page element) to ensure proper setup.
* **Files:**
    * `package.json`: Add `framer-motion` dependency.
    * `components/ui/AnimatedDiv.tsx`: (New file) A reusable component with a basic animation.
    * `app/page.tsx` (or other relevant UI file): Use the `AnimatedDiv` component.
* **Step Dependencies:** Step 1, Step 2.
* **User Instructions:**
    * Install Framer Motion: `npm install framer-motion`.
    * Implement a simple animation to test the integration.
* **UX/UI Considerations:**
    * **Micro-interactions:** Add subtle animations to buttons, hover states, etc.
    * **Page Transitions:** Smooth transitions between routes.
    * **Feedback:** Visual feedback for user actions.
* **Validation:** Observe the animation working correctly in the browser.
* **Token Usage Estimate:** Low
* **Processing Time:** Short
* **Cost Category:** UI/UX

**Step 13: Add Social Login Providers to NextAuth.js (Google, GitHub)** 🟡
* **Task:** Extend the NextAuth.js configuration to include Google and GitHub OAuth providers. Register the application with Google and GitHub to obtain client IDs and secrets.
* **Files:**
    * `package.json`: Add `@auth/prisma-adapter` and relevant OAuth provider packages (e.g., `@next-auth/google`, `@next-auth/github`).
    * `lib/auth.ts`: Update NextAuth.js configuration to include GoogleProvider and GitHubProvider.
    * `.env`: Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`.
    * `prisma/schema.prisma`: Add `Account` and `Session` models as required by NextAuth.js Prisma Adapter.
* **Step Dependencies:** Step 3, Step 4.
* **User Instructions:**
    * Register your application with Google Cloud Console and GitHub Developer Settings to get credentials.
    * Update `.env` with the new credentials.
    * Update `lib/auth.ts` to include the providers.
    * Run Prisma migrations if `Account` and `Session` models were added.
* **UX/UI Considerations:**
    * **Login Buttons:** Clearly distinguishable buttons for each social provider on the login/signup page.
    * **Error Handling:** Graceful display of errors if social login fails.
* **Validation:** Test login with both Google and GitHub accounts. Verify new user accounts are created/linked in the database.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Authentication

### 9-Step Guided Workflow - Core Implementation

**Step 14: Implement Core Workflow UI and Navigation** 🔴
* **Task:** Create the main UI shell for the 9-step guided workflow. This includes a persistent sidebar or header with step indicators, progress tracking, and navigation buttons (Next/Previous Step). Define the `WorkflowStep` Prisma model.
* **Files:**
    * `prisma/schema.prisma`: Add `WorkflowStep` model (id, projectId, stepNumber, status, data, createdAt, updatedAt).
    * `app/workflow/[projectId]/page.tsx`: (New file) Main workflow page.
    * `components/workflow/WorkflowSidebar.tsx`: (New file) Step indicator and navigation.
    * `components/workflow/WorkflowNavigation.tsx`: (New file) Next/Previous buttons.
    * `app/api/workflow/route.ts`: (New file) API for managing workflow state and navigation.
* **Step Dependencies:** Step 3, Step 7.
* **User Instructions:**
    * Define `WorkflowStep` model and migrate DB.
    * Create the main workflow page layout.
    * Implement UI for step indicators and navigation.
    * Set up API endpoints for saving/loading workflow progress.
* **UX/UI Considerations:**
    * **Visual Progress:** Clear visual indication of current, completed, and upcoming steps.
    * **Navigation:** Intuitive buttons for moving between steps, potentially disabled if requirements not met.
    * **Auto-save Indicator:** Visual cue for auto-save functionality.
    * **Accessibility:** Keyboard navigation for workflow steps and buttons.
* **Validation:** Create a new project, navigate to its workflow. Verify the workflow UI renders correctly with 9 steps, and navigation buttons function (even if only between placeholder steps initially).
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development

**Step 15: Integrate Google Gemini 1.5 Pro for AI Processing** 🟡
* **Task:** Set up the Google Gemini 1.5 Pro API integration. Create a service layer or utility to make API calls to Gemini for prompt generation and processing. This will be used by the individual workflow steps.
* **Files:**
    * `package.json`: Add Google AI SDK dependency (e.g., `@google/generative-ai`).
    * `lib/gemini.ts`: (New file) Gemini API client initialization and helper functions.
    * `.env`: Add `GEMINI_API_KEY`.
* **Step Dependencies:** Step 1.
* **User Instructions:**
    * Obtain a Google Gemini API key.
    * Install the necessary SDK.
    * Create `lib/gemini.ts` to encapsulate API calls.
    * Test a basic call to the Gemini API (e.g., simple text generation).
* **UX/UI Considerations:** None. Backend integration.
* **Validation:** Successfully make a test API call to Gemini and receive a response.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Integration

**Step 16: Implement Workflow Step 1: "Articulate Idea"** 🔴
* **Task:** Implement the UI for Step 1, allowing users to input their app idea and problem statement. Connect this UI to a backend API endpoint that uses Google Gemini 1.5 Pro (via the Prompt Generator system prompt) to refine the idea and suggest initial features. Save the refined output to the `WorkflowStep` data field.
* **Files:**
    * `components/workflow/steps/Step1ArticulateIdea.tsx`: (New file) UI for Step 1.
    * `app/api/workflow/step1/route.ts`: (New file) API endpoint for processing Step 1 input with Gemini.
    * `lib/prompts/step1Prompts.ts`: (New file) Contains the Backend System Prompt for Step 1.
* **Step Dependencies:** Step 14, Step 15.
* **User Instructions:**
    * Create the UI component for Step 1.
    * Implement the API endpoint to send user input to Gemini and save the response.
    * Test inputting an idea and verifying the AI-generated output.
* **UX/UI Considerations:**
    * **Input Area:** Large, clear text area for the app idea.
    * **AI Processing Indicator:** "AI is thinking..." message during API calls.
    * **Editable Output:** Allow users to review and edit the AI-generated content before saving.
    * **Save/Next Button:** Clearly visible and enabled/disabled based on input/processing status.
    * **Error Handling:** Display messages if AI processing fails or returns an error.
* **Validation:** Submit an app idea in Step 1. Verify that Gemini processes it, the output is displayed, editable, and correctly saved to the database upon progression to the next step.
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development (AI)

**Step 17: Implement Workflow Step 2: "Fleshing Out"** 🔴
* **Task:** Implement the UI for Step 2, which builds upon the output of Step 1. Use Google Gemini 1.5 Pro (via the SaaS Founder system prompt) to expand the idea into a detailed project specification, including elevator pitch, problem statement, target audience, USP, etc. Implement the API endpoint to handle this processing and save the updated specification.
* **Files:**
    * `components/workflow/steps/Step2FleshingOut.tsx`: (New file) UI for Step 2.
    * `app/api/workflow/step2/route.ts`: (New file) API endpoint for processing Step 2 input with Gemini.
    * `lib/prompts/step2Prompts.ts`: (New file) Contains the Backend System Prompt for Step 2.
* **Step Dependencies:** Step 14, Step 15, Step 16.
* **User Instructions:**
    * Create the UI component for Step 2.
    * Implement the API endpoint to send Step 1's refined output to Gemini for "fleshing out."
    * Test moving from Step 1 to Step 2 and verifying the detailed specification is generated and displayed.
* **UX/UI Considerations:**
    * **Structured Output Display:** Clearly present the generated "Elevator Pitch", "Problem Statement", "Features List", etc., in an organized and readable format.
    * **Editability:** Allow users to modify any section of the generated content.
    * **Follow-up Questions:** If AI determines insufficient detail, dynamically present clarifying questions to the user.
    * **Loading States:** Clear indicators during AI processing.
* **Validation:** Progress from Step 1 to Step 2. Verify that the detailed project specification is generated and displayed correctly. Test editing sections and saving the changes.
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development (AI)

### Data Flow and Project Management Enhancements

**Step 18: Implement Component-Based Data Flow System - Core Logic** 🔴
* **Task:** Develop the custom engine for automated data transfer between workflow steps. This involves defining `DataFlowRelationship` in Prisma and creating a backend service that processes these relationships to auto-populate data between steps.
* **Files:**
    * `prisma/schema.prisma`: Add `DataFlowRelationship` model (id, sourceStepId, targetStepId, fieldMapping, projectId).
    * `lib/dataFlowEngine.ts`: (New file) Core logic for processing data flow relationships.
    * `app/api/dataflow/route.ts`: (New file) API endpoint to trigger or manage data flow.
* **Step Dependencies:** Step 3, Step 14.
* **User Instructions:**
    * Define `DataFlowRelationship` model and migrate DB.
    * Implement the `dataFlowEngine` to manage data mapping and transfer.
    * Create a test case for data flow between two simple fields in adjacent steps.
* **UX/UI Considerations:** None. Backend system.
* **Validation:** Define a simple data flow relationship (e.g., project name from Step 1 to a read-only field in Step 2). Verify that the data is automatically populated.
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development

**Step 19: Implement Project Auto-Save Functionality** 🟡
* **Task:** Implement client-side auto-save logic for project data within the workflow steps and dashboard. This involves debouncing user input and sending periodic updates to the backend API to save changes to the `Project` and `WorkflowStep` models.
* **Files:**
    * `components/workflow/AutoSaveIndicator.tsx`: (New file) UI for showing saving status.
    * `hooks/useAutoSave.ts`: (New file) Custom React hook for auto-save logic.
    * `app/api/projects/[projectId]/save/route.ts`: (New file) API endpoint for partial project/workflow data updates.
* **Step Dependencies:** Step 7, Step 14.
* **User Instructions:**
    * Create the auto-save hook and indicator component.
    * Integrate the auto-save hook into relevant forms/input fields within workflow steps.
    * Implement the backend API endpoint to handle efficient partial updates.
* **UX/UI Considerations:**
    * **Saving Indicator:** A small, non-intrusive message (e.g., "Saving..." or a checkmark for "Saved") to confirm data persistence.
    * **Debouncing:** Ensure frequent user inputs don't overwhelm the backend with too many save requests.
* **Validation:** Make changes in a workflow step or on the dashboard. Wait a few seconds and verify the "Saving..." indicator appears and then confirms "Saved." Refresh the page and confirm changes are persisted.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Feature Development

**Step 20: Enhance Project Dashboard with Progress Tracking** 🟡
* **Task:** Enhance the project dashboard to display visual indicators of project progress through the 9-step workflow. This involves querying the `WorkflowStep` statuses for each project and rendering a progress bar or similar visual cue.
* **Files:**
    * `components/projects/ProjectProgressCard.tsx`: (New file) Component to display project progress.
    * `app/dashboard/page.tsx`: Update to use `ProjectProgressCard`.
    * `app/api/projects/progress/route.ts`: (New file) API endpoint to fetch project progress data.
* **Step Dependencies:** Step 7, Step 14.
* **User Instructions:**
    * Implement the progress calculation logic based on `WorkflowStep` statuses.
    * Integrate the progress display into the dashboard.
* **UX/UI Considerations:**
    * **Clear Visuals:** Use progress bars, circles, or checkmarks to intuitively show completion.
    * **Quick Resume:** Make the progress indicator clickable to resume workflow at the last active step.
    * **Project Comparison (Future):** Design considerations for displaying multiple project progresses.
* **Validation:** Create a new project, complete a few workflow steps. Navigate to the dashboard and verify the progress indicator accurately reflects the completed steps.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Feature Development

### Pricing and Export Functionality

**Step 21: Implement Hybrid Pricing System - Stripe Integration (Checkout)** 🔴
* **Task:** Integrate Stripe Checkout for one-time project-based payments and initial subscription setup. Define the `UserSubscription` model. Implement backend API endpoints to create Stripe Checkout sessions.
* **Files:**
    * `package.json`: Add `stripe` dependency.
    * `prisma/schema.prisma`: Add `UserSubscription` model (id, userId, stripeCustomerId, status, currentPeriodEnd, type, createdAt, updatedAt).
    * `app/api/stripe/checkout-session/route.ts`: (New file) API endpoint to create Stripe Checkout session.
    * `.env`: Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRODUCT_ID_PROJECT`, `STRIPE_PRODUCT_ID_SUBSCRIPTION`.
* **Step Dependencies:** Step 3, Step 6.
* **User Instructions:**
    * Set up a Stripe account and obtain API keys.
    * Define `UserSubscription` model and migrate DB.
    * Implement the backend API endpoint for creating Stripe Checkout sessions.
    * Configure Stripe products for project-based and subscription models.
* **UX/UI Considerations:**
    * **Pricing Page:** Clearly present project-based and subscription tiers.
    * **Call-to-Action:** Prominent buttons to initiate payment.
    * **Loading State:** Indicate when redirecting to Stripe.
    * **Success/Error Pages:** Redirect users to clear success/failure pages after checkout.
* **Validation:** Implement a temporary "Buy Now" button on the dashboard. Click it and verify redirection to Stripe Checkout. Complete a test payment.
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development (Payment)

**Step 22: Implement Stripe Webhook Handling for Payments/Subscriptions** 🔴
* **Task:** Create a Stripe webhook endpoint to handle asynchronous events (e.g., `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`). Update user and subscription statuses in the database based on these events.
* **Files:**
    * `app/api/webhooks/stripe/route.ts`: (New file) Stripe webhook endpoint.
    * `lib/stripe.ts`: (New file) Stripe client initialization and webhook verification utility.
* **Step Dependencies:** Step 21.
* **User Instructions:**
    * Configure a webhook endpoint in your Stripe dashboard.
    * Implement webhook handler logic to process events.
    * Use Stripe CLI to test webhooks locally.
* **UX/UI Considerations:** None. Backend system.
* **Validation:** Trigger test webhook events (e.g., `checkout.session.completed`) and verify that user's subscription status or project access is updated correctly in the database.
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development (Payment)

**Step 23: Implement Export Functionality - Backend Processing (PDF/Markdown)** 🔴
* **Task:** Create a backend service that generates export documents (PDF and Markdown initially) from the project's workflow data. Integrate this with Bull Queue for asynchronous processing to prevent timeouts.
* **Files:**
    * `prisma/schema.prisma`: Add `ExportJob` model (id, projectId, userId, format, status, filePath, createdAt, updatedAt).
    * `lib/exportGenerator.ts`: (New file) Logic for generating documents (e.g., using `puppeteer` for PDF, markdown library for MD).
    * `workers/exportWorker.ts`: (New file) Worker to process export jobs from Bull Queue.
    * `app/api/exports/initiate/route.ts`: (New file) API to initiate an export job.
* **Step Dependencies:** Step 3, Step 11, Step 14.
* **User Instructions:**
    * Define `ExportJob` model and migrate DB.
    * Implement document generation logic.
    * Set up a new Bull Queue for export jobs and a corresponding worker.
    * Create an API endpoint to queue export jobs.
* **UX/UI Considerations:**
    * **Export Options:** Clear selection for different formats (PDF, Markdown, Word, JSON - though only PDF/MD implemented here).
    * **Processing State:** "Exporting..." message or a progress indicator for the user.
    * **Notification:** Confirmation message when the export is complete and ready for download/email.
* **Validation:** Initiate a test export from a project. Verify an `ExportJob` is created in the database, the worker processes it, and the output file is generated.
* **Token Usage Estimate:** High
* **Processing Time:** Large
* **Cost Category:** Feature Development

**Step 24: Implement Export Functionality - Email Delivery with Resend** 🟡
* **Task:** Extend the export process to send the generated export document (or a download link) to the user's email address via Resend once the export job is complete.
* **Files:**
    * `lib/emailService.ts`: (New file) Utility for sending emails via Resend.
    * `workers/exportWorker.ts`: Update to include email sending logic upon job completion.
* **Step Dependencies:** Step 9 (Resend setup), Step 23.
* **User Instructions:**
    * Configure Resend email sending utility.
    * Update the export worker to trigger email sending.
* **UX/UI Considerations:**
    * **Email Confirmation:** Inform the user that the export will be emailed to them.
    * **Email Content:** A well-formatted email with a direct download link or attachment.
* **Validation:** Initiate an export. Verify the document is generated and an email containing the export is received by the user.
* **Token Usage Estimate:** Low
* **Processing Time:** Short
* **Cost Category:** Feature Development

### Finalization and Deployment

**Step 25: Implement CI/CD Pipeline (Vercel Integration)** 🟡
* **Task:** Set up a Continuous Integration/Continuous Deployment pipeline, ideally with Vercel for Next.js. Configure automated builds, tests, and deployments upon Git pushes to specific branches.
* **Files:**
    * `.github/workflows/main.yml` (or similar for other CI platforms): (New file) Workflow definition for build and deploy.
    * `vercel.json` (optional): Vercel specific configuration.
* **Step Dependencies:** All previous steps (working application).
* **User Instructions:**
    * Connect your Git repository to Vercel.
    * Configure environment variables on Vercel.
    * Set up a CI/CD workflow (e.g., GitHub Actions).
* **UX/UI Considerations:** None. Deployment infrastructure.
* **Validation:** Push a change to the configured branch and verify that the CI/CD pipeline runs, builds the application, and deploys it successfully to a preview or production environment.
* **Token Usage Estimate:** Medium
* **Processing Time:** Medium
* **Cost Category:** Infrastructure

**Step 26: Environment Management and Rollback Strategy** 🟢
* **Task:** Document the environment variables required for development, staging, and production environments. Define a simple rollback strategy in case of deployment issues.
* **Files:**
    * `docs/environments.md`: (New file) Documentation for environment variables.
    * `docs/rollback-strategy.md`: (New file) Documentation for rollback procedures.
* **Step Dependencies:** Step 25.
* **User Instructions:**
    * Create documentation for environment variables.
    * Outline the steps for rolling back a bad deployment (e.g., using Vercel's rollback features, or Git revert).
* **UX/UI Considerations:** None. Documentation and operational.
* **Validation:** Verify documentation is clear and comprehensive.
* **Token Usage Estimate:** Low
* **Processing Time:** Short
* **Cost Category:** Documentation

---

### Quality Assurance Steps

* [ ] **Code Review Checklist:**
    * Adherence to coding standards (TypeScript, ESLint rules).
    * Readability and maintainability of code.
    * Error handling and edge case considerations.
    * Security best practices (e.g., input sanitization, authentication checks).
    * Performance optimizations (e.g., unnecessary re-renders, large bundle sizes).
* [ ] **Testing Strategy:**
    * Unit tests for critical utility functions and components (e.g., using Jest/React Testing Library).
    * Integration tests for API routes and database interactions.
    * End-to-end tests for user flows (e.g., using Playwright/Cypress).
    * Automated tests integrated into CI/CD pipeline.
* [ ] **Performance Validation:**
    * Page load times and Core Web Vitals monitoring.
    * API response times.
    * Database query performance.
    * Client-side rendering performance and re-renders.
    * Load testing for concurrent users.
* [ ] **Security Review:**
    * OWASP Top 10 vulnerabilities check (XSS, CSRF, Injection).
    * Authentication and authorization robustness.
    * Data encryption (at rest and in transit).
    * Dependency vulnerability scanning.
    * Secure configuration practices.
* [ ] **Accessibility Testing:**
    * WCAG compliance check (keyboard navigation, ARIA attributes, semantic HTML).
    * Color contrast and readability.
    * Screen reader compatibility.
    * Focus management.
    * Automated accessibility scans (e.g., Lighthouse, Axe).