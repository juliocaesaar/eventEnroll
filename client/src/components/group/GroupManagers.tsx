import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, UserPlus, UserMinus, Shield, Mail, Phone } from 'lucide-react';

interface GroupManager {
  id: string;
  userId: string;
  groupId: string;
  permissions: string[];
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  createdAt: string;
}

interface GroupManagersProps {
  groupId: string;
  onUpdate?: () => void;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function GroupManagers({ groupId, onUpdate }: GroupManagersProps) {
  const [managers, setManagers] = useState<GroupManager[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newManagerPermissions, setNewManagerPermissions] = useState<string[]>([]);
  const [addingManager, setAddingManager] = useState(false);
  const { toast } = useToast();

  const availablePermissions = [
    { value: 'read', label: 'Leitura', description: 'Visualizar dados do grupo' },
    { value: 'write', label: 'Escrita', description: 'Editar informações do grupo' },
    { value: 'payments', label: 'Pagamentos', description: 'Gerenciar pagamentos' },
    { value: 'participants', label: 'Participantes', description: 'Gerenciar participantes' }
  ];

  useEffect(() => {
    loadManagers();
    loadUsers();
  }, [groupId]);

  const loadManagers = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', `/api/groups/${groupId}/managers`);
      const data = await response.json();
      
      // Garantir que data seja um array
      if (Array.isArray(data)) {
        setManagers(data);
      } else if (data && Array.isArray(data.managers)) {
        setManagers(data.managers);
      } else {
        console.warn('Dados de gestores não são um array:', data);
        setManagers([]);
      }
    } catch (error) {
      console.error('Erro ao carregar gestores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os gestores do grupo.',
        variant: 'destructive',
      });
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiRequest('GET', '/api/users');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.warn('Dados de usuários não são um array:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    }
  };

  const handleAddManager = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um usuário.',
        variant: 'destructive',
      });
      return;
    }

    if (newManagerPermissions.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione pelo menos uma permissão.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAddingManager(true);
      const response = await apiRequest('POST', `/api/groups/assign-manager`, {
        groupId,
        managerId: selectedUserId,
        permissions: newManagerPermissions
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Gestor adicionado com sucesso!',
        });
        setSelectedUserId('');
        setNewManagerPermissions([]);
        setShowAddDialog(false);
        loadManagers();
        onUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar gestor');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar gestor:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o gestor.',
        variant: 'destructive',
      });
    } finally {
      setAddingManager(false);
    }
  };

  const handleRemoveManager = async (managerId: string) => {
    if (!confirm('Tem certeza que deseja remover este gestor?')) {
      return;
    }

    try {
      const response = await apiRequest('DELETE', `/api/groups/${groupId}/managers/${managerId}`);

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Gestor removido com sucesso!',
        });
        loadManagers();
        onUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao remover gestor');
      }
    } catch (error: any) {
      console.error('Erro ao remover gestor:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o gestor.',
        variant: 'destructive',
      });
    }
  };

  const togglePermission = (permission: string) => {
    setNewManagerPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const getPermissionBadge = (permission: string) => {
    const perm = availablePermissions.find(p => p.value === permission);
    return perm ? (
      <Badge key={permission} variant="secondary" className="text-xs">
        {perm.label}
      </Badge>
    ) : null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestores do Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestores do Grupo ({managers.length})
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                disabled={users.filter(user => !managers.some(manager => manager.userId === user.id)).length === 0}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Gestor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Gestor ao Grupo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">Selecionar Usuário</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um usuário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(user => !managers.some(manager => manager.userId === user.id))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="text-sm text-gray-500">{user.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {users.filter(user => !managers.some(manager => manager.userId === user.id)).length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Todos os usuários já são gestores deste grupo.
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>Permissões</Label>
                  <div className="space-y-2 mt-2">
                    {availablePermissions.map(permission => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={permission.value}
                          checked={newManagerPermissions.includes(permission.value)}
                          onChange={() => togglePermission(permission.value)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={permission.value} className="text-sm">
                          <div className="font-medium">{permission.label}</div>
                          <div className="text-gray-500 text-xs">{permission.description}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAddManager}
                    disabled={addingManager}
                    className="flex-1"
                  >
                    {addingManager ? 'Adicionando...' : 'Adicionar Gestor'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {managers.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum gestor adicionado ainda.</p>
            <p className="text-sm text-gray-500 mb-4">
              Adicione gestores para ajudar no gerenciamento do grupo.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Gestor
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {managers.map((manager) => (
              <div key={manager.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {manager.user.firstName?.[0]}{manager.user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {manager.user.firstName} {manager.user.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {manager.user.email}
                          {manager.user.phone && (
                            <>
                              <Phone className="w-3 h-3 ml-2" />
                              {manager.user.phone}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(manager.permissions) ? manager.permissions : []).map(getPermissionBadge)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Adicionado em {new Date(manager.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveManager(manager.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
