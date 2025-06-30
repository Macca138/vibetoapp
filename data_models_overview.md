git# Data Models Overview

This document provides a consolidated overview of the core data models used in the application, defined using Prisma ORM. These models represent the primary entities and their relationships within the application's PostgreSQL database.

## 1. `User` Model

Represents a user of the application.

```prisma
model User {
  id             String    @id @default(auto()) @map("_id") @db.ObjectId
  name           String?
  email          String    @unique
  emailVerified  DateTime?
  passwordHash   String?   // For credential provider
  image          String?   // For social logins
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  accounts       Account[]
  sessions       Session[]
  projects       Project[]
  waitlistEntries WaitlistEntry[] // If linking waitlist to user after signup
  subscriptions  UserSubscription[]
  exportJobs     ExportJob[]
}
2. Project Model
Represents an individual app idea project created by a user.

Code snippet

model Project {
  id            String         @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  userId        String         @map("userId") @db.ObjectId
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  workflowSteps WorkflowStep[]
  dataFlowRelationships DataFlowRelationship[]
  exportJobs    ExportJob[]
}
3. WorkflowStep Model
Represents the state and data for each of the 9 steps in the guided workflow within a project.

Code snippet

model WorkflowStep {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  projectId String   @map("projectId") @db.ObjectId
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  stepNumber Int
  status    String   // e.g., "pending", "in-progress", "completed"
  data      Json     // Stores the specific data for this step (e.g., AI output, user edits)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, stepNumber])
}
4. DataFlowRelationship Model
Defines how data should be automatically transferred or mapped between different workflow steps within a project.

Code snippet

model DataFlowRelationship {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  projectId    String   @map("projectId") @db.ObjectId
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceStepId String   @map("sourceStepId") @db.ObjectId
  targetStepId String   @map("targetStepId") @db.ObjectId
  fieldMapping Json     // JSON object defining source field to target field mappings
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
5. WaitlistEntry Model
Stores information for users who have signed up for the waitlist on the landing page.

Code snippet

model WaitlistEntry {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  email     String    @unique
  createdAt DateTime  @default(now())
}
6. UserSubscription Model
Manages user subscription information for the hybrid pricing system.

Code snippet

model UserSubscription {
  id               String    @id @default(auto()) @map("_id") @db.ObjectId
  userId           String    @unique @map("userId") @db.ObjectId
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId String?   @unique
  status           String    // e.g., "active", "canceled", "past_due"
  currentPeriodEnd DateTime? // For subscriptions
  type             String    // e.g., "project_based", "monthly_subscription"
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
7. ExportJob Model
Tracks the status of export requests (e.g., PDF, Markdown generation).

Code snippet

model ExportJob {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  projectId String   @map("projectId") @db.ObjectId
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String   @map("userId") @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  format    String   // e.g., "PDF", "Markdown"
  status    String   // e.g., "pending", "processing", "completed", "failed"
  filePath  String?  // Path to the generated file if stored on disk/cloud
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
8. Account Model (from NextAuth.js)
Stores user account information for different authentication providers.

Code snippet

model Account {
  id                String  @id @default(auto()) @map("_id") @db.ObjectId
  userId            String  @map("userId") @db.ObjectId
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.String
  access_token      String? @db.String
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.String
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
9. Session Model (from NextAuth.js)
Stores user session information.

Code snippet

model Session {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionToken String   @unique
  userId       String   @map("userId") @db.ObjectId
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}