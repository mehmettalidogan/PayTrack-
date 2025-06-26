import { useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './components/Login'
import CustomerManagement from './components/CustomerManagement'
import TransactionManagement from './components/TransactionManagement'

// Tema oluşturma
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
})

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
})

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const handleLogin = (newUserId: string) => {
    setUserId(newUserId)
  }

  const handleLogout = () => {
    setUserId(null)
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  if (!userId) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <BrowserRouter>
        <Layout 
          onThemeToggle={toggleTheme} 
          isDarkMode={isDarkMode}
          onLogout={handleLogout}
        >
          <Routes>
            <Route 
              path="/" 
              element={<Navigate to="/customers" replace />} 
            />
            <Route 
              path="/customers" 
              element={<CustomerManagement userId={userId} />} 
            />
            <Route 
              path="/transactions" 
              element={
                <TransactionManagement 
                  userId={userId}
                  onTransactionComplete={() => {
                    // Bu fonksiyon müşteri listesini yenilemek için kullanılabilir
                    // Şu an için boş bırakıyoruz
                  }}
                />
              } 
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
