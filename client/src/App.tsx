import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import EventEditor from "@/pages/event-editor";
import EventPublic from "@/pages/event-public";
import PaymentMock from "@/pages/payment-mock";
import Participants from "@/pages/participants";
import Analytics from "@/pages/analytics";
import Pricing from "@/pages/pricing";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - accessible without auth */}
      <Route path="/event/:slug" component={EventPublic} />
      <Route path="/payment/mock" component={PaymentMock} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/pricing" component={Pricing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/events" component={Events} />
          <Route path="/events/:id/edit" component={EventEditor} />
          <Route path="/events/:eventId/participants" component={Participants} />
          <Route path="/events/:eventId/analytics" component={Analytics} />
          <Route path="/editor" component={EventEditor} />
          <Route path="/pricing" component={Pricing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
