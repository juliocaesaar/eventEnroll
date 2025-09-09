import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  BarChart3,
  Settings,
  UserCog,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: MenuItem[];
}

const getMainMenuItems = (userRole?: string): MenuItem[] => {
  // Menu para gestores
  if (userRole === 'manager') {
    return [
      {
        title: 'Meus Grupos',
        href: '/groups/dashboard',
        icon: Users,
      },
    ];
  }

  // Menu para admins e organizadores
  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Eventos',
      href: '/events',
      icon: Calendar,
    },
    {
      title: 'Grupos',
      href: '/groups/dashboard',
      icon: Users,
    },
  ];

  // Adicionar Teste PIX apenas para admins
  if (userRole === 'admin') {
    menuItems.push({
      title: 'Teste PIX',
      href: '/pix-test',
      icon: CreditCard,
      badge: 'Teste',
    });
  }

  return menuItems;
};

const adminMenuItems: MenuItem[] = [
  {
    title: 'Gerenciar Usuários',
    href: '/admin/users',
    icon: UserCog,
  },
  {
    title: 'Gerenciar Cargos',
    href: '/admin/roles',
    icon: Shield,
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamanho da tela e colapsar automaticamente
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileSize);
      
      // Colapsar automaticamente em mobile/tablet
      if (isMobileSize) {
        setIsCollapsed(true);
      }
    };

    // Verificar tamanho inicial
    checkScreenSize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const toggleCollapsed = () => {
    // Em mobile, sempre permitir toggle
    // Em desktop, permitir toggle normal
    if (isMobile) {
      setIsCollapsed(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = item.href ? isActive(item.href) : false;

    return (
      <div key={item.title}>
        {hasChildren ? (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start h-8 px-2',
              level > 0 && 'ml-4',
              active && 'bg-accent text-accent-foreground'
            )}
            onClick={() => toggleExpanded(item.title)}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-2" />
                )}
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start h-8 px-2',
              level > 0 && 'ml-4',
              active && 'bg-accent text-accent-foreground'
            )}
            asChild
          >
            <Link href={item.href || '#'}>
              <item.icon className="h-4 w-4 mr-2" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          </Button>
        )}

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-2 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.email === 'admin@eventsenroll.com';

  return (
    <>
      {/* Overlay para mobile quando sidebar está expandido */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <div className={cn(
        'flex h-full flex-col border-r bg-background transition-all duration-300',
        isMobile ? 'fixed left-0 top-0 z-50 w-64' : 'relative',
        isMobile && isCollapsed && '-translate-x-full',
        className
      )}>
        {/* Header */}
        <div className="flex h-14 items-center border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleCollapsed}
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
        {!isCollapsed && (
          <div className="ml-2">
            <h1 className="text-lg font-semibold">EventsEnroll</h1>
          </div>
        )}
        <div className="ml-auto">
          <ThemeSwitcher />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 py-1">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Principal
              </h2>
            </div>
          )}
          {getMainMenuItems((user as any)?.role).map(item => renderMenuItem(item))}

          {isAdmin && (
            <>
              <Separator className="my-4" />
              {!isCollapsed && (
                <div className="px-2 py-1">
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Administração
                  </h2>
                </div>
              )}
              {adminMenuItems.map(item => renderMenuItem(item))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* User Info */}
      <div className="border-t p-4">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {(user as any)?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
