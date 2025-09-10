import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Shield, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import EventOrganizers from '@/components/event/EventOrganizers';
import { useAuth } from '@/hooks/useAuth';

export default function EventManagementPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const eventId = params.eventId;

  const { data: event, isLoading: eventLoading, refetch } = useQuery({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  }) as { data: any, isLoading: boolean, refetch: () => void };

  if (!eventId) {
    return (
      <Layout currentPage="events">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">ID do evento não encontrado</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (eventLoading) {
    return (
      <Layout currentPage="events">
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout currentPage="events">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">Evento não encontrado</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Verificar se o usuário tem permissão para gerenciar organizadores
  const canManageOrganizers = user?.role === 'admin' || event.organizerId === user?.id;

  if (!canManageOrganizers) {
    return (
      <Layout currentPage="events">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">Você não tem permissão para gerenciar organizadores deste evento.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="events">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/events/${eventId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Evento</h1>
              <p className="text-gray-600">{event.title}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organizers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organizers" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Organizadores</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizers" className="space-y-6">
            <EventOrganizers eventId={eventId} onUpdate={refetch} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Evento</CardTitle>
                <CardDescription>
                  Configurações gerais e permissões do evento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Informações do Evento</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Título:</span>
                        <p className="font-medium">{event.title}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium capitalize">{event.status}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Organizador Principal:</span>
                        <p className="font-medium">{event.organizerId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Criado em:</span>
                        <p className="font-medium">
                          {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Permissões</h3>
                    <p className="text-sm text-gray-600">
                      Os organizadores adicionados terão acesso às funcionalidades selecionadas durante a adição.
                      O organizador principal sempre tem acesso total ao evento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
