import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { useEventGroups } from '../../hooks/useEventGroups';
import { Users, Settings, Trash2, Edit } from 'lucide-react';

interface GroupListProps {
  eventId: string;
  onEditGroup?: (groupId: string) => void;
  onManageGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

export const GroupList: React.FC<GroupListProps> = ({
  eventId,
  onEditGroup,
  onManageGroup,
  onDeleteGroup,
}) => {
  const { groups, isLoading, error, deleteGroup } = useEventGroups(eventId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Erro ao carregar grupos</p>
        </CardContent>
      </Card>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum grupo criado
          </h3>
          <p className="text-gray-500">
            Crie grupos para organizar os participantes do seu evento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <Badge
                  variant={group.status === 'active' ? 'default' : 'secondary'}
                >
                  {group.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditGroup?.(group.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageGroup?.(group.id)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar este grupo?')) {
                      deleteGroup(group.id);
                      onDeleteGroup?.(group.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {group.description && (
              <p className="text-gray-600 mb-4">{group.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {group.currentCount} inscritos
                </span>
                {group.capacity && (
                  <span>
                    Capacidade: {group.capacity}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Criado em {new Date(group.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
