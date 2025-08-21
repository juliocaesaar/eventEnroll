import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Users, CreditCard, BarChart3, Bell, Plus, Dice2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/ui/stats-card";
import EventCard from "@/components/ui/event-card";
import TemplateCard from "@/components/ui/template-card";
import AnalyticsChart from "@/components/ui/analytics-chart";
import PaymentMethods from "@/components/ui/payment-methods";
import MobileNav from "@/components/ui/mobile-nav";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Não autorizado",
        description: "Você foi deslogado. Redirecionando para login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
    retry: false,
  }) as { data: any, isLoading: boolean };

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!user,
    retry: false,
  }) as { data: any[], isLoading: boolean };

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  }) as { data: any[] };

  const { data: templates } = useQuery({
    queryKey: ["/api/templates"],
    retry: false,
  }) as { data: any[] };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Usuário';
  const recentEvents = Array.isArray(events) ? events.slice(0, 3) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">EventFlow</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-primary font-medium border-b-2 border-primary pb-1">
                Dashboard
              </Link>
              <Link href="/events" className="text-gray-600 hover:text-gray-900 font-medium">
                Eventos
              </Link>
              <button className="text-gray-600 hover:text-gray-900 font-medium">
                Templates
              </button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">
                Analytics
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>
              <div className="flex items-center space-x-2 cursor-pointer">
                <Avatar className="w-8 h-8" data-testid="avatar-user">
                  <AvatarImage src={user?.profileImageUrl || ''} alt={firstName} />
                  <AvatarFallback>{firstName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-gray-700" data-testid="text-username">
                  {firstName}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Bem-vindo de volta, {firstName}!
              </h1>
              <p className="text-gray-600 mt-1">Gerencie seus eventos e acompanhe o desempenho em tempo real</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline"
                onClick={() => setLocation('/editor')}
                data-testid="button-create-event"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Evento
              </Button>
              <Button 
                onClick={() => setLocation('/editor')}
                data-testid="button-quick-editor"
              >
                <Dice2 className="w-4 h-4 mr-2" />
                Editor Rápido
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Eventos"
            value={statsLoading ? "..." : (stats?.totalEvents?.toString() || "0")}
            change="+12% este mês"
            icon={Calendar}
            color="primary"
            data-testid="stats-total-events"
          />
          <StatsCard
            title="Participantes"
            value={statsLoading ? "..." : (stats?.totalParticipants?.toString() || "0")}
            change="+28% este mês"
            icon={Users}
            color="secondary"
            data-testid="stats-total-participants"
          />
          <StatsCard
            title="Receita"
            value={statsLoading ? "..." : (stats?.totalRevenue || "R$ 0")}
            change="+18% este mês"
            icon={CreditCard}
            color="accent"
            data-testid="stats-total-revenue"
          />
          <StatsCard
            title="Taxa de Conversão"
            value={statsLoading ? "..." : (stats?.conversionRate || "0%")}
            change="+5,2% este mês"
            icon={BarChart3}
            color="purple"
            data-testid="stats-conversion-rate"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Events & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recent Events */}
            <Card data-testid="card-recent-events">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Eventos Recentes</CardTitle>
                  <Link href="/events">
                    <Button variant="ghost" size="sm" data-testid="button-view-all-events">
                      Ver todos
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {eventsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentEvents.length > 0 ? (
                  <div className="divide-y">
                    {recentEvents.map((event: any) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum evento criado ainda</p>
                    <Button 
                      className="mt-2" 
                      size="sm" 
                      onClick={() => setLocation('/editor')}
                      data-testid="button-create-first-event"
                    >
                      Criar Primeiro Evento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Selector */}
            <Card data-testid="card-template-selector">
              <CardHeader className="border-b">
                <CardTitle>Crie um Novo Evento</CardTitle>
                <p className="text-sm text-gray-600">Escolha um template profissional para começar rapidamente</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.isArray(categories) ? categories.slice(0, 4).map((category: any) => {
                    const categoryTemplates = Array.isArray(templates) ? templates.filter((t: any) => t.categoryId === category.id) : [];
                    return (
                      <TemplateCard
                        key={category.id}
                        category={category}
                        templateCount={categoryTemplates.length}
                        onClick={() => setLocation(`/editor?category=${category.id}`)}
                      />
                    );
                  }) : null}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Analytics & Payment Methods */}
          <div className="space-y-6">
            
            {/* Analytics Chart */}
            <AnalyticsChart />

            {/* Payment Methods */}
            <PaymentMethods />

            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardHeader className="border-b">
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3 h-auto"
                  data-testid="button-generate-qr"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Gerar QR Code</p>
                    <p className="text-xs text-gray-500">Para check-in rápido</p>
                  </div>
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3 h-auto"
                  data-testid="button-send-email"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Enviar Email</p>
                    <p className="text-xs text-gray-500">Comunicação em massa</p>
                  </div>
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3 h-auto"
                  data-testid="button-export-data"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Exportar Dados</p>
                    <p className="text-xs text-gray-500">Relatórios e listas</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>

      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
