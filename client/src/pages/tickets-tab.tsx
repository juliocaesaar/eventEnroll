import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Ticket, Trash2, Edit, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TicketsTabProps {
  eventId: string;
  tickets: any[];
  refetchTickets: () => void;
}

export default function TicketsTab({ eventId, tickets, refetchTickets }: TicketsTabProps) {
  const { toast } = useToast();
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [ticketData, setTicketData] = useState({
    name: '',
    description: '',
    price: '0',
    quantity: 100,
    salesStart: '',
    salesEnd: '',
    minPerOrder: 1,
    maxPerOrder: 10,
    pixUrl: '',
  });
  const [priceError, setPriceError] = useState('');

  // Ticket management mutations
  const saveTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingTicket) {
        return apiRequest('PUT', `/api/events/${eventId}/tickets/${editingTicket.id}`, data);
      } else {
        return apiRequest('POST', `/api/events/${eventId}/tickets`, data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingTicket ? "Ingresso atualizado" : "Ingresso criado",
        description: "Ingresso salvo com sucesso!",
      });
      refetchTickets();
      setIsTicketDialogOpen(false);
      setEditingTicket(null);
      resetTicketForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar ingresso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest('DELETE', `/api/events/${eventId}/tickets/${ticketId}`);
    },
    onSuccess: () => {
      toast({
        title: "Ingresso removido",
        description: "Ingresso foi removido com sucesso!",
      });
      refetchTickets();
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover ingresso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetTicketForm = () => {
    setTicketData({
      name: '',
      description: '',
      price: '0',
      quantity: 100,
      salesStart: '',
      salesEnd: '',
      minPerOrder: 1,
      maxPerOrder: 10,
      pixUrl: '',
    });
    setPriceError('');
  };

  const validatePrice = (price: string) => {
    const numPrice = parseFloat(price) || 0;
    if (numPrice > 0 && numPrice < 5.00) {
      setPriceError('O preço deve ser de pelo menos R$ 5,00');
    } else {
      setPriceError('');
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTicketData(prev => ({ ...prev, price: value }));
    validatePrice(value);
  };

  const handleTicketSave = () => {
    if (!ticketData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o ingresso.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(ticketData.price) || 0;
    if (price > 0 && price < 5.00) {
      toast({
        title: "Preço inválido",
        description: "O preço do ingresso deve ser de pelo menos R$ 5,00.",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...ticketData,
      price: price,
      salesStart: ticketData.salesStart ? new Date(ticketData.salesStart).toISOString() : null,
      salesEnd: ticketData.salesEnd ? new Date(ticketData.salesEnd).toISOString() : null,
    };

    saveTicketMutation.mutate(submitData);
  };

  const handleEditTicket = (ticket: any) => {
    setEditingTicket(ticket);
    setTicketData({
      name: ticket.name || '',
      description: ticket.description || '',
      price: ticket.price?.toString() || '0',
      quantity: ticket.quantity || 100,
      salesStart: ticket.salesStart ? new Date(ticket.salesStart).toISOString().slice(0, 16) : '',
      salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd).toISOString().slice(0, 16) : '',
      minPerOrder: ticket.minPerOrder || 1,
      maxPerOrder: ticket.maxPerOrder || 10,
      pixUrl: ticket.pixUrl || '',
    });
    setPriceError(''); // Limpar erro ao editar
    setIsTicketDialogOpen(true);
  };

  const formatPrice = (price: any) => {
    const numPrice = parseFloat(price || 0);
    return numPrice === 0 ? 'Gratuito' : `R$ ${numPrice.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Ingressos</h2>
          <p className="text-gray-600">Crie e gerencie os tipos de ingresso para seu evento</p>
        </div>
        <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ticket" onClick={() => {
              setEditingTicket(null);
              resetTicketForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Ingresso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? 'Editar Ingresso' : 'Novo Ingresso'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ticket-name">Nome do Ingresso</Label>
                <Input
                  id="ticket-name"
                  value={ticketData.name}
                  onChange={(e) => setTicketData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Ingresso VIP, Meia-entrada..."
                  data-testid="input-ticket-name"
                />
              </div>
              
              <div>
                <Label htmlFor="ticket-description">Descrição</Label>
                <Textarea
                  id="ticket-description"
                  value={ticketData.description}
                  onChange={(e) => setTicketData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do ingresso e benefícios inclusos"
                  data-testid="textarea-ticket-description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticket-price">Preço (R$)</Label>
                  <Input
                    id="ticket-price"
                    type="number"
                    value={ticketData.price}
                    onChange={handlePriceChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    data-testid="input-ticket-price"
                    className={priceError ? "border-red-500" : ""}
                  />
                  {priceError && (
                    <p className="text-sm text-red-500 mt-1">{priceError}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="ticket-quantity">Quantidade</Label>
                  <Input
                    id="ticket-quantity"
                    type="number"
                    value={ticketData.quantity}
                    onChange={(e) => setTicketData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="100"
                    min="1"
                    data-testid="input-ticket-quantity"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="ticket-pix-url">URL do PIX (Copia e Cola)</Label>
                <Input
                  id="ticket-pix-url"
                  type="url"
                  value={ticketData.pixUrl}
                  onChange={(e) => setTicketData(prev => ({ ...prev, pixUrl: e.target.value }))}
                  placeholder="https://pix.example.com/..."
                  data-testid="input-ticket-pix-url"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Cole aqui a URL do PIX copia e cola para gerar o QR code de pagamento
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticket-sales-start">Início das Vendas</Label>
                  <Input
                    id="ticket-sales-start"
                    type="datetime-local"
                    value={ticketData.salesStart}
                    onChange={(e) => setTicketData(prev => ({ ...prev, salesStart: e.target.value }))}
                    data-testid="input-ticket-sales-start"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ticket-sales-end">Fim das Vendas</Label>
                  <Input
                    id="ticket-sales-end"
                    type="datetime-local"
                    value={ticketData.salesEnd}
                    onChange={(e) => setTicketData(prev => ({ ...prev, salesEnd: e.target.value }))}
                    data-testid="input-ticket-sales-end"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticket-min-order">Mín. por Pedido</Label>
                  <Input
                    id="ticket-min-order"
                    type="number"
                    value={ticketData.minPerOrder}
                    onChange={(e) => setTicketData(prev => ({ ...prev, minPerOrder: parseInt(e.target.value) || 1 }))}
                    min="1"
                    data-testid="input-ticket-min-order"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ticket-max-order">Máx. por Pedido</Label>
                  <Input
                    id="ticket-max-order"
                    type="number"
                    value={ticketData.maxPerOrder}
                    onChange={(e) => setTicketData(prev => ({ ...prev, maxPerOrder: parseInt(e.target.value) || 1 }))}
                    min="1"
                    data-testid="input-ticket-max-order"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsTicketDialogOpen(false)}
                  data-testid="button-cancel-ticket"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleTicketSave}
                  disabled={saveTicketMutation.isPending}
                  data-testid="button-save-ticket"
                >
                  {saveTicketMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ingresso criado</h3>
              <p className="text-gray-600 mb-4">
                Crie diferentes tipos de ingresso para seu evento com preços e quantidades personalizadas.
              </p>
              <Button onClick={() => setIsTicketDialogOpen(true)} data-testid="button-create-first-ticket">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Ingresso
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket: any) => (
            <Card key={ticket.id} data-testid={`ticket-card-${ticket.id}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{ticket.name}</h3>
                        <p className="text-2xl font-bold text-primary">{formatPrice(ticket.price)}</p>
                      </div>
                    </div>
                    
                    {ticket.description && (
                      <p className="text-gray-600 mb-3">{ticket.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{ticket.sold || 0} / {ticket.quantity} vendidos</span>
                      </div>
                      
                      {ticket.salesStart && (
                        <div>
                          <span className="font-medium">Venda inicia:</span> {new Date(ticket.salesStart).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      
                      {ticket.salesEnd && (
                        <div>
                          <span className="font-medium">Venda encerra:</span> {new Date(ticket.salesEnd).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTicket(ticket)}
                      data-testid={`button-edit-ticket-${ticket.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover este ingresso?')) {
                          deleteTicketMutation.mutate(ticket.id);
                        }
                      }}
                      disabled={deleteTicketMutation.isPending}
                      data-testid={`button-delete-ticket-${ticket.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Vendas</span>
                    <span>{Math.round(((ticket.sold || 0) / ticket.quantity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(((ticket.sold || 0) / ticket.quantity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}