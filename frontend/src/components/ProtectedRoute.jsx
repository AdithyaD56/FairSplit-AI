import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import RocketLoader from "./RocketLoader";
import { useAuth } from "../context/AuthContext";

function LoadingState() {
  return (
    <RocketLoader title="Checking your session" subtitle="Hold on while we verify your account access." />
  );
}

export default function ProtectedRoute({ children, role }) {
  const { user, authLoading } = useAuth();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setShowLoader(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowLoader(true);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [authLoading]);

  if (authLoading && showLoader) {
    return <LoadingState />;
  }

  if (authLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
