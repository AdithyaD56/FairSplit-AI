import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigationType } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import CustomCursor from "./components/CustomCursor";
import RocketLoader from "./components/RocketLoader";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import DeveloperPage from "./pages/DeveloperPage";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import PrivacyPage from "./pages/PrivacyPage";
import ReviewsPage from "./pages/ReviewsPage";
import SettlementsPage from "./pages/SettlementsPage";
import TermsPage from "./pages/TermsPage";
import TravelPlannerPage from "./pages/TravelPlannerPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TripDetailPage from "./pages/TripDetailPage";
import TripsPage from "./pages/TripsPage";
import UserManualPage from "./pages/UserManualPage";

function routeLabel(pathname) {
  if (pathname.startsWith("/trip-planner")) return "Opening the travel workspace";
  if (pathname.startsWith("/travel-hub")) return "Redirecting to travel workspace";
  if (pathname.startsWith("/trips/")) return "Opening trip draft";
  if (pathname.startsWith("/trips")) return "Loading trip drafts";
  if (pathname.startsWith("/history")) return "Loading split history";
  if (pathname.startsWith("/developers")) return "Opening developer details";
  if (pathname.startsWith("/privacy")) return "Opening privacy policy";
  if (pathname.startsWith("/terms")) return "Opening terms and conditions";
  if (pathname.startsWith("/user-manual")) return "Opening the user manual";
  if (pathname.startsWith("/reviews")) return "Opening reviews";
  if (pathname.startsWith("/dashboard")) return "Opening the splitter";
  if (pathname.startsWith("/admin")) return "Opening admin controls";
  if (pathname.startsWith("/auth/callback")) return "Bringing your social login back into FairSplit";
  if (pathname.startsWith("/auth/reset-password")) return "Resetting your password";
  if (pathname.startsWith("/auth")) return "Loading secure access";
  return "Preparing the next page";
}

function routeRank(pathname) {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/auth")) return 1;
  if (pathname.startsWith("/dashboard")) return 2;
  if (pathname.startsWith("/trip-planner") || pathname.startsWith("/travel-hub")) return 3;
  if (pathname.startsWith("/reviews")) return 4;
  if (pathname.startsWith("/trips")) return 5;
  if (pathname.startsWith("/trips/")) return 6;
  if (pathname.startsWith("/developers")) return 7;
  if (pathname.startsWith("/history")) return 8;
  if (pathname.startsWith("/privacy")) return 9;
  if (pathname.startsWith("/terms")) return 10;
  if (pathname.startsWith("/user-manual")) return 11;
  if (pathname.startsWith("/admin")) return 12;
  return 100;
}

function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/developers" element={<DeveloperPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/user-manual" element={<UserManualPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <ReviewsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/travel-hub"
        element={
          <ProtectedRoute>
            <Navigate to="/trip-planner" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <TripsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trip-planner"
        element={
          <ProtectedRoute>
            <TravelPlannerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:tripId"
        element={
          <ProtectedRoute>
            <TripDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settlements"
        element={
          <ProtectedRoute>
            <SettlementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState("page-enter route-forward");
  const [showLoader, setShowLoader] = useState(false);

  const routeTitle = useMemo(() => routeLabel(location.pathname), [location.pathname]);

  useEffect(() => {
    const current = `${location.pathname}${location.search}`;
    const displayed = `${displayLocation.pathname}${displayLocation.search}`;
    if (current === displayed) return;

    const previousRank = routeRank(displayLocation.pathname);
    const nextRank = routeRank(location.pathname);
    const direction =
      navigationType === "POP" ? "route-backward" : nextRank < previousRank ? "route-backward" : "route-forward";

    setStage(`page-exit ${direction}`);
    setShowLoader(false);

    const revealLoaderTimer = window.setTimeout(() => {
      setShowLoader(true);
    }, 420);

    const switchTimer = window.setTimeout(() => {
      setDisplayLocation(location);
      setStage(`page-enter ${direction}`);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 180);

    const hideLoaderTimer = window.setTimeout(() => {
      setShowLoader(false);
    }, 760);

    return () => {
      window.clearTimeout(revealLoaderTimer);
      window.clearTimeout(switchTimer);
      window.clearTimeout(hideLoaderTimer);
    };
  }, [location, displayLocation, navigationType]);

  return (
    <>
      <CustomCursor />
      {showLoader ? (
        <div className="route-loader-layer">
          <RocketLoader title={routeTitle} subtitle="Smoothly moving you to the next part of FairSplit." />
        </div>
      ) : null}
      <div className={`route-stage ${stage}`}>
        <AppRoutes location={displayLocation} />
      </div>
    </>
  );
}
