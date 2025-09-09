import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Badge } from './badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useToast } from '../../hooks/use-toast';
import { UserPlus, Trash2, Users, Mail, Calendar } from 'lucide-react';

interface ManagerAssignmentProps {
  eventId: string;
  onClose: () => void;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  capacity: number;
  currentCount: number;
}

interface GroupManager {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  assignedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export function ManagerAssignment({ eventId, onClose }: ManagerAssignmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Estados para criar gestor
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerFirstName, setNewManagerFirstName] = useState('');
  const [newManagerLastName, setNewManagerLastName] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');

  // Buscar usuários
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  }) as { data: { users: User[] }, isLoading: boolean };

  // Buscar grupos do evento
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/groups`],
  }) as { data: Group[], isLoading: boolean };

  // Buscar gestores de um grupo específico
  const { data: managersData, refetch: refetchManagers } = useQuery({
    queryKey: [`/api/groups/${selectedGroupId}/managers`],
    enabled: !!selectedGroupId,
  }) as { data: { managers: GroupManager[] }, refetch: () => void };

  // Mutation para atribuir gestor
  const assignManagerMutation = useMutation({
    mutationFn: async ({ groupId, managerId }: { groupId: string, managerId: string }) => {
      const response = await apiRequest('POST', '/api/groups/assign-manager', { groupId, managerId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Gestor atribuído com sucesso',
      });
      refetchManagers();
      setSelectedUserId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atribuir gestor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover gestor
  const removeManagerMutation = useMutation({
    mutationFn: async ({ groupId, managerId }: { groupId: string, managerId: string }) => {
      const response = await apiRequest('DELETE', '/api/groups/remove-manager', { groupId, managerId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Gestor removido com sucesso',
      });
      refetchManagers();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover gestor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Mutation para criar gestor diretamente
  const createManagerMutation = useMutation({
    mutationFn: async (managerData: any) => {
      const response = await apiRequest('POST', '/api/groups/create-manager', managerData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Gestor criado com sucesso',
        description: data.tempPassword ? `Senha temporária: ${data.tempPassword}` : 'Gestor criado',
      });
      refetchManagers();
      setShowCreateForm(false);
      // Limpar formulário
      setNewManagerEmail('');
      setNewManagerFirstName('');
      setNewManagerLastName('');
      setNewManagerPassword('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar gestor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const users = usersData?.users || [];
  const groups = groupsData || [];
  const managers = managersData?.managers || [];

  // Filtrar usuários que podem ser gestores
  const availableUsers = users.filter(user => 
    user.role === 'manager' && 
    !managers.some(manager => manager.userId === user.id) &&
    (user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssignManager = () => {
    if (selectedGroupId && selectedUserId) {
      assignManagerMutation.mutate({ groupId: selectedGroupId, managerId: selectedUserId });
    }
  };

  const handleRemoveManager = (managerId: string) => {
    if (selectedGroupId && window.confirm('Tem certeza que deseja remover este gestor?')) {
      removeManagerMutation.mutate({ groupId: selectedGroupId, managerId });
    }
  };

  const handleCreateManager = () => {
    if (selectedGroupId && newManagerEmail && newManagerFirstName) {
      createManagerMutation.mutate({
        email: newManagerEmail,
        firstName: newManagerFirstName,
        lastName: newManagerLastName,
        password: newManagerPassword || undefined,
        groupId: selectedGroupId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Gestores de Grupos</h2>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>

      {/* Seleção de Grupo */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-select">Grupo</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.currentCount}/{group.capacity} inscritos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedGroupId && (
        <>
          {/* Atribuir Novo Gestor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Atribuir Novo Gestor</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={!showCreateForm ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Usuário Existente
                  </Button>
                  <Button
                    variant={showCreateForm ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Criar Novo Gestor
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!showCreateForm ? (
                // Formulário para usuário existente
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-search">Buscar Usuário</Label>
                    <Input
                      id="user-search"
                      placeholder="Digite nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {availableUsers.length > 0 && (
                    <div>
                      <Label htmlFor="user-select">Usuário</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {availableUsers.length === 0 && searchTerm && (
                    <div className="text-sm text-gray-500">
                      Nenhum usuário encontrado com os critérios de busca.
                    </div>
                  )}

                  {availableUsers.length === 0 && !searchTerm && (
                    <div className="text-sm text-gray-500">
                      Todos os gestores disponíveis já foram atribuídos a este grupo.
                    </div>
                  )}

                  <Button
                    onClick={handleAssignManager}
                    disabled={!selectedUserId || assignManagerMutation.isPending}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {assignManagerMutation.isPending ? 'Atribuindo...' : 'Atribuir Gestor'}
                  </Button>
                </div>
              ) : (
                // Formulário para criar novo gestor
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-manager-email">Email</Label>
                    <Input
                      id="new-manager-email"
                      type="email"
                      placeholder="gestor@exemplo.com"
                      value={newManagerEmail}
                      onChange={(e) => setNewManagerEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-manager-firstname">Nome</Label>
                    <Input
                      id="new-manager-firstname"
                      placeholder="Nome do gestor"
                      value={newManagerFirstName}
                      onChange={(e) => setNewManagerFirstName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-manager-lastname">Sobrenome</Label>
                    <Input
                      id="new-manager-lastname"
                      placeholder="Sobrenome do gestor"
                      value={newManagerLastName}
                      onChange={(e) => setNewManagerLastName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-manager-password">Senha (opcional)</Label>
                    <Input
                      id="new-manager-password"
                      type="password"
                      placeholder="Deixe vazio para gerar senha automática"
                      value={newManagerPassword}
                      onChange={(e) => setNewManagerPassword(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleCreateManager}
                    disabled={!newManagerEmail || !newManagerFirstName || createManagerMutation.isPending}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {createManagerMutation.isPending ? 'Criando...' : 'Criar e Atribuir Gestor'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Gestores Atuais */}
          <Card>
            <CardHeader>
              <CardTitle>Gestores Atuais</CardTitle>
            </CardHeader>
            <CardContent>
              {managers.length > 0 ? (
                <div className="space-y-3">
                  {managers.map((manager) => (
                    <div
                      key={manager.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {manager.user.firstName} {manager.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {manager.user.email}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Atribuído em {new Date(manager.assignedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {manager.role === 'manager' ? 'Gestor' : manager.role}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveManager(manager.userId)}
                          disabled={removeManagerMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum gestor atribuído a este grupo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
