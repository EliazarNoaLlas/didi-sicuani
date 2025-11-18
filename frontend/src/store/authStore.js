import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      userType: null, // 'passenger', 'driver', 'admin'

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          userType: user?.role || user?.userType,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          userType: null,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

