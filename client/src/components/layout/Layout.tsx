import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import Header from './Header';
import { usePusher } from '@/hooks/usePusher';

interface LayoutProps {
  children: ReactNode;
  showCreateButton?: boolean;
  currentPage?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function Layout({ 
  children, 
  showCreateButton = true, 
  currentPage,
  breadcrumbs = []
}: LayoutProps) {
  const [location] = useLocation();
  
  // Inicializar Pusher globalmente
  const { isConnected } = usePusher();

  // Auto-generate breadcrumbs based on current page if not provided
  const getBreadcrumbs = () => {
    if (breadcrumbs.length > 0) return breadcrumbs;

    const pathSegments = location.split('/').filter(Boolean);
    const generatedBreadcrumbs = [];

    // Add Dashboard as first breadcrumb
    generatedBreadcrumbs.push({ label: 'Dashboard', href: '/' });

    // Add other breadcrumbs based on path
    if (pathSegments.includes('events')) {
      generatedBreadcrumbs.push({ label: 'Eventos', href: '/events' });
      
      // If we're on a specific event page
      const eventIndex = pathSegments.indexOf('events');
      if (eventIndex !== -1 && pathSegments[eventIndex + 1]) {
        const eventId = pathSegments[eventIndex + 1];
        
        // Check if it's an edit page
        if (pathSegments.includes('edit')) {
          generatedBreadcrumbs.push({ label: 'Editar Evento', href: `/events/${eventId}/edit` });
        } else if (pathSegments.includes('participants')) {
          generatedBreadcrumbs.push({ label: 'Participantes', href: `/events/${eventId}/participants` });
        } else if (pathSegments.includes('analytics')) {
          generatedBreadcrumbs.push({ label: 'Analytics', href: `/events/${eventId}/analytics` });
        } else {
          generatedBreadcrumbs.push({ label: 'Detalhes do Evento', href: `/events/${eventId}` });
        }
      }
    } else if (pathSegments.includes('editor')) {
      generatedBreadcrumbs.push({ label: 'Criar Evento', href: '/editor' });
    } else if (pathSegments.includes('analytics')) {
      generatedBreadcrumbs.push({ label: 'Analytics', href: '/analytics' });
    }

    return generatedBreadcrumbs;
  };

  const finalBreadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Fixed Header */}
      <Header 
        showCreateButton={showCreateButton} 
        currentPage={currentPage}
      />

      {/* Main Content with proper spacing for fixed header */}
      <main className="pt-16">
        {/* Breadcrumbs */}
        {finalBreadcrumbs.length > 1 && (
          <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {finalBreadcrumbs.map((breadcrumb, index) => (
                    <li key={index} className="flex items-center">
                      {index > 0 && (
                        <svg
                          className="w-4 h-4 text-gray-400 mx-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {breadcrumb.href ? (
                        <a
                          href={breadcrumb.href}
                          className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {breadcrumb.label}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {breadcrumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
          <div className="w-full min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
