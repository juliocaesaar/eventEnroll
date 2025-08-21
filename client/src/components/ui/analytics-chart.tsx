import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export default function AnalyticsChart() {
  // Mock data for demonstration - in real app, this would come from API
  const mockData = {
    todayRegistrations: 47,
    weeklyGrowth: '+23%',
  };

  return (
    <Card data-testid="card-analytics-chart">
      <CardHeader className="border-b">
        <CardTitle>Analytics em Tempo Real</CardTitle>
        <p className="text-sm text-gray-600">Últimos 30 dias</p>
      </CardHeader>
      <CardContent className="p-6">
        {/* Chart Placeholder */}
        <div className="h-48 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-600">Gráfico de Inscrições</p>
            <p className="text-xs text-gray-500 mt-1">
              Implementação futura com dados reais
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center" data-testid="analytics-today-registrations">
            <p className="text-lg font-bold text-gray-900">{mockData.todayRegistrations}</p>
            <p className="text-xs text-gray-500">Hoje</p>
          </div>
          <div className="text-center" data-testid="analytics-weekly-growth">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="w-3 h-3 text-secondary" />
              <p className="text-lg font-bold text-gray-900">{mockData.weeklyGrowth}</p>
            </div>
            <p className="text-xs text-gray-500">Esta semana</p>
          </div>
        </div>

        {/* Chart Implementation Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Próximos passos:</strong> Integração com Chart.js ou Recharts para visualização de dados em tempo real
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
