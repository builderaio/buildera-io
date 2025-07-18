import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import Waitlist from "./pages/Waitlist";
import LinkedInCallback from "./pages/LinkedInCallback";
import TikTokCallback from "./pages/TikTokCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
