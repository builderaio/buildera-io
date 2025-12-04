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
import Waitlist from "./pages/Waitlist";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import EmailVerificationHandler from "./pages/EmailVerificationHandler";
import CompleteProfile from "./pages/CompleteProfile";
import CompanyDashboard from "./pages/CompanyDashboard";
import ExpertDashboard from "./pages/ExpertDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import NotFound from "./pages/NotFound";

import DeveloperPortal from "./pages/DeveloperPortal";
import CompanyAgents from "./pages/CompanyAgents";
import CompanyAgentView from "./pages/CompanyAgentView";
import SocialCallback from "./pages/SocialCallback";
import { SocialConnectionCallback } from "./pages/SocialConnectionCallback";
import LinkedInCallback from "./pages/LinkedInCallback";
import TikTokCallback from "./pages/TikTokCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCompanies from "./pages/AdminCompanies";
import AdminAIMonitoring from "./pages/AdminAIMonitoring";
import AdminChampionChallenge from "./pages/AdminChampionChallenge";
import AdminAIConfig from "./pages/AdminAIConfig";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminDatabase from "./pages/AdminDatabase";
import AdminFunctionConfig from "./pages/AdminFunctionConfig";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserProfile from "./pages/UserProfile";
import AdminAgentBuilder from "./pages/AdminAgentBuilder";
import AgentMarketplaceV2 from "./pages/AgentMarketplaceV2";
import AdminAPIKeys from "./pages/AdminAPIKeys";
import AdminEmailSystem from "./pages/AdminEmailSystem";
import ResponsiveLayout from "./components/ResponsiveLayout";
import AgentFlowBuilder from "./pages/AgentFlowBuilder";
import CompanyWhiteLabelAgents from "./pages/CompanyWhiteLabelAgents";
import WhiteLabelAnalytics from "./pages/WhiteLabelAnalytics";
import WhiteLabelRevenue from "./pages/WhiteLabelRevenue";
import WhiteLabelKnowledgeBase from "./pages/WhiteLabelKnowledgeBase";
import WhiteLabelVoiceVision from "./pages/WhiteLabelVoiceVision";
import WhiteLabelAPIGenerator from "./pages/WhiteLabelAPIGenerator";
import WhiteLabelABTesting from "./pages/WhiteLabelABTesting";
import WhiteLabelDashboard from "./pages/WhiteLabelDashboard";
import WhiteLabelMarketplace from "./pages/WhiteLabelMarketplace";
import AIWorkforce from "./pages/AIWorkforce";
import AdminAIWorkforce from "./pages/AdminAIWorkforce";
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
                <Route path="/waitlist" element={<Waitlist />} />
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
                  <Route path="/company-dashboard/expertos" element={<Navigate to="/company-dashboard?view=expertos" replace />} />
                  <Route path="/company-dashboard/configuracion" element={<Navigate to="/company-dashboard?view=configuracion" replace />} />
                  <Route path="/company-dashboard/base-conocimiento" element={<Navigate to="/company-dashboard?view=base-conocimiento" replace />} />
                  
                  <Route path="/expert-dashboard" element={<ExpertDashboard />} />
                  <Route path="/developer-dashboard" element={<DeveloperDashboard />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/marketplace/agents" element={<AgentMarketplaceV2 />} />
                  <Route path="/marketplace/whitelabel" element={<WhiteLabelMarketplace />} />
                  <Route path="/agents" element={<AgentMarketplaceV2 />} />
                  {/* Legacy route redirects to new agent view */}
                  <Route path="/marketplace/agents/:templateId/configure" element={<Navigate to="/company/agents" replace />} />
                  <Route path="/company/agents" element={<CompanyAgents />} />
                  <Route path="/company/agents/:agentId" element={<CompanyAgentView />} />
                  <Route path="/company/agent-flow-builder" element={<AgentFlowBuilder />} />
                  <Route path="/company/agent-config/:id" element={<Navigate to="/company/agents" replace />} />
                  <Route path="/company/whitelabel-agents" element={<CompanyWhiteLabelAgents />} />
                  <Route path="/developer/portal" element={<DeveloperPortal />} />
                  <Route path="/developer/dashboard" element={<WhiteLabelDashboard />} />
                  <Route path="/whitelabel/marketplace" element={<WhiteLabelMarketplace />} />
                  <Route path="/whitelabel/agent-builder" element={<AgentFlowBuilder />} />
                  <Route path="/whitelabel/agent-builder/:templateId" element={<AgentFlowBuilder />} />
                  <Route path="/whitelabel/analytics/:templateId" element={<WhiteLabelAnalytics />} />
                  <Route path="/whitelabel/revenue" element={<WhiteLabelRevenue />} />
                  <Route path="/whitelabel/knowledge" element={<WhiteLabelKnowledgeBase />} />
                  <Route path="/whitelabel/voice-vision" element={<WhiteLabelVoiceVision />} />
                  <Route path="/whitelabel/api-docs/:templateId" element={<WhiteLabelAPIGenerator />} />
                  <Route path="/whitelabel/ab-testing" element={<WhiteLabelABTesting />} />
                  <Route path="/whitelabel/dashboard" element={<WhiteLabelDashboard />} />
                  <Route path="/ai-workforce" element={<AIWorkforce />} />
                  {/* Legacy route redirect */}
                  <Route path="/ai-workforce/:agentId" element={<Navigate to="/company/agents" replace />} />
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
                <Route path="/admin/users" element={
                  <AdminProtectedRoute>
                    <AdminUsers />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/companies" element={
                  <AdminProtectedRoute>
                    <AdminCompanies />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/ai-monitoring" element={
                  <AdminProtectedRoute>
                    <AdminAIMonitoring />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/champion-challenge" element={
                  <AdminProtectedRoute>
                    <AdminChampionChallenge />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/ai-config" element={
                  <AdminProtectedRoute>
                    <AdminAIConfig />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <AdminProtectedRoute>
                    <AdminAnalytics />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/database" element={
                  <AdminProtectedRoute>
                    <AdminDatabase />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/function-config" element={
                  <AdminProtectedRoute>
                    <AdminFunctionConfig />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/agent-builder" element={
                  <AdminProtectedRoute>
                    <AdminAgentBuilder />
                  </AdminProtectedRoute>
                } />
                {/* Legacy route redirect */}
                <Route path="/admin/agent-templates" element={<Navigate to="/admin/agent-builder" replace />} />
                <Route path="/admin/agent-templates/*" element={<Navigate to="/admin/agent-builder" replace />} />
                <Route path="/admin/api-keys" element={
                  <AdminProtectedRoute>
                    <AdminAPIKeys />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/email-system" element={
                  <AdminProtectedRoute>
                    <AdminEmailSystem />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/ai-workforce" element={
                  <AdminProtectedRoute>
                    <AdminAIWorkforce />
                  </AdminProtectedRoute>
                } />

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
