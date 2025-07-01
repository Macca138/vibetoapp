import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@/auth/AuthProvider";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/ProjectView";
import PlanningWizard from "./pages/PlanningWizard";

export default function Router() {
  return (
    <>
      <SignedOut>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SignedOut>
      
      <SignedIn>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
          <Route path="/project/:projectId/step/:stepId" element={<PlanningWizard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SignedIn>
    </>
  );
}