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
  
  console.log('🔍 API Request Debug:', { method, url, token: headers.Authorization ? 'present' : 'missing' });
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (headers.Authorization) {
    console.log('🔑 Authorization header set:', headers.Authorization.substring(0, 20) + '...');
  } else {
    console.log('❌ No token found');
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  console.log('📡 Response status:', res.status, res.statusText);

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
      staleTime: Infinity,
      retry: false,
      // Evitar limpeza automática do cache
      gcTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});
