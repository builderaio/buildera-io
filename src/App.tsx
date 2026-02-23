import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import OnboardingOrchestrator from "./components/OnboardingOrchestrator";
import { SecurityProvider } from "./components/SecurityProvider";
import VersionUpdateNotification from "./components/VersionUpdateNotification";
import SupportChatWidget from "./components/SupportChatWidget";
import CacheManager from "./components/CacheManager";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Index from "./pages/Index";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import EmailVerificationHandler from "./pages/EmailVerificationHandler";
import CompleteProfile from "./pages/CompleteProfile";
import CompanyDashboard from "./pages/CompanyDashboard";
import NotFound from "./pages/NotFound";

import CompanyAgents from "./pages/CompanyAgents";
import CompanyAgentView from "./pages/CompanyAgentView";
import SocialCallback from "./pages/SocialCallback";
import { SocialConnectionCallback } from "./pages/SocialConnectionCallback";
import LinkedInCallback from "./pages/LinkedInCallback";
import TikTokCallback from "./pages/TikTokCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Pricing from "./pages/Pricing";
import Governance from "./pages/Governance";
import Contacto from "./pages/Contacto";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCustomers from "./pages/AdminCustomers";
import AdminAIConfig from "./pages/AdminAIConfig";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserProfile from "./pages/UserProfile";
import AdminAgentBuilder from "./pages/AdminAgentBuilder";
import AdminAgentPerformance from "./pages/AdminAgentPerformance";
import AdminSystem from "./pages/AdminSystem";
import AgentMarketplaceV2 from "./pages/AgentMarketplaceV2";
import ResponsiveLayout from "./components/ResponsiveLayout";
import InviteAccept from "./pages/InviteAccept";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AdminAuthProvider>
        <SecurityProvider>
          <CompanyProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
              <VersionUpdateNotification />
              <SupportChatWidget user={null} />
              <CacheManager />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/auth/verify-email/:token" element={<EmailVerificationHandler />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/auth/social-callback" element={<SocialCallback />} />
                <Route path="/marketing-hub/connections/callback" element={<SocialConnectionCallback />} />
                <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
                <Route path="/auth/tiktok/callback" element={<TikTokCallback />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/governance" element={<Governance />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/invite/:token" element={<InviteAccept />} />
                
                {/* Authenticated Routes with Layout */}
                <Route element={<ResponsiveLayout />}>
                  <Route path="/company-dashboard" element={<CompanyDashboard />} />
                  
                  {/* Redirects de compatibilidad para path segments → query params */}
                  <Route path="/company-dashboard/ai-workforce" element={<Navigate to="/company-dashboard?view=ai-workforce" replace />} />
                  <Route path="/company-dashboard/adn-empresa" element={<Navigate to="/company-dashboard?view=adn-empresa" replace />} />
                  <Route path="/company-dashboard/mando-central" element={<Navigate to="/company-dashboard?view=mando-central" replace />} />
                  <Route path="/company-dashboard/marketing-hub" element={<Navigate to="/company-dashboard?view=marketing-hub" replace />} />
                  <Route path="/company-dashboard/inteligencia-competitiva" element={<Navigate to="/company-dashboard?view=inteligencia-competitiva" replace />} />
                  <Route path="/company-dashboard/academia-buildera" element={<Navigate to="/company-dashboard?view=academia-buildera" replace />} />
                  {/* /company-dashboard/expertos removed - obsolete */}
                  <Route path="/company-dashboard/configuracion" element={<Navigate to="/company-dashboard?view=configuracion" replace />} />
                  <Route path="/company-dashboard/base-conocimiento" element={<Navigate to="/company-dashboard?view=base-conocimiento" replace />} />
                  
                  {/* expert-dashboard and developer-dashboard removed - obsolete */}
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/marketplace/agents" element={<AgentMarketplaceV2 />} />
                  <Route path="/agents" element={<AgentMarketplaceV2 />} />
                  {/* Legacy route redirects to new agent view */}
                  <Route path="/marketplace/agents/:templateId/configure" element={<Navigate to="/company/agents" replace />} />
                  <Route path="/company/agents" element={<CompanyAgents />} />
                  <Route path="/company/agents/:agentId" element={<CompanyAgentView />} />
                  <Route path="/company/agent-config/:id" element={<Navigate to="/company/agents" replace />} />
                  {/* Legacy route redirects */}
                  <Route path="/ai-workforce" element={<Navigate to="/company-dashboard?view=ai-workforce" replace />} />
                  <Route path="/ai-workforce/:agentId" element={<Navigate to="/company/agents" replace />} />
                  <Route path="/whitelabel/*" element={<Navigate to="/company-dashboard" replace />} />
                  <Route path="/developer/*" element={<Navigate to="/company-dashboard" replace />} />
                  <Route path="/expert-dashboard" element={<Navigate to="/company-dashboard" replace />} />
                </Route>
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/customers" element={
                  <AdminProtectedRoute>
                    <AdminCustomers />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/ai-config" element={
                  <AdminProtectedRoute>
                    <AdminAIConfig />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/agent-builder" element={
                  <AdminProtectedRoute>
                    <AdminAgentBuilder />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/agent-performance" element={
                  <AdminProtectedRoute>
                    <AdminAgentPerformance />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/system" element={
                  <AdminProtectedRoute>
                    <AdminSystem />
                  </AdminProtectedRoute>
                } />
                {/* Legacy route redirects */}
                <Route path="/admin/users" element={<Navigate to="/admin/customers" replace />} />
                <Route path="/admin/companies" element={<Navigate to="/admin/customers" replace />} />
                <Route path="/admin/subscriptions" element={<Navigate to="/admin/customers" replace />} />
                <Route path="/admin/analytics" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/api-keys" element={<Navigate to="/admin/ai-config" replace />} />
                <Route path="/admin/ai-monitoring" element={<Navigate to="/admin/ai-config" replace />} />
                <Route path="/admin/champion-challenge" element={<Navigate to="/admin/ai-config" replace />} />
                <Route path="/admin/function-config" element={<Navigate to="/admin/ai-config" replace />} />
                <Route path="/admin/database" element={<Navigate to="/admin/system" replace />} />
                <Route path="/admin/email-system" element={<Navigate to="/admin/system" replace />} />
                <Route path="/admin/agent-usage" element={<Navigate to="/admin/agent-performance" replace />} />
                <Route path="/admin/agent-templates" element={<Navigate to="/admin/agent-builder" replace />} />
                <Route path="/admin/agent-templates/*" element={<Navigate to="/admin/agent-builder" replace />} />
                <Route path="/admin/ai-workforce" element={<Navigate to="/admin/agent-builder" replace />} />

                {/* Onboarding Routes */}
                <Route path="/auth/onboarding" element={user ? <OnboardingOrchestrator user={user} /> : <div>Loading...</div>} />
                <Route path="/onboarding" element={<Navigate to="/company-dashboard?view=onboarding" replace />} />
                <Route path="/auth/authenticated" element={<AuthenticatedLayout />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CompanyProvider>
      </SecurityProvider>
    </AdminAuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);
}

export default App;
