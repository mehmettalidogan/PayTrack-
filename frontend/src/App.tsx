import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import Layout from './components/Layout'
import Login from './components/Login'
import CustomerManagement from './components/CustomerManagement'
import TransactionManagement from './components/TransactionManagement'
import Dashboard from './components/Dashboard'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState('')

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#2196F3',
        light: '#64B5F6',
        dark: '#1976D2',
      },
      secondary: {
        main: '#F50057',
        light: '#FF4081',
        dark: '#C51162',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1E1E1E' : '#ffffff',
      }
    },
    typography: {
      fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDarkMode 
              ? '0 4px 6px rgba(0, 0, 0, 0.2)' 
              : '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  })

  const handleLogin = (id: string) => {
    setUserId(id)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setUserId('')
    setIsLoggedIn(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {isLoggedIn ? (
          <Layout 
            onThemeToggle={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode}
            onLogout={handleLogout}
          >
            <Routes>
              <Route path="/dashboard" element={<Dashboard userId={userId} />} />
              <Route path="/customers" element={<CustomerManagement userId={userId} />} />
              <Route path="/transactions" element={<TransactionManagement userId={userId} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
