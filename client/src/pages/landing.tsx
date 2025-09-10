import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CreditCard, BarChart3, Smartphone, Globe, Construction, MapPin, Phone, ExternalLink } from "lucide-react";

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

      {/* Hero Section - Em Reforma */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            {/* Ícone de Reforma */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                <Construction className="w-12 h-12 text-orange-600" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="text-hero-title">
              Estamos em
              <span className="text-orange-600"> Reforma </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
              Estamos trabalhando para trazer uma experiência ainda melhor para você. 
              Em breve, nossa plataforma estará de volta com novidades incríveis!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
                onClick={() => window.location.href = '/login'}
                data-testid="button-access-platform"
              >
                🔧 Acessar Plataforma
              </Button>
            </div>

            {/* Imagem de Reforma */}
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg shadow-2xl border border-orange-200 p-12">
                <div className="text-center">
                  <Construction className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Em Construção</h3>
                  <p className="text-gray-600">
                    Estamos aprimorando nossa plataforma para oferecer a melhor experiência possível
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo e Descrição */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">EventFlow</span>
              </div>
              <p className="text-gray-400">
                A plataforma brasileira para eventos profissionais
              </p>
            </div>

            {/* Localização */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-center md:justify-start">
                <MapPin className="w-5 h-5 mr-2" />
                Localização
              </h3>
              <p className="text-gray-400">
                Imperatriz - MA<br />
                Brasil
              </p>
            </div>

            {/* Contato */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-center md:justify-start">
                <Phone className="w-5 h-5 mr-2" />
                Contato
              </h3>
              <p className="text-gray-400 mb-2">
                <a href="tel:+5599984738118" className="hover:text-white transition-colors">
                  +55 (99) 98473-8118
                </a>
              </p>
            </div>
          </div>

          {/* Desenvolvido por */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 mb-2">
              Desenvolvido por{' '}
              <a 
                href="https://juliodevelop.online" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-300 transition-colors inline-flex items-center"
                style={{ fontFamily: '"Jersey 25 Charted", sans-serif' }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                  &lt;Julio/&gt;
                </span>
                <span className="text-gray-600 font-normal ml-1" style={{ marginLeft: '-0.5px' }}>
                  Develop
                </span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </p>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} EventFlow. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
