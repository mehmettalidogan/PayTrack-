import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Fade,
  useTheme,
  Container,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

interface LoginProps {
  onLogin: (userId: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Kullanıcı adı ve şifre gerekli!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.user_id);
      } else {
        const data = await response.json();
        setError(data.error || 'Giriş başarısız!');
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(18, 18, 18, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Fade in timeout={800}>
          <Card
            sx={{
              width: '100%',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography 
                  variant="h3" 
                  component="h1"
                  sx={{ 
                    fontWeight: 700,
                    mb: 1,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #90CAF9 30%, #64B5F6 90%)'
                      : 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  PayTrack
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Müşteri Takip Sistemi
                </Typography>
              </Box>
              
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Kullanıcı Adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                />
                <TextField
                  label="Şifre"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleLogin}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: theme.shadows[2],
                    }
                  }}
                >
                  {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert 
          severity="error" 
          onClose={() => setError('')}
          variant="filled"
          sx={{ width: '100%', boxShadow: theme.shadows[3] }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login; 