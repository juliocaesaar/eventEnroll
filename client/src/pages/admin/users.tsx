import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../hooks/useAuth';
import { useEventGroups } from '../../hooks/useEventGroups';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useToast } from '../../hooks/use-toast';
import { Search, Plus, Edit, Trash2, Shield, User, Mail, Calendar, Filter, Users, UserPlus } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'organizer' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  eventsCount: number;
  groupsCount: number;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Estados para formulário de criação
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Buscar usuários
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users'],
  }) as { data: { users: User[] }, isLoading: boolean, refetch: () => void };

  // Buscar eventos para seleção de grupos
  const { data: events } = useQuery({
    queryKey: ['/api/events'],
  });

  // Buscar grupos do evento selecionado
  const { groups } = useEventGroups(selectedEventId);

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Usuário criado com sucesso',
        description: data.tempPassword ? `Senha temporária: ${data.tempPassword}` : 'Usuário criado',
      });
      refetchUsers();
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string, userData: any }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Usuário atualizado com sucesso',
      });
      refetchUsers();
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Usuário deletado com sucesso',
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar usuário',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atribuir gestor a grupo
  const assignManagerMutation = useMutation({
    mutationFn: async ({ groupId, managerId }: { groupId: string, managerId: string }) => {
      const response = await apiRequest('POST', '/api/groups/assign-manager', { groupId, managerId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Gestor atribuído com sucesso',
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atribuir gestor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Funções de manipulação
  const handleCreateUser = (userData: any) => {
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (id: string, userData: any) => {
    updateUserMutation.mutate({ id, userData });
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este usuário?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleAssignManager = (groupId: string, managerId: string) => {
    assignManagerMutation.mutate({ groupId, managerId });
  };

  // Verificar se o usuário atual é admin
  const isAdmin = (currentUser as any)?.role === 'admin' || (currentUser as any)?.email === 'admin@eventsenroll.com';

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = usersData?.users || [];
  
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'organizer':
        return 'bg-blue-100 text-blue-800';
      case 'manager':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'organizer':
        return 'Organizador';
      case 'manager':
        return 'Gestor';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciar Usuários
        </h1>
        <p className="text-gray-600">
          Gerencie usuários, permissões e acessos ao sistema.
        </p>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Cargos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="organizer">Organizador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="usuario@exemplo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Nome"
                      value={newUserFirstName}
                      onChange={(e) => setNewUserFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Sobrenome"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha (opcional)</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Deixe vazio para gerar senha automática"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Cargo</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="manager">Gestor</SelectItem>
                        <SelectItem value="organizer">Organizador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewUserEmail('');
                        setNewUserFirstName('');
                        setNewUserLastName('');
                        setNewUserRole('');
                        setNewUserPassword('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => {
                        if (newUserEmail && newUserFirstName && newUserRole) {
                          handleCreateUser({
                            email: newUserEmail,
                            firstName: newUserFirstName,
                            lastName: newUserLastName,
                            role: newUserRole,
                            password: newUserPassword || undefined,
                          });
                        }
                      }}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {users.length}
            </div>
            <div className="text-sm text-gray-500">Total de Usuários</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u: any) => u.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Usuários Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter((u: any) => u.role === 'organizer').length}
            </div>
            <div className="text-sm text-gray-500">Organizadores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">
              {users.filter((u: any) => u.role === 'manager').length}
            </div>
            <div className="text-sm text-gray-500">Gestores</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleText(user.role)}
                          </Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {getStatusText(user.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Eventos</div>
                      <div className="font-semibold">{user.eventsCount}</div>
                      <div className="text-sm text-gray-500">Grupos</div>
                      <div className="font-semibold">{user.groupsCount}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Criado em {formatDate(user.createdAt)}</span>
                      </div>
                      {user.lastLogin && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Último login: {formatDate(user.lastLogin)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar usuário */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={editingUser.email}
                />
              </div>
              <div>
                <Label htmlFor="edit-firstName">Nome</Label>
                <Input
                  id="edit-firstName"
                  defaultValue={editingUser.firstName}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Sobrenome</Label>
                <Input
                  id="edit-lastName"
                  defaultValue={editingUser.lastName}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Cargo</Label>
                <Select 
                  defaultValue={editingUser.role}
                  onValueChange={(value) => {
                    setSelectedRole(value);
                    if (value !== 'manager') {
                      setSelectedEventId('');
                      setSelectedGroupId('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="manager">Gestor de Grupo</SelectItem>
                    <SelectItem value="organizer">Organizador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de grupo para gestores */}
              {selectedRole === 'manager' && (
                <>
                  <div>
                    <Label htmlFor="edit-event">Evento</Label>
                    <Select 
                      value={selectedEventId}
                      onValueChange={(value) => {
                        setSelectedEventId(value);
                        setSelectedGroupId('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {(events as any)?.map((event: any) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEventId && (
                    <div>
                      <Label htmlFor="edit-group">Grupo</Label>
                      <Select 
                        value={selectedGroupId}
                        onValueChange={setSelectedGroupId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups?.map((group: any) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedEventId && (!groups || groups.length === 0) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800">
                          Este evento não possui grupos. Crie grupos primeiro para atribuir um gestor.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={editingUser.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    if (editingUser) {
                      const userData = {
                        firstName: editingUser.firstName,
                        lastName: editingUser.lastName,
                        email: editingUser.email,
                        role: selectedRole || editingUser.role,
                        status: editingUser.status,
                      };
                      handleUpdateUser(editingUser.id, userData);
                    }
                  }}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
