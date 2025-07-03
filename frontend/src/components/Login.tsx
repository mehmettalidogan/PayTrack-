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
  Link,
} from '@mui/material';
import { Login as LoginIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';

interface LoginProps {
  onLogin: (userId: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const theme = useTheme();

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Kullanıcı adı ve şifre gerekli!');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? 'http://localhost:5000/users/' : 'http://localhost:5000/login/';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegister) {
          setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
          setIsRegister(false);
          setConfirmPassword('');
        } else {
          onLogin(data.user_id);
        }
      } else {
        setError(data.error || (isRegister ? 'Kayıt başarısız!' : 'Giriş başarısız!'));
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 240, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        margin: 0,
        padding: 0
      }}
    >
      <Fade in timeout={800}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            },
            mx: 2
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
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500
                }}
              >
                {isRegister ? 'Yeni Hesap Oluştur' : 'Müşteri Takip Sistemi'}
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
              {isRegister && (
                <TextField
                  label="Şifre Tekrar"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              )}
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : (isRegister ? <PersonAddIcon /> : <LoginIcon />)}
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
                {loading 
                  ? (isRegister ? 'Kayıt Yapılıyor...' : 'Giriş Yapılıyor...') 
                  : (isRegister ? 'Kayıt Ol' : 'Giriş Yap')}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="text"
                  onClick={toggleMode}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      textDecoration: 'underline',
                      background: 'none'
                    }
                  }}
                >
                  {isRegister 
                    ? 'Zaten hesabınız var mı? Giriş yapın' 
                    : 'Hesabınız yok mu? Kayıt olun'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError('');
          setSuccess('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert 
          severity={error ? 'error' : 'success'} 
          onClose={() => {
            setError('');
            setSuccess('');
          }}
          variant="filled"
          sx={{ width: '100%', boxShadow: theme.shadows[3] }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login; 