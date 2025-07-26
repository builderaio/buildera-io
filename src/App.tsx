import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import SupportChatWidget from "@/components/SupportChatWidget";
import VersionUpdateNotification from "@/components/VersionUpdateNotification";
import CacheManager from "@/components/CacheManager";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import Waitlist from "./pages/Waitlist";
import LinkedInCallback from "./pages/LinkedInCallback";
import TikTokCallback from "./pages/TikTokCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAIMonitoring from "./pages/AdminAIMonitoring";
import AdminChampionChallenge from "./pages/AdminChampionChallenge";
import AdminAIConfig from "./pages/AdminAIConfig";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminDatabase from "./pages/AdminDatabase";
import AdminFunctionConfig from "./pages/AdminFunctionConfig";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserProfile from "./pages/UserProfile";
import AdminAgentTemplates from "./pages/AdminAgentTemplates";
import AdminCreateAgentTemplate from "./pages/AdminCreateAgentTemplate";
import AgentMarketplace from "./pages/AgentMarketplace";
import CompanyAgents from "./pages/CompanyAgents";
import AgentConfigWizard from "./pages/AgentConfigWizard";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AdminAuthProvider>
          <TooltipProvider>
            <CacheManager />
            <VersionUpdateNotification />
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/company-dashboard" element={<CompanyDashboard />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
              <Route path="/auth/tiktok/callback" element={<TikTokCallback />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/profile" element={<UserProfile />} />
              
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
              <Route path="/admin/agent-templates" element={
                <AdminProtectedRoute>
                  <AdminAgentTemplates />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/agent-templates/create" element={
                <AdminProtectedRoute>
                  <AdminCreateAgentTemplate />
                </AdminProtectedRoute>
              } />
              
              {/* Company Routes */}
              <Route path="/marketplace/agents" element={<AgentMarketplace />} />
              <Route path="/marketplace/agents/:templateId/configure" element={<AgentConfigWizard />} />
              <Route path="/company/agents" element={<CompanyAgents />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* Chat widget de soporte para usuarios autenticados */}
            <SupportChatWidget user={user} />
            </BrowserRouter>
          </TooltipProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
