import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { GroupList } from '../components/ui/group-list';
import { GroupForm } from '../components/ui/group-form';
import { ManagerAssignment } from '../components/ui/manager-assignment';
import { useEventGroups } from '../hooks/useEventGroups';
import { useAuth } from '../hooks/useAuth';
import { Plus, Users, Settings, UserPlus } from 'lucide-react';

export default function EventGroups() {
  const params = useParams();
  const eventId = params.eventId;
  const { user, isAuthenticated } = useAuth();
  
  console.log('=== EVENT GROUPS DEBUG ===');
  console.log('Params:', params);
  console.log('EventId:', eventId);
  console.log('User:', user);
  console.log('IsAuthenticated:', isAuthenticated);
  
  const { groups, isLoading } = useEventGroups(eventId || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [managingGroup, setManagingGroup] = useState<string | null>(null);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedGroupForManager, setSelectedGroupForManager] = useState<string | null>(null);

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

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Usuário não autenticado. Faça login para continuar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciar Grupos
        </h1>
        <p className="text-gray-600">
          Organize os participantes em grupos e designe gestores para cada um.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Estatísticas */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {groups?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Grupos Ativos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {groups?.reduce((sum, group) => sum + group.currentCount, 0) || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total de Participantes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Grupo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Grupo</DialogTitle>
                    </DialogHeader>
                    <GroupForm
                      eventId={eventId}
                      onSuccess={() => setShowCreateForm(false)}
                      onCancel={() => setShowCreateForm(false)}
                    />
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => window.location.href = `/events/${eventId}/participants`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Sem Grupos
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => window.location.href = `/events/${eventId}/analytics`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ver Analytics
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => setShowManagerModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Gerenciar Gestores
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de Grupos */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Grupos do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupList
                eventId={eventId}
                onEditGroup={(groupId) => setEditingGroup(groupId)}
                onManageGroup={(groupId) => setManagingGroup(groupId)}
                onDeleteGroup={() => {
                  // Refresh da lista será feito automaticamente pelo hook
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para editar grupo */}
      {editingGroup && (
        <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Grupo</DialogTitle>
            </DialogHeader>
            <GroupForm
              eventId={eventId}
              group={groups?.find(g => g.id === editingGroup)}
              onSuccess={() => setEditingGroup(null)}
              onCancel={() => setEditingGroup(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para gerenciar grupo */}
      {managingGroup && (
        <Dialog open={!!managingGroup} onOpenChange={() => setManagingGroup(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Grupo</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Funcionalidade de gerenciamento de grupo será implementada aqui.
                Incluirá: gestores, participantes, pagamentos, etc.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setManagingGroup(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Gerenciamento de Gestores */}
      {showManagerModal && (
        <Dialog open={showManagerModal} onOpenChange={setShowManagerModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <ManagerAssignment
              eventId={eventId}
              onClose={() => setShowManagerModal(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
