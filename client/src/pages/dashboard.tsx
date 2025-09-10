import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Users, CreditCard, BarChart3, Dice2, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/ui/stats-card";
import EventCard from "@/components/ui/event-card";
import TemplateCard from "@/components/ui/template-card";
import AnalyticsChart from "@/components/ui/analytics-chart";
import Layout from "@/components/layout/Layout";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { usePusher } from "@/hooks/usePusher";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected } = usePusher();
  const { addNotification } = useGlobalNotifications();

  // Função para testar Pusher (apenas em desenvolvimento)
  const testPusher = async () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const response = await fetch('/api/pusher/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Teste Enviado! 🧪",
          description: "Notificação de teste enviada via Pusher",
        });
      } else {
        toast({
          title: "Erro no Teste",
          description: result.message || "Erro ao enviar teste",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao testar Pusher:', error);
      toast({
        title: "Erro no Teste",
        description: "Erro ao conectar com o servidor",
        variant: "destructive"
      });
    }
  };

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

  const firstName = (user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'Usuário';
  const recentEvents = Array.isArray(events) ? events.slice(0, 3) : [];

  return (
    <Layout currentPage="dashboard">
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
                  Bem-vindo de volta, {firstName}!
                </h1>
                
                {/* Status da conexão Pusher */}
                <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    {isConnected ? 'Tempo Real' : 'Offline'}
                  </span>
                </div>
              </div>
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
              {user?.role === 'admin' && process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/pix-test')}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  title="Testar integração PIX"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Teste PIX
                </Button>
              )}
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
    </Layout>
  );
}
