import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Navigation from "./components/layout/Navigation";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import CrossedPaths from "./pages/CrossedPaths";
import Feedback from "./pages/Feedback";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import ExploreEvents from "./pages/ExploreEvents";
import TestAuthSystem from "./components/auth/TestAuthSystem";
import RoleDebugger from "./components/auth/RoleDebugger";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background dark">
            <Routes>
              <Route path="/auth" element={<div>Auth page rendered by ProtectedRoute</div>} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigation />
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <Navigation />
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/create-event" element={
                <ProtectedRoute>
                  <Navigation />
                  <CreateEvent />
                </ProtectedRoute>
              } />
              <Route path="/explore" element={
                <ProtectedRoute>
                  <Navigation />
                  <ExploreEvents />
                </ProtectedRoute>
              } />
              <Route path="/crossed-paths" element={
                <ProtectedRoute>
                  <Navigation />
                  <CrossedPaths />
                </ProtectedRoute>
              } />
              <Route path="/feedback" element={
                <ProtectedRoute>
                  <Navigation />
                  <Feedback />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Navigation />
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <Navigation />
                  <Subscription />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedAdminRoute requireSuperAdmin={false}>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/events" element={
                <ProtectedAdminRoute>
                  <AdminEvents />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/test-auth" element={
                <TestAuthSystem />
              } />
              <Route path="/debug-role" element={
                <RoleDebugger />
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
