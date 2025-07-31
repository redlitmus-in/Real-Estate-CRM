import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Admin, Company } from '../types';
import { AuthService } from '../services/authService';

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: User | null;
  admin: Admin | null;
  currentCompany: Company | null;
  token: string | null;
  refreshToken: string | null;
  
  // Actions
  loginWithSupabase: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateCompany: (companyData: Partial<Company>) => void;
  setToken: (token: string) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      admin: null,
      currentCompany: null,
      token: null,
      refreshToken: null,

      // Actions
      loginWithSupabase: async (email: string, password: string) => {
        try {
          const authResponse = await AuthService.signInWithEmail(email, password);
          set({
            isAuthenticated: true,
            user: authResponse.user || null,
            admin: authResponse.admin || null,
            currentCompany: authResponse.company || null,
            token: authResponse.token,
            refreshToken: authResponse.refreshToken,
          });
        } catch (error) {
          console.error('Supabase login failed:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          await AuthService.signOut();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            admin: null,
            currentCompany: null,
            token: null,
            refreshToken: null,
          });
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      updateCompany: (companyData) => {
        const currentCompany = get().currentCompany;
        if (currentCompany) {
          set({
            currentCompany: { ...currentCompany, ...companyData },
          });
        }
      },

      setToken: (token) => {
        set({ token });
      },

      checkAuth: async () => {
        try {
          const authResponse = await AuthService.getCurrentUser();
          if (authResponse) {
            set({
              isAuthenticated: true,
              user: authResponse.user || null,
              admin: authResponse.admin || null,
              currentCompany: authResponse.company || null,
              token: authResponse.token,
              refreshToken: authResponse.refreshToken,
            });
          }
        } catch (error) {
          console.log('No valid Supabase session found');
          // Don't throw error, just means user needs to login
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        admin: state.admin,
        currentCompany: state.currentCompany,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Selectors
export const useAuth = () => {
  const store = useAuthStore();
  console.log('Auth state:', {
    isAuthenticated: store.isAuthenticated,
    isAdmin: !!store.admin,
    isCompanyUser: !!store.user,
  });
  return {
    isAuthenticated: store.isAuthenticated,
    user: store.user,
    admin: store.admin,
    currentCompany: store.currentCompany,
    isAdmin: !!store.admin,
    isCompanyUser: !!store.user,
  };
};

export const useAuthActions = () => {
  const store = useAuthStore();
  return {
    loginWithSupabase: store.loginWithSupabase,
    logout: store.logout,
    updateUser: store.updateUser,
    updateCompany: store.updateCompany,
    setToken: store.setToken,
    checkAuth: store.checkAuth,
  };
};