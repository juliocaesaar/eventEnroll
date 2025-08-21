import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Save, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DragDropEditor from "@/components/ui/drag-drop-editor";
import { type InsertEventSchema } from "@shared/schema";

export default function EventEditor() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isPreview, setIsPreview] = useState(false);

  const [eventData, setEventData] = useState<any>({
    title: '',
    description: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    capacity: 100,
    status: 'draft',
    pageComponents: [],
  });

  const isEditing = !!params.id;

  // Fetch existing event if editing
  const { data: existingEvent } = useQuery({
    queryKey: [`/api/events/${params.id}`],
    enabled: isEditing,
  });

  // Fetch categories for select
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch templates for the selected category
  const { data: templates } = useQuery({
    queryKey: ["/api/templates"],
    queryKeyHashFn: () => eventData.categoryId ? `/api/templates?categoryId=${eventData.categoryId}` : '/api/templates',
  });

  // Load existing event data
  useEffect(() => {
    if (existingEvent) {
      setEventData({
        title: existingEvent.title || '',
        description: existingEvent.description || '',
        categoryId: existingEvent.categoryId || '',
        startDate: existingEvent.startDate ? new Date(existingEvent.startDate).toISOString().slice(0, 16) : '',
        endDate: existingEvent.endDate ? new Date(existingEvent.endDate).toISOString().slice(0, 16) : '',
        capacity: existingEvent.capacity || 100,
        status: existingEvent.status || 'draft',
        pageComponents: existingEvent.pageComponents || [],
      });
    }
  }, [existingEvent]);

  // Save event mutation
  const saveEventMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        return apiRequest('PUT', `/api/events/${params.id}`, data);
      } else {
        return apiRequest('POST', '/api/events', data);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Evento atualizado" : "Evento criado",
        description: isEditing ? "Seu evento foi atualizado com sucesso!" : "Seu evento foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (!isEditing) {
        setLocation('/events');
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar evento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Frontend validation
    if (!eventData.title?.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para o evento.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.categoryId) {
      toast({
        title: "Categoria obrigatória",
        description: "Por favor, selecione uma categoria para o evento.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.startDate) {
      toast({
        title: "Data de início obrigatória",
        description: "Por favor, defina a data de início do evento.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.endDate) {
      toast({
        title: "Data de fim obrigatória",
        description: "Por favor, defina a data de fim do evento.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...eventData,
      capacity: parseInt(eventData.capacity) || 100,
      // Make sure dates are in ISO format
      startDate: eventData.startDate ? new Date(eventData.startDate).toISOString() : null,
      endDate: eventData.endDate ? new Date(eventData.endDate).toISOString() : null,
    };
    
    console.log('Submitting event data:', submitData);
    saveEventMutation.mutate(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setEventData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleComponentsChange = (components: any[]) => {
    setEventData((prev: any) => ({
      ...prev,
      pageComponents: components,
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation(isEditing ? '/events' : '/')}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Editar Evento' : 'Novo Evento'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                onClick={() => setIsPreview(!isPreview)}
                data-testid="button-preview"
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreview ? 'Editor' : 'Visualizar'}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveEventMutation.isPending}
                data-testid="button-save-event"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveEventMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPreview ? (
          /* Preview Mode */
          <div className="bg-white rounded-lg shadow-sm border min-h-[600px]">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4" data-testid="text-preview-title">
                Visualização do Evento
              </h2>
              <p className="text-gray-600 mb-8">
                Aqui seria renderizada a página do evento com os componentes criados no editor
              </p>
              <div className="bg-gray-50 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-lg mb-2">{eventData.title || 'Título do Evento'}</h3>
                <p className="text-gray-600 mb-4">{eventData.description || 'Descrição do evento'}</p>
                <div className="space-y-2 text-sm">
                  {eventData.startDate && (
                    <p><strong>Início:</strong> {new Date(eventData.startDate).toLocaleString('pt-BR')}</p>
                  )}
                  {eventData.endDate && (
                    <p><strong>Fim:</strong> {new Date(eventData.endDate).toLocaleString('pt-BR')}</p>
                  )}
                  <p><strong>Capacidade:</strong> {eventData.capacity} pessoas</p>
                  <p><strong>Status:</strong> {eventData.status === 'active' ? 'Ativo' : eventData.status === 'draft' ? 'Rascunho' : 'Pausado'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Editor Mode */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Settings */}
            <div className="lg:col-span-1">
              <Card data-testid="card-event-settings">
                <CardHeader>
                  <CardTitle>Configurações do Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title">Título do Evento *</Label>
                    <Input
                      id="title"
                      value={eventData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Digite o título do evento"
                      data-testid="input-event-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={eventData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descreva seu evento"
                      rows={3}
                      data-testid="textarea-event-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={eventData.categoryId || ''} 
                      onValueChange={(value) => handleInputChange('categoryId', value)}
                      required
                    >
                      <SelectTrigger data-testid="select-event-category" className={!eventData.categoryId ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(categories) ? categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                    {!eventData.categoryId && (
                      <p className="text-sm text-red-600 mt-1">Categoria é obrigatória</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Data/Hora Início</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={eventData.startDate || ''}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        data-testid="input-event-start-date"
                        required
                        className={!eventData.startDate ? 'border-red-300' : ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Data/Hora Fim</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={eventData.endDate || ''}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        data-testid="input-event-end-date"
                        required
                        className={!eventData.endDate ? 'border-red-300' : ''}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="capacity">Capacidade</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={eventData.capacity || 0}
                      onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                      placeholder="Número máximo de participantes"
                      min="1"
                      data-testid="input-event-capacity"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={eventData.status || 'draft'} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger data-testid="select-event-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Drag & Drop Editor */}
            <div className="lg:col-span-2">
              <DragDropEditor
                components={eventData.pageComponents || []}
                onChange={handleComponentsChange}
                templates={Array.isArray(templates) ? templates : []}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
