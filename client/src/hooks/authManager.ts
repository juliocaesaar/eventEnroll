// Singleton para gerenciar estado de autenticação globalmente
class AuthManager {
  private static instance: AuthManager;
  private authState: {
    user: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
  } = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  };

  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 AuthManager: Initializing...');
    this.loadStoredAuth();
    this.setupStorageListener();
    this.isInitialized = true;
  }

  private loadStoredAuth() {
    try {
      const storedAuth = localStorage.getItem('eventflow_auth');
      const storedToken = localStorage.getItem('eventflow_token');
      
      console.log('🔄 AuthManager: Loading stored auth:', { 
        hasAuth: !!storedAuth, 
        hasToken: !!storedToken,
        tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : 'none'
      });
      
      if (storedAuth && storedToken) {
        const user = JSON.parse(storedAuth);
        console.log('✅ AuthManager: Found stored user:', user.email);
        this.authState = {
          user,
          isAuthenticated: true,
          isLoading: false,
          token: storedToken,
        };
        this.notifyListeners();
      } else {
        console.log('❌ AuthManager: No stored auth found');
        this.authState = {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          token: null,
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ AuthManager: Error loading auth:', error);
      this.clearAuth();
    }
  }

  private setupStorageListener() {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'eventflow_auth' || e.key === 'eventflow_token') {
        console.log('🔔 AuthManager: localStorage changed:', { key: e.key, newValue: e.newValue });
        if (!e.newValue) {
          console.log('⚠️ AuthManager: Auth data was cleared');
          this.clearAuth();
        } else {
          this.loadStoredAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
  }

  public saveAuth(user: any, token: string) {
    try {
      console.log('💾 AuthManager: Saving auth data:', { user: user.email, token: token.substring(0, 20) + '...' });
      
      // Limpar localStorage primeiro
      localStorage.removeItem('eventflow_auth');
      localStorage.removeItem('eventflow_token');
      
      // Salvar novos dados
      localStorage.setItem('eventflow_auth', JSON.stringify(user));
      localStorage.setItem('eventflow_token', token);
      
      // Verificar se foi salvo
      const savedAuth = localStorage.getItem('eventflow_auth');
      const savedToken = localStorage.getItem('eventflow_token');
      console.log('✅ AuthManager: Auth data saved and verified:', { 
        auth: savedAuth ? 'YES' : 'NO', 
        token: savedToken ? 'YES' : 'NO' 
      });
      
      // Atualizar estado
      this.authState = {
        user,
        isAuthenticated: true,
        isLoading: false,
        token,
      };
      
      this.notifyListeners();
      console.log('🎯 AuthManager: Auth state updated successfully');
    } catch (error) {
      console.error('❌ AuthManager: Error saving auth:', error);
    }
  }

  public clearAuth() {
    try {
      localStorage.removeItem('eventflow_auth');
      localStorage.removeItem('eventflow_token');
      
      this.authState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('❌ AuthManager: Error clearing auth:', error);
    }
  }

  public getAuthState() {
    return { ...this.authState };
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  public getAuthHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.authState.token) {
      headers['Authorization'] = `Bearer ${this.authState.token}`;
    }
    
    return headers;
  }
}

export const authManager = AuthManager.getInstance();
