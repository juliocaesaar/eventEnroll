import { Link, useLocation } from "wouter";
import { Home, Calendar, Plus, BarChart3, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, testId: "nav-dashboard" },
    { href: "/events", label: "Eventos", icon: Calendar, testId: "nav-events" },
    { href: "/editor", label: "Criar", icon: Plus, testId: "nav-create" },
    // Temporariamente desabilitado
    // { href: "/analytics", label: "Analytics", icon: BarChart3, testId: "nav-analytics" },
    { href: "/profile", label: "Perfil", icon: User, testId: "nav-profile" },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location === '/dashboard' || location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
      <div className="flex justify-around">
        {navItems.map(({ href, label, icon: Icon, testId }) => (
          <Link key={href} href={href}>
            <button 
              className={`flex flex-col items-center py-2 px-1 transition-colors ${
                isActive(href) 
                  ? 'text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid={testId}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
