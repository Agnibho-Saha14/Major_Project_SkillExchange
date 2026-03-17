// ProtectedRoute.jsx
import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const { isSignedIn, user, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) return <div>Loading...</div>;

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check if onboarding is complete
  const hasOnboarded = user?.unsafeMetadata?.onboardingComplete === true;
  
  // If they haven't onboarded and aren't already on the onboarding page, send them there
  if (!hasOnboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If they HAVE onboarded but try to go back to the onboarding page, send to dashboard/home
  if (hasOnboarded && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}