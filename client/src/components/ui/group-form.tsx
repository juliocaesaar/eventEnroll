import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useEventGroups } from '../../hooks/useEventGroups';
import { EventGroup } from '../../hooks/useEventGroups';

interface GroupFormProps {
  eventId: string;
  group?: EventGroup;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GROUP_COLORS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#84cc16', label: 'Lima' },
  { value: '#f97316', label: 'Laranja' },
];

export const GroupForm: React.FC<GroupFormProps> = ({
  eventId,
  group,
  onSuccess,
  onCancel,
}) => {
  const { createGroup, updateGroup, isCreating, isUpdating } = useEventGroups(eventId);
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    capacity: group?.capacity?.toString() || '',
    color: group?.color || '#3b82f6',
    status: group?.status || 'active',
    whatsappNumber: group?.whatsappNumber || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      name: formData.name,
      description: formData.description || undefined,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      color: formData.color,
      status: formData.status as 'active' | 'inactive',
      whatsappNumber: formData.whatsappNumber || undefined,
    };

    try {
      if (group) {
        updateGroup({ groupId: group.id, data: submitData });
      } else {
        createGroup({ ...submitData, eventId });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Grupo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Grupo A, Voluntários, VIP"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição opcional do grupo"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="capacity">Capacidade</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="Número máximo de participantes"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="color">Cor</Label>
            <Select
              value={formData.color}
              onValueChange={(value) => setFormData({ ...formData, color: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="whatsappNumber">WhatsApp do Grupo</Label>
          <Input
            id="whatsappNumber"
            type="tel"
            value={formData.whatsappNumber}
            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            placeholder="(11) 99999-9999"
          />
          <p className="text-xs text-gray-500 mt-1">
            Número específico do grupo para contato (formato: +5511999999999)
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : group ? 'Atualizar' : 'Criar Grupo'}
        </Button>
      </div>
    </form>
  );
};
