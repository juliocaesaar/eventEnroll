import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Importar AuthManager dinamicamente para evitar dependência circular
  const { authManager } = await import('../hooks/authManager');
  const headers = authManager.getAuthHeaders();
  
  // Reduzir logs para melhorar performance - apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 API Request:', { method, url, hasToken: !!headers.Authorization });
  }
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Log apenas erros para melhorar performance
  if (!res.ok) {
    console.log('❌ API Error:', res.status, res.statusText, url);
    
    // Log response body for 401 errors to help debug
    if (res.status === 401) {
      try {
        const errorBody = await res.clone().text();
        console.log('❌ 401 Error response body:', errorBody);
      } catch (e) {
        console.log('❌ Could not read 401 error response body');
      }
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('eventflow_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos - cache mais inteligente
      retry: (failureCount, error: any) => {
        // Não retry em mobile se for erro de rede
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          return failureCount < 1;
        }
        return failureCount < 2;
      },
      gcTime: 10 * 60 * 1000, // 10 minutos - limpeza mais eficiente
      // Otimizações de performance para mobile
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Configurações específicas para mobile
      networkMode: 'online',
      // Evitar refetch excessivo em mobile
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Menos retries em mobile
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          return failureCount < 1;
        }
        return failureCount < 2;
      },
    },
  },
});
