import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute, AdminRoute, OrganizerRoute, ManagerRoute, NonManagerRoute } from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import React from "react";
import Landing from "@/pages/landing";

// Componente para redirecionamento inteligente baseado no role
function SmartRedirect() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    console.log('SmartRedirect - User role:', (user as any)?.role);
    if ((user as any)?.role === 'manager') {
      console.log('Redirecting manager to /groups/dashboard');
      setLocation('/groups/dashboard');
    } else {
      console.log('Redirecting to /dashboard');
      setLocation('/dashboard');
    }
  }, [(user as any)?.role, setLocation]);
  
  return null;
}
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import EventEditor from "@/pages/event-editor";
import EventDetails from "@/pages/event-details";
import EventPublic from "@/pages/event-public";
import PaymentMock from "@/pages/payment-mock";
import Participants from "@/pages/participants";
import Analytics from "@/pages/analytics";
import Pricing from "@/pages/pricing";
import RegistrationConfirmation from "@/pages/registration-confirmation";
import EventGroups from "@/pages/event-groups";
import EventPayments from "@/pages/event-payments";
import EventParticipants from "@/pages/event-participants";
import GroupPayments from "@/pages/group-payments";
import GroupDashboard from "@/pages/group-dashboard";
import GroupManagement from "@/pages/group-management";
import ParticipantDetails from "@/pages/participant-details";
import UserManagement from "@/pages/admin/users";
import RoleManagement from "@/pages/admin/roles";
import PIXTest from "@/pages/pix-test";
import RegistrationTerms from "@/pages/registration-terms";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Logout from "@/pages/logout";
import PaymentConfirmation from "@/pages/payment-confirmation";

// Wrapper components for authenticated pages
const AuthenticatedPage = ({ children }: { children: React.ReactNode }) => (
  <MainLayout>{children}</MainLayout>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    if ((user as any)?.role === 'manager') {
      console.log('Manager accessing /dashboard - redirecting to /groups/dashboard');
      setLocation('/groups/dashboard');
    }
  }, [(user as any)?.role, setLocation]);
  
  return (
    <AuthenticatedPage>
      <Dashboard />
    </AuthenticatedPage>
  );
};


const EventsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <Events />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const EventDetailsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <EventDetails />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const EventEditorPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <EventEditor />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const ParticipantsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <Participants />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const AnalyticsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <Analytics />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const EventGroupsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <EventGroups />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const EventPaymentsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <EventPayments />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const EventParticipantsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <EventParticipants />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const GroupPaymentsPage = () => (
  <NonManagerRoute>
    <AuthenticatedPage>
      <GroupPayments />
    </AuthenticatedPage>
  </NonManagerRoute>
);

const GroupDashboardPage = () => (
  <AuthenticatedPage>
    <GroupDashboard />
  </AuthenticatedPage>
);

const GroupManagementPage = () => (
  <AuthenticatedPage>
    <GroupManagement />
  </AuthenticatedPage>
);

const ParticipantDetailsPage = () => (
  <AuthenticatedPage>
    <ParticipantDetails />
  </AuthenticatedPage>
);

const UserManagementPage = () => (
  <AdminRoute>
    <AuthenticatedPage>
      <UserManagement />
    </AuthenticatedPage>
  </AdminRoute>
);

const RoleManagementPage = () => (
  <AdminRoute>
    <AuthenticatedPage>
      <RoleManagement />
    </AuthenticatedPage>
  </AdminRoute>
);

const PIXTestPage = () => (
  <AdminRoute>
    <AuthenticatedPage>
      <PIXTest />
    </AuthenticatedPage>
  </AdminRoute>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - accessible without auth */}
      <Route path="/event/:slug" component={EventPublic} />
      <Route path="/registration/terms/:slug" component={RegistrationTerms} />
      <Route path="/payment/mock" component={PaymentMock} />
      <Route path="/payment/confirmation" component={PaymentConfirmation} />
      <Route path="/registration/confirmation" component={RegistrationConfirmation} />
      
      {/* Auth routes - redirect if already authenticated */}
      {!isAuthenticated && (
        <>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </>
      )}
      
      {/* Redirect authenticated users away from login/register */}
      {isAuthenticated && (
        <>
          <Route path="/login">
            {() => {
              window.location.href = '/dashboard';
              return null;
            }}
          </Route>
          <Route path="/register">
            {() => {
              window.location.href = '/dashboard';
              return null;
            }}
          </Route>
        </>
      )}
      
      <Route path="/logout" component={Logout} />
      
      {/* Public routes - always accessible */}
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      
      {/* Authenticated routes */}
      {isAuthenticated && (
        <>
          <Route path="/" component={SmartRedirect} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/events" component={EventsPage} />
          <Route path="/events/:eventId" component={EventDetailsPage} />
          <Route path="/events/:eventId/edit" component={EventEditorPage} />
          <Route path="/events/:eventId/participants" component={ParticipantsPage} />
          <Route path="/events/:eventId/analytics" component={AnalyticsPage} />
          <Route path="/events/:eventId/groups" component={EventGroupsPage} />
          <Route path="/events/:eventId/payments" component={EventPaymentsPage} />
          <Route path="/events/:eventId/participants-new" component={EventParticipantsPage} />
          <Route path="/group-payments" component={GroupPaymentsPage} />
          <Route path="/groups/dashboard" component={GroupDashboardPage} />
          <Route path="/groups/:groupId/manage" component={GroupManagementPage} />
          <Route path="/groups/:groupId/participants/:participantId" component={ParticipantDetailsPage} />
          <Route path="/admin/users" component={UserManagementPage} />
          <Route path="/admin/roles" component={RoleManagementPage} />
          <Route path="/pix-test" component={PIXTestPage} />
          <Route path="/editor" component={EventEditorPage} />
        </>
      )}
      
      {/* Redirect unauthenticated users to login */}
      {!isAuthenticated && (
        <Route path="/dashboard">
          {() => {
            window.location.href = '/login';
            return null;
          }}
        </Route>
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
