import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token) =>
        set({ user, token, isAuthenticated: true, isLoading: false }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isLoading: false }),

      updateUser: (data) =>
        set((state) => ({ user: { ...state.user, ...data } })),

      setLoading: (bool) => set({ isLoading: bool }),
    }),
    {
      name: 'aivora-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
