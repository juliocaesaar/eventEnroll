import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Type, 
  Image, 
  MousePointer, 
  Heading1, 
  Trash2, 
  Move,
  Settings,
  Plus,
  LayoutTemplate
} from "lucide-react";
import { type Template } from "@shared/schema";

interface ComponentData {
  id: string;
  type: 'header' | 'text' | 'image' | 'button';
  props: Record<string, any>;
}

interface DragDropEditorProps {
  components: ComponentData[];
  onChange: (components: ComponentData[]) => void;
  templates?: Template[];
}

export default function DragDropEditor({ components, onChange, templates }: DragDropEditorProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);

  const componentTypes = [
    { type: 'header', label: 'Cabeçalho', icon: Heading1, color: 'bg-blue-100 text-blue-600' },
    { type: 'text', label: 'Texto', icon: Type, color: 'bg-green-100 text-green-600' },
    { type: 'image', label: 'Imagem', icon: Image, color: 'bg-purple-100 text-purple-600' },
    { type: 'button', label: 'Botão', icon: MousePointer, color: 'bg-orange-100 text-orange-600' },
  ];

  const handleDragStart = (e: React.DragEvent, type: string) => {
    setDraggedType(type);
    e.dataTransfer.setData('text/plain', type);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('text/plain');
    
    if (componentType) {
      const newComponent: ComponentData = {
        id: `${componentType}-${Date.now()}`,
        type: componentType as any,
        props: getDefaultProps(componentType),
      };
      
      onChange([...components, newComponent]);
    }
    setDraggedType(null);
  }, [components, onChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getDefaultProps = (type: string) => {
    switch (type) {
      case 'header':
        return { title: 'Título Principal', subtitle: 'Subtítulo opcional' };
      case 'text':
        return { content: 'Digite seu texto aqui...', size: 'medium' };
      case 'image':
        return { src: '', alt: 'Imagem', width: '100%' };
      case 'button':
        return { text: 'Clique Aqui', variant: 'primary', link: '#' };
      default:
        return {};
    }
  };

  const updateComponent = (id: string, props: Record<string, any>) => {
    const updated = components.map(comp => 
      comp.id === id ? { ...comp, props: { ...comp.props, ...props } } : comp
    );
    onChange(updated);
  };

  const removeComponent = (id: string) => {
    onChange(components.filter(comp => comp.id !== id));
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex(comp => comp.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= components.length) return;
    
    const newComponents = [...components];
    [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];
    onChange(newComponents);
  };

  const loadTemplate = (template: Template) => {
    if (template.components) {
      const templateComponents = Array.isArray(template.components) 
        ? template.components.map((comp: any, index: number) => ({
            id: `${comp.type}-${Date.now()}-${index}`,
            type: comp.type,
            props: comp.props || getDefaultProps(comp.type),
          }))
        : [];
      onChange(templateComponents);
    }
  };

  const renderComponent = (component: ComponentData) => {
    const isSelected = selectedComponent === component.id;
    
    return (
      <div 
        key={component.id}
        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary-300'
        }`}
        onClick={() => setSelectedComponent(component.id)}
        data-testid={`component-${component.type}-${component.id}`}
      >
        {/* Component Content */}
        <div className="pointer-events-none">
          {component.type === 'header' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {component.props.title || 'Título Principal'}
              </h2>
              {component.props.subtitle && (
                <p className="text-lg text-gray-600">{component.props.subtitle}</p>
              )}
            </div>
          )}
          
          {component.type === 'text' && (
            <div className={`text-gray-700 ${
              component.props.size === 'large' ? 'text-lg' : 
              component.props.size === 'small' ? 'text-sm' : 'text-base'
            }`}>
              {component.props.content || 'Digite seu texto aqui...'}
            </div>
          )}
          
          {component.type === 'image' && (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {component.props.src ? (
                <img 
                  src={component.props.src} 
                  alt={component.props.alt}
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <div className="text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p>Adicionar imagem</p>
                </div>
              )}
            </div>
          )}
          
          {component.type === 'button' && (
            <div className="text-center">
              <button 
                className={`px-6 py-3 rounded-lg font-medium ${
                  component.props.variant === 'primary' ? 'bg-primary text-white' :
                  component.props.variant === 'secondary' ? 'bg-secondary text-white' :
                  'bg-gray-200 text-gray-900'
                }`}
              >
                {component.props.text || 'Clique Aqui'}
              </button>
            </div>
          )}
        </div>
        
        {/* Controls */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 flex space-x-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-8 h-8 p-0 bg-white"
              onClick={(e) => {
                e.stopPropagation();
                moveComponent(component.id, 'up');
              }}
              data-testid={`button-move-up-${component.id}`}
            >
              ↑
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-8 h-8 p-0 bg-white"
              onClick={(e) => {
                e.stopPropagation();
                moveComponent(component.id, 'down');
              }}
              data-testid={`button-move-down-${component.id}`}
            >
              ↓
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-8 h-8 p-0 bg-white text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                removeComponent(component.id);
              }}
              data-testid={`button-remove-${component.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderComponentEditor = () => {
    const component = components.find(c => c.id === selectedComponent);
    if (!component) return null;

    return (
      <Card className="mt-4" data-testid="card-component-editor">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Editar {componentTypes.find(t => t.type === component.type)?.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {component.type === 'header' && (
            <>
              <div>
                <Label htmlFor="header-title">Título</Label>
                <Input
                  id="header-title"
                  value={component.props.title || ''}
                  onChange={(e) => updateComponent(component.id, { title: e.target.value })}
                  data-testid="input-header-title"
                />
              </div>
              <div>
                <Label htmlFor="header-subtitle">Subtítulo</Label>
                <Input
                  id="header-subtitle"
                  value={component.props.subtitle || ''}
                  onChange={(e) => updateComponent(component.id, { subtitle: e.target.value })}
                  data-testid="input-header-subtitle"
                />
              </div>
            </>
          )}
          
          {component.type === 'text' && (
            <>
              <div>
                <Label htmlFor="text-content">Conteúdo</Label>
                <Textarea
                  id="text-content"
                  value={component.props.content || ''}
                  onChange={(e) => updateComponent(component.id, { content: e.target.value })}
                  rows={3}
                  data-testid="textarea-text-content"
                />
              </div>
              <div>
                <Label htmlFor="text-size">Tamanho</Label>
                <Select 
                  value={component.props.size || 'medium'} 
                  onValueChange={(value) => updateComponent(component.id, { size: value })}
                >
                  <SelectTrigger data-testid="select-text-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {component.type === 'image' && (
            <>
              <div>
                <Label htmlFor="image-src">URL da Imagem</Label>
                <Input
                  id="image-src"
                  value={component.props.src || ''}
                  onChange={(e) => updateComponent(component.id, { src: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                  data-testid="input-image-src"
                />
              </div>
              <div>
                <Label htmlFor="image-alt">Texto Alternativo</Label>
                <Input
                  id="image-alt"
                  value={component.props.alt || ''}
                  onChange={(e) => updateComponent(component.id, { alt: e.target.value })}
                  data-testid="input-image-alt"
                />
              </div>
            </>
          )}
          
          {component.type === 'button' && (
            <>
              <div>
                <Label htmlFor="button-text">Texto do Botão</Label>
                <Input
                  id="button-text"
                  value={component.props.text || ''}
                  onChange={(e) => updateComponent(component.id, { text: e.target.value })}
                  data-testid="input-button-text"
                />
              </div>
              <div>
                <Label htmlFor="button-variant">Estilo</Label>
                <Select 
                  value={component.props.variant || 'primary'} 
                  onValueChange={(value) => updateComponent(component.id, { variant: value })}
                >
                  <SelectTrigger data-testid="select-button-variant">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primário</SelectItem>
                    <SelectItem value="secondary">Secundário</SelectItem>
                    <SelectItem value="outline">Contorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="button-link">Link</Label>
                <Input
                  id="button-link"
                  value={component.props.link || ''}
                  onChange={(e) => updateComponent(component.id, { link: e.target.value })}
                  placeholder="#"
                  data-testid="input-button-link"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      {templates && templates.length > 0 && (
        <Card data-testid="card-templates">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LayoutTemplate className="w-4 h-4" />
              <span>Templates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.slice(0, 4).map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto p-3 text-left"
                  onClick={() => loadTemplate(template)}
                  data-testid={`button-template-${template.id}`}
                >
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Palette */}
      <Card data-testid="card-component-palette">
        <CardHeader>
          <CardTitle>Componentes Disponíveis</CardTitle>
          <p className="text-sm text-gray-600">Arraste os componentes para o canvas</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {componentTypes.map(({ type, label, icon: Icon, color }) => (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                className={`border border-gray-200 rounded-lg p-3 text-center cursor-move hover:border-primary-300 hover:shadow-sm transition-all ${
                  draggedType === type ? 'opacity-50' : ''
                }`}
                data-testid={`component-palette-${type}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card data-testid="card-canvas">
        <CardHeader>
          <CardTitle>Canvas da Página</CardTitle>
          <p className="text-sm text-gray-600">
            {components.length === 0 
              ? 'Arraste componentes para cá para começar a construir sua página'
              : `${components.length} componente(s) adicionado(s)`
            }
          </p>
        </CardHeader>
        <CardContent>
          <div
            className={`min-h-[400px] border-2 border-dashed rounded-lg p-6 transition-colors ${
              draggedType ? 'border-primary bg-primary-50' : 'border-gray-300 bg-gray-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            data-testid="canvas-drop-zone"
          >
            {components.length === 0 ? (
              <div className="text-center py-16">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Arraste componentes para cá para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {components.map(renderComponent)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Component Editor */}
      {selectedComponent && renderComponentEditor()}
    </div>
  );
}
