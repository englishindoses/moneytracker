import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import { SettingsProvider } from './lib/settings'
import { Login } from './pages/Login'
import { Month } from './pages/Month'
import { Months } from './pages/Months'
import { Settings } from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is per-user and rarely changes underneath you, so a short stale
      // time avoids refetching every time you flip between tabs.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

/** Hash routing rather than history: GitHub Pages serves static files, so a
 *  deep link like /m/2026-07-01 would 404 on first load, before the service
 *  worker is installed to answer it. */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <HashRouter>
            <Gate />
          </HashRouter>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function Gate() {
  const { session, loading } = useAuth()

  // Blank paper while we work out whether a stored session exists — stops the
  // notebook cover flashing up on every reload.
  if (loading) return <div className="paper-dots min-h-dvh" aria-busy="true" />

  if (!session) return <Login />

  return (
    <Routes>
      <Route path="/" element={<Months />} />
      <Route path="/m/:period" element={<Month />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
