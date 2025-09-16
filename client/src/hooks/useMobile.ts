import { useState, useEffect } from 'react';

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar no mount
    checkIsMobile();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
};

export const useMobileOptimizedQuery = (baseConfig: any) => {
  const isMobile = useMobile();

  return {
    ...baseConfig,
    staleTime: isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 min mobile, 5 min desktop
    gcTime: isMobile ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5 min mobile, 10 min desktop
    retry: isMobile ? 1 : 2, // Menos retries em mobile
  };
};
