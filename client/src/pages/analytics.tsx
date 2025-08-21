import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Calendar,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { user } = useAuth();
  const params = useParams<{ eventId: string }>();
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch analytics data
  const { data: analytics, refetch, isLoading } = useQuery({
    queryKey: [`/api/events/${params.eventId}/analytics`, timeRange],
  });

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: [`/api/events/${params.eventId}`],
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Carregando...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mockAnalytics = analytics || {
    overview: {
      totalRegistrations: 127,
      totalRevenue: 4250.00,
      conversionRate: 8.5,
      avgTicketValue: 33.46,
      registrationsGrowth: 12.5,
      revenueGrowth: 18.2
    },
    registrationsByDay: [
      { date: '2025-08-15', registrations: 12, revenue: 380.00 },
      { date: '2025-08-16', registrations: 18, revenue: 560.00 },
      { date: '2025-08-17', registrations: 25, revenue: 825.00 },
      { date: '2025-08-18', registrations: 31, revenue: 995.00 },
      { date: '2025-08-19', registrations: 22, revenue: 730.00 },
      { date: '2025-08-20', registrations: 19, revenue: 760.00 },
    ],
    ticketTypes: [
      { name: 'VIP', value: 45, revenue: 2250.00 },
      { name: 'Comum', value: 67, revenue: 1675.00 },
      { name: 'Estudante', value: 15, revenue: 225.00 },
    ],
    trafficSources: [
      { source: 'Direto', visitors: 245, conversions: 38 },
      { source: 'Redes Sociais', visitors: 189, conversions: 42 },
      { source: 'WhatsApp', visitors: 156, conversions: 28 },
      { source: 'Email', visitors: 89, conversions: 19 },
    ]
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-analytics-title">
                Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                {event?.title} - Métricas e insights detalhados
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" data-testid="button-export-analytics">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inscrições</p>
                  <p className="text-3xl font-bold text-gray-900">{mockAnalytics.overview.totalRegistrations}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 ml-1">
                      +{mockAnalytics.overview.registrationsGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(mockAnalytics.overview.totalRevenue)}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 ml-1">
                      +{mockAnalytics.overview.revenueGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-gray-900">{mockAnalytics.overview.conversionRate}%</p>
                  <p className="text-sm text-gray-600 mt-2">Visitantes → Inscritos</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(mockAnalytics.overview.avgTicketValue)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Por participante</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="registrations">Inscrições por Dia</TabsTrigger>
            <TabsTrigger value="tickets">Tipos de Ingresso</TabsTrigger>
            <TabsTrigger value="traffic">Fontes de Tráfego</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle>Inscrições e Receita por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockAnalytics.registrationsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        labelFormatter={(label) => formatDate(label)}
                        formatter={[
                          (value: number, name: string) => [
                            name === 'revenue' ? formatCurrency(value) : value,
                            name === 'registrations' ? 'Inscrições' : 'Receita'
                          ]
                        ]}
                      />
                      <Bar yAxisId="left" dataKey="registrations" fill="#3B82F6" name="registrations" />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo de Ingresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockAnalytics.ticketTypes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {mockAnalytics.ticketTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receita por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.ticketTypes.map((ticket, index) => (
                      <div key={ticket.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium">{ticket.name}</p>
                            <p className="text-sm text-gray-600">{ticket.value} vendidos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(ticket.revenue)}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(ticket.revenue / ticket.value)} cada
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traffic">
            <Card>
              <CardHeader>
                <CardTitle>Fontes de Tráfego e Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.trafficSources.map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                        >
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{source.source}</p>
                          <p className="text-sm text-gray-600">{source.visitors} visitantes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{source.conversions} conversões</p>
                        <Badge variant="secondary">
                          {((source.conversions / source.visitors) * 100).toFixed(1)}% taxa
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}