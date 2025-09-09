import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { usePaymentPlans, usePaymentAnalytics, useOverdueInstallments } from '../hooks/usePayments';
import { useEventGroups } from '../hooks/useEventGroups';
import { PaymentInstallments } from '../components/ui/payment-installments';
import { DollarSign, AlertTriangle, TrendingUp, Users, Calendar } from 'lucide-react';

export default function EventPayments() {
  const params = useParams();
  const eventId = params.eventId;
  const { groups } = useEventGroups(eventId);
  const { plans, isLoading: plansLoading } = usePaymentPlans(eventId);
  const { analytics, isLoading: analyticsLoading } = usePaymentAnalytics(eventId);
  const { overdueInstallments, recalculateLateFees, isRecalculating } = useOverdueInstallments(eventId);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  if (!eventId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">ID do evento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciar Pagamentos
        </h1>
        <p className="text-gray-600">
          Acompanhe e gerencie os pagamentos dos participantes do evento.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Esperado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsLoading ? '...' : analytics?.totalExpected || 'R$ 0,00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pago</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsLoading ? '...' : analytics?.totalPaid || 'R$ 0,00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Em Atraso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsLoading ? '...' : analytics?.overdueAmount || 'R$ 0,00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Parcelas Pagas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsLoading ? '...' : analytics?.paidCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => recalculateLateFees()}
                disabled={isRecalculating}
              >
                {isRecalculating ? 'Recalculando...' : 'Recalcular Multas'}
              </Button>
              <Button variant="outline">
                Exportar Relatório
              </Button>
              <Button variant="outline">
                Enviar Lembretes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="plans">Planos de Pagamento</TabsTrigger>
          <TabsTrigger value="overdue">Em Atraso</TabsTrigger>
          <TabsTrigger value="by-group">Por Grupo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Esperado:</span>
                      <span className="font-semibold">{analytics?.totalExpected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Pago:</span>
                      <span className="font-semibold text-green-600">{analytics?.totalPaid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Restante:</span>
                      <span className="font-semibold text-orange-600">{analytics?.totalRemaining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Em Atraso:</span>
                      <span className="font-semibold text-red-600">{analytics?.overdueAmount}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span>Parcelas Pagas:</span>
                      <Badge variant="default">{analytics?.paidCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Parcelas Pendentes:</span>
                      <Badge variant="secondary">{analytics?.pendingCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Parcelas em Atraso:</span>
                      <Badge variant="destructive">{analytics?.overdueCount}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parcelas em Atraso</CardTitle>
              </CardHeader>
              <CardContent>
                {overdueInstallments && overdueInstallments.length > 0 ? (
                  <div className="space-y-3">
                    {overdueInstallments.slice(0, 5).map((installment) => (
                      <div key={installment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">Parcela {installment.installmentNumber}</p>
                          <p className="text-sm text-gray-500">
                            Venceu em {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            {formatCurrency(installment.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {overdueInstallments.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        E mais {overdueInstallments.length - 5} parcelas...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma parcela em atraso</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : plans && plans.length > 0 ? (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{plan.name}</h3>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={plan.isDefault ? 'default' : 'secondary'}>
                            {plan.isDefault ? 'Padrão' : 'Opcional'}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {plan.installmentCount} parcelas
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum plano de pagamento criado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parcelas em Atraso</CardTitle>
            </CardHeader>
            <CardContent>
              {overdueInstallments && overdueInstallments.length > 0 ? (
                <div className="space-y-4">
                  {overdueInstallments.map((installment) => (
                    <div key={installment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Parcela {installment.installmentNumber}</h3>
                          <p className="text-sm text-gray-500">
                            Venceu em {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            {formatCurrency(installment.remainingAmount)}
                          </p>
                          <Badge variant="destructive">Em Atraso</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma parcela em atraso</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-group" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos por Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="all">Todos os Grupos</option>
                  {groups?.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Selecione um grupo para ver os pagamentos específicos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
