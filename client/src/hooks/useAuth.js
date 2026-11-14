import useAuthStore from '../store/authStore'

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, login, logout, updateUser, setLoading } =
    useAuthStore()

  const isAdmin = user?.role === 'admin'
  const isStudent = user?.role === 'student'

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin,
    isStudent,
    login,
    logout,
    updateUser,
    setLoading,
  }
}

export default useAuth
