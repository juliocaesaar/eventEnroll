import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { UserPlus, Trash2, Shield, Users, Settings } from 'lucide-react';

interface EventOrganizer {
  id: string;
  eventId: string;
  userId: string;
  role: string;
  permissions: string[];
  assignedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface EventOrganizersProps {
  eventId: string;
  onUpdate: () => void;
}

export default function EventOrganizers({ eventId, onUpdate }: EventOrganizersProps) {
  const [organizers, setOrganizers] = useState<EventOrganizer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newOrganizerPermissions, setNewOrganizerPermissions] = useState<string[]>([]);
  const [addingOrganizer, setAddingOrganizer] = useState(false);
  const { toast } = useToast();

  const availablePermissions = [
    { value: 'read', label: 'Leitura', description: 'Visualizar dados do evento' },
    { value: 'write', label: 'Escrita', description: 'Editar informações do evento' },
    { value: 'participants', label: 'Participantes', description: 'Gerenciar participantes' },
    { value: 'payments', label: 'Pagamentos', description: 'Gerenciar pagamentos' }
  ];

  useEffect(() => {
    loadOrganizers();
    loadUsers();
  }, [eventId]);

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', `/api/events/${eventId}/organizers`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setOrganizers(data);
      } else {
        console.warn('Dados de organizadores não são um array:', data);
        setOrganizers([]);
      }
    } catch (error) {
      console.error('Erro ao carregar organizadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os organizadores do evento.',
        variant: 'destructive',
      });
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiRequest('GET', '/api/users');
      const data = await response.json();
      
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.warn('Dados de usuários não são um array:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
      setUsers([]);
    }
  };

  const handleAddOrganizer = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Erro',
        description: 'Selecione um usuário para adicionar como organizador.',
        variant: 'destructive',
      });
      return;
    }

    if (newOrganizerPermissions.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma permissão.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAddingOrganizer(true);
      const response = await apiRequest('POST', `/api/events/${eventId}/organizers`, {
        userId: selectedUserId,
        role: 'organizer',
        permissions: newOrganizerPermissions
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Organizador adicionado com sucesso!',
        });
        setShowAddDialog(false);
        setSelectedUserId('');
        setNewOrganizerPermissions([]);
        loadOrganizers();
        onUpdate();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao adicionar organizador.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar organizador:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar organizador.',
        variant: 'destructive',
      });
    } finally {
      setAddingOrganizer(false);
    }
  };

  const handleRemoveOrganizer = async (organizerId: string) => {
    if (!confirm('Tem certeza que deseja remover este organizador?')) {
      return;
    }

    try {
      const response = await apiRequest('DELETE', `/api/event-organizers/${organizerId}`);

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Organizador removido com sucesso!',
        });
        loadOrganizers();
        onUpdate();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao remover organizador.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao remover organizador:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover organizador.',
        variant: 'destructive',
      });
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setNewOrganizerPermissions(prev => [...prev, permission]);
    } else {
      setNewOrganizerPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'default';
      case 'assistant':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'Organizador';
      case 'assistant':
        return 'Assistente';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  };

  const getPermissionLabel = (permission: string) => {
    const perm = availablePermissions.find(p => p.value === permission);
    return perm ? perm.label : permission;
  };

  // Filtrar usuários que já não são organizadores
  const availableUsers = users.filter(user => 
    !organizers.some(organizer => organizer.userId === user.id)
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Organizadores do Evento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Organizadores do Evento</span>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Organizador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Organizador</DialogTitle>
                <DialogDescription>
                  Selecione um usuário e suas permissões para adicionar como organizador do evento.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Usuário</label>
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
                
                <div>
                  <label className="text-sm font-medium">Permissões</label>
                  <div className="space-y-2 mt-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={newOrganizerPermissions.includes(permission.value)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission.value, checked as boolean)
                          }
                        />
                        <label htmlFor={permission.value} className="text-sm">
                          <div className="font-medium">{permission.label}</div>
                          <div className="text-gray-500 text-xs">{permission.description}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddOrganizer}
                    disabled={addingOrganizer || !selectedUserId || newOrganizerPermissions.length === 0}
                  >
                    {addingOrganizer ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {organizers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum organizador adicionado ainda.</p>
            <p className="text-sm">Adicione organizadores para compartilhar o gerenciamento do evento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizers.map((organizer) => (
              <div key={organizer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {organizer.user.firstName.charAt(0)}{organizer.user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {organizer.user.firstName} {organizer.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{organizer.user.email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(organizer.role)}>
                        {getRoleLabel(organizer.role)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Settings className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {organizer.permissions.map(getPermissionLabel).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveOrganizer(organizer.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
