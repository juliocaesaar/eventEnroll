import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CreditCard, BarChart3, Smartphone, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EventFlow</span>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/login'}
            data-testid="button-login"
          >
            Entrar na Plataforma
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="text-hero-title">
              Crie Eventos
              <span className="text-primary"> Profissionais </span>
              em Minutos
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
              A plataforma mais completa do Brasil para gestão de eventos. 
              Editor visual, pagamentos PIX/Asaas, analytics em tempo real e teste grátis!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 text-white font-semibold shadow-lg"
                onClick={() => window.location.href = '/register'}
                data-testid="button-start-free"
              >
                🚀 Teste Grátis por 14 Dias
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => window.location.href = '/pricing'}
                data-testid="button-see-pricing"
              >
                Ver Preços
              </Button>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600" 
                alt="Dashboard do EventFlow" 
                className="rounded-lg shadow-2xl border border-gray-200"
                data-testid="img-hero-dashboard"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="text-features-title">
              Por que + de 5.000 organizadores escolhem o EventFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="text-features-description">
              A única plataforma que você precisa para criar, promover e gerenciar eventos profissionais no Brasil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-editor">
              <CardHeader>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Editor Drag & Drop</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Crie páginas profissionais sem conhecimento técnico. 
                  Interface intuitiva com componentes prontos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-payments">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Pagamentos via Asaas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  PIX instantâneo, cartão de crédito, boleto. Integração 
                  nativa com Asaas - gateway líder no Brasil.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-templates">
              <CardHeader>
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Templates Exclusivos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Bibliotecas específicas para igrejas, empresas, 
                  eventos sociais e culturais.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-analytics">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Analytics em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Acompanhe vendas, conversões e engajamento 
                  com dashboards detalhados.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-management">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Gestão Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Check-in por QR Code, comunicação automatizada 
                  e controle total dos participantes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-mobile">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle>Mobile-First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Experiência otimizada para dispositivos móveis. 
                  Funciona perfeitamente em qualquer tela.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="text-categories-title">
              Para todos os tipos de evento
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Templates e funcionalidades específicas para cada categoria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:scale-105 transition-transform cursor-pointer" data-testid="card-category-religious">
              <CardContent className="p-6">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                  alt="Eventos Religiosos" 
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-gray-900 mb-2">Eventos Religiosos</h3>
                <p className="text-sm text-gray-600">Retiros, conferências, acampamentos</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform cursor-pointer" data-testid="card-category-corporate">
              <CardContent className="p-6">
                <img 
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                  alt="Eventos Corporativos" 
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-gray-900 mb-2">Eventos Corporativos</h3>
                <p className="text-sm text-gray-600">Treinamentos, workshops, seminários</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform cursor-pointer" data-testid="card-category-social">
              <CardContent className="p-6">
                <img 
                  src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                  alt="Eventos Sociais" 
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-gray-900 mb-2">Eventos Sociais</h3>
                <p className="text-sm text-gray-600">Casamentos, aniversários, formaturas</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform cursor-pointer" data-testid="card-category-cultural">
              <CardContent className="p-6">
                <img 
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                  alt="Eventos Culturais" 
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-gray-900 mb-2">Eventos Culturais</h3>
                <p className="text-sm text-gray-600">Shows, festivais, exposições</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-title">
            Comece a criar eventos profissionais hoje
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
            Junte-se a milhares de organizadores que já confiam no EventFlow
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = '/register'}
              data-testid="button-cta-start"
            >
              🚀 Teste Grátis 14 Dias
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary"
              onClick={() => window.location.href = '/pricing'}
              data-testid="button-cta-pricing"
            >
              Ver Todos os Planos
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">EventFlow</span>
            </div>
            <p className="text-gray-400 mb-6">
              A plataforma brasileira para eventos profissionais
            </p>
            <div className="text-sm text-gray-500">
              © 2024 EventFlow. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
