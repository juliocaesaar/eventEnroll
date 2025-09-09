import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Edit, Trash2, Shield, Users, Settings, Eye } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
}

export default function RoleManagement() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Mock data - em produção viria da API
  const mockPermissions: Permission[] = [
    // Eventos
    { id: 'events.create', name: 'Criar Eventos', description: 'Criar novos eventos', category: 'Eventos' },
    { id: 'events.edit', name: 'Editar Eventos', description: 'Editar eventos existentes', category: 'Eventos' },
    { id: 'events.delete', name: 'Deletar Eventos', description: 'Deletar eventos', category: 'Eventos' },
    { id: 'events.view', name: 'Visualizar Eventos', description: 'Visualizar eventos', category: 'Eventos' },
    
    // Participantes
    { id: 'participants.view', name: 'Visualizar Participantes', description: 'Visualizar lista de participantes', category: 'Participantes' },
    { id: 'participants.manage', name: 'Gerenciar Participantes', description: 'Gerenciar participantes', category: 'Participantes' },
    { id: 'participants.export', name: 'Exportar Participantes', description: 'Exportar dados de participantes', category: 'Participantes' },
    
    // Grupos
    { id: 'groups.create', name: 'Criar Grupos', description: 'Criar grupos de participantes', category: 'Grupos' },
    { id: 'groups.manage', name: 'Gerenciar Grupos', description: 'Gerenciar grupos existentes', category: 'Grupos' },
    { id: 'groups.delete', name: 'Deletar Grupos', description: 'Deletar grupos', category: 'Grupos' },
    
    // Pagamentos
    { id: 'payments.view', name: 'Visualizar Pagamentos', description: 'Visualizar informações de pagamento', category: 'Pagamentos' },
    { id: 'payments.manage', name: 'Gerenciar Pagamentos', description: 'Gerenciar pagamentos e parcelas', category: 'Pagamentos' },
    { id: 'payments.confirm', name: 'Confirmar Pagamentos', description: 'Confirmar pagamentos manualmente', category: 'Pagamentos' },
    
    // Analytics
    { id: 'analytics.view', name: 'Visualizar Analytics', description: 'Visualizar relatórios e analytics', category: 'Analytics' },
    { id: 'analytics.export', name: 'Exportar Relatórios', description: 'Exportar relatórios', category: 'Analytics' },
    
    // Administração
    { id: 'admin.users', name: 'Gerenciar Usuários', description: 'Gerenciar usuários do sistema', category: 'Administração' },
    { id: 'admin.roles', name: 'Gerenciar Cargos', description: 'Gerenciar cargos e permissões', category: 'Administração' },
    { id: 'admin.settings', name: 'Configurações do Sistema', description: 'Acessar configurações do sistema', category: 'Administração' },
  ];

  const mockRoles: Role[] = [
    {
      id: '1',
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      permissions: mockPermissions.map(p => p.id),
      userCount: 1,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Organizador',
      description: 'Pode criar e gerenciar eventos',
      permissions: [
        'events.create', 'events.edit', 'events.view',
        'participants.view', 'participants.manage', 'participants.export',
        'groups.create', 'groups.manage', 'groups.delete',
        'payments.view', 'payments.manage', 'payments.confirm',
        'analytics.view', 'analytics.export'
      ],
      userCount: 5,
      isSystem: false,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Gestor de Grupo',
      description: 'Pode gerenciar grupos e participantes',
      permissions: [
        'events.view',
        'participants.view', 'participants.manage',
        'groups.manage',
        'payments.view', 'payments.confirm',
        'analytics.view'
      ],
      userCount: 12,
      isSystem: false,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '4',
      name: 'Usuário',
      description: 'Acesso básico ao sistema',
      permissions: [
        'events.view',
        'participants.view',
        'payments.view'
      ],
      userCount: 50,
      isSystem: false,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  // Verificar se o usuário atual é admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'admin@eventsenroll.com';

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

  const filteredRoles = mockRoles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionCategory = (permissionId: string) => {
    return mockPermissions.find(p => p.id === permissionId)?.category || 'Outros';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const groupedPermissions = mockPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciar Cargos
        </h1>
        <p className="text-gray-600">
          Gerencie cargos e permissões do sistema.
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
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cargo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Cargo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-name">Nome do Cargo</Label>
                    <Input id="role-name" placeholder="Ex: Coordenador" />
                  </div>
                  <div>
                    <Label htmlFor="role-description">Descrição</Label>
                    <Textarea
                      id="role-description"
                      placeholder="Descrição do cargo e suas responsabilidades"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Permissões</Label>
                    <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category} className="mb-4">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                          <div className="space-y-2">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox id={permission.id} />
                                <Label htmlFor={permission.id} className="text-sm">
                                  {permission.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setShowCreateForm(false)}>
                      Criar Cargo
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
              {mockRoles.length}
            </div>
            <div className="text-sm text-gray-500">Total de Cargos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {mockRoles.filter(r => !r.isSystem).length}
            </div>
            <div className="text-sm text-gray-500">Cargos Personalizados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {mockPermissions.length}
            </div>
            <div className="text-sm text-gray-500">Permissões Disponíveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">
              {mockRoles.reduce((sum, role) => sum + role.userCount, 0)}
            </div>
            <div className="text-sm text-gray-500">Usuários Atribuídos</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cargos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRoles.length > 0 ? (
            <div className="space-y-4">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{role.name}</h3>
                          {role.isSystem && (
                            <Badge variant="secondary">Sistema</Badge>
                          )}
                        </div>
                        <p className="text-gray-600">{role.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{role.userCount} usuários</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Settings className="h-4 w-4" />
                            <span>{role.permissions.length} permissões</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRole(role)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRole(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja deletar este cargo?')) {
                              // Implementar delete
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cargo encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ver/editar cargo */}
      {editingRole && (
        <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Cargo: {editingRole.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role-name">Nome do Cargo</Label>
                  <Input
                    id="edit-role-name"
                    defaultValue={editingRole.name}
                    disabled={editingRole.isSystem}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role-users">Usuários Atribuídos</Label>
                  <Input
                    id="edit-role-users"
                    value={editingRole.userCount}
                    disabled
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-role-description">Descrição</Label>
                <Textarea
                  id="edit-role-description"
                  defaultValue={editingRole.description}
                  rows={3}
                  disabled={editingRole.isSystem}
                />
              </div>
              <div>
                <Label>Permissões</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission.id}`}
                              defaultChecked={editingRole.permissions.includes(permission.id)}
                              disabled={editingRole.isSystem}
                            />
                            <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingRole(null)}>
                  Fechar
                </Button>
                {!editingRole.isSystem && (
                  <Button onClick={() => setEditingRole(null)}>
                    Salvar Alterações
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
