import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Bell, Plus, ChevronDown, Menu, X, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { usePusher } from "@/hooks/usePusher";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  showCreateButton?: boolean;
  currentPage?: string;
}

export default function Header({ showCreateButton = true, currentPage }: HeaderProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useGlobalNotifications();
  const { isConnected } = usePusher();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const firstName = (user as any)?.firstName || 'Usuário';

  const navItems = [
    { href: "/dashboard", label: "Dashboard", isActive: currentPage === 'dashboard' || location === '/' || location === '/dashboard' },
    { href: "/events", label: "Eventos", isActive: currentPage === 'events' || location.startsWith('/events') },
    // Temporariamente desabilitado
    // { href: "/analytics", label: "Analytics", isActive: currentPage === 'analytics' || location.startsWith('/analytics') },
  ];

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-foreground">EventFlow</span>
              </div>
            </Link>
            
            {/* Status da conexão Pusher - apenas em desktop */}
            <div className="hidden sm:flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map(({ href, label, isActive }) => (
              <Link 
                key={href} 
                href={href} 
                className={`font-medium transition-colors ${
                  isActive 
                    ? 'text-primary border-b-2 border-primary pb-1' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
            {/* Notifications */}
            <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className="p-3 cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.read ? 'bg-muted-foreground' : 'bg-primary'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-center text-sm text-primary"
                      onClick={() => {
                        markAllAsRead();
                      }}
                    >
                      Marcar todas como lidas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Event Button */}
            {showCreateButton && (
              <Button 
                onClick={() => setLocation('/editor')}
                data-testid="button-create-event"
                size="sm"
                className="hidden lg:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            )}

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Avatar className="w-8 h-8" data-testid="avatar-user">
                    <AvatarImage src={(user as any)?.profileImageUrl || ''} alt={firstName} />
                    <AvatarFallback>{firstName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-medium text-foreground" data-testid="text-username">
                    {firstName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center space-x-2">
            {/* Mobile Notifications */}
            <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm">Notificações</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className="p-3 cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.read ? 'bg-muted-foreground' : 'bg-primary'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-center text-sm text-primary"
                      onClick={() => {
                        markAllAsRead();
                      }}
                    >
                      Marcar todas como lidas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={(user as any)?.profileImageUrl || ''} alt={firstName} />
                      <AvatarFallback>{firstName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{firstName}</span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {/* Navigation Links */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Navegação</h3>
                    {navItems.map(({ href, label, isActive }) => (
                      <Link 
                        key={href} 
                        href={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>

                  {/* Create Event Button */}
                  {showCreateButton && (
                    <div className="pt-4">
                      <Button 
                        onClick={() => {
                          setLocation('/editor');
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full"
                        data-testid="button-create-event-mobile"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Evento
                      </Button>
                    </div>
                  )}

                  {/* User Actions */}
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Conta</h3>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        setLocation('/profile');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Perfil
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        setLocation('/settings');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div>

                  {/* Connection Status */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className="text-muted-foreground">
                        {isConnected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
